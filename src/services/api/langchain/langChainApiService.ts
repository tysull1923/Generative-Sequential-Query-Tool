// // src/hooks/useLangChainService.ts
// import { useState } from 'react';
// import { ChatOpenAI } from "@langchain/openai";
// import { ChatAnthropic } from "@langchain/anthropic";
// import { Ollama } from "@langchain/ollama";
// import { BaseMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
// import { BaseChatModel } from "@langchain/core/language_models/chat_models";
// import { ChatRequest, ChatResponse, Role } from '@/utils/types/chat.types';
// import { ApiProvider } from '@/services/api/interfaces/api.types';
// import { useRAG } from '@/services/api/hooks/useRAG';
// import { RunnableSequence } from "@langchain/core/runnables";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { PromptTemplate } from "@langchain/core/prompts";

// export const useLangChainService = (
//   containerId: string,
//   containerType: 'chat' | 'project',
//   systemContext?: string,
//   ollamaConfig?: { baseUrl: string; modelName: string }
// ) => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [messageHistory, setMessageHistory] = useState<BaseMessage[]>([]);
//   const [currentModel, setCurrentModel] = useState<BaseChatModel | null>(null);
//   const rag = useRAG(containerId, containerType);

//   const contextTemplate = PromptTemplate.fromTemplate(`
//     Context information is below.
//     ---------------------
//     {context}
//     ---------------------
//     Given the context information and not prior knowledge, answer the question: {question}
//   `);

//   const processRequests = async (
//     requests: ChatRequest[],
//     selectedAPI: ApiProvider,
//     settings?: { temperature?: number; ragEnabled?: boolean }
//   ) => {
//     setIsProcessing(true);

//     try {
//       const model = await getModel(selectedAPI, settings?.temperature);
//       let currentHistory = [...messageHistory];

//       for (const request of requests) {
//         if (settings?.ragEnabled) {
//           // Query RAG system for relevant context
//           const ragResult = await rag.queryDocuments(request.content, {
//             chunkSize: 1000,
//             chunkOverlap: 200,
//             embedding: { model: 'default', dimensions: 1536 },
//             similarity: { threshold: 0.7, maxResults: 5 }
//           });

//           // Format context from RAG results
//           const context = ragResult.results
//             .map(result => result.content)
//             .join('\n\n');

//           // Create chain with RAG context
//           const chain = RunnableSequence.from([
//             contextTemplate,
//             model,
//             new StringOutputParser()
//           ]);

//           // Run chain with context and question
//           const response = await chain.invoke({
//             context,
//             question: request.content
//           });

//           // Add messages to history
//           const userMessage = new HumanMessage({ content: request.content });
//           const assistantMessage = new AIMessage({ content: response });
//           currentHistory.push(userMessage, assistantMessage);

//           // Update request with response
//           request.response = {
//             provider: Role.ASSISTANT,
//             content: response
//           };
//           request.status = 'complete';

//         } else {
//           // Regular processing without RAG
//           const userMessage = new HumanMessage({ content: request.content });
//           currentHistory.push(userMessage);

//           const response = await model.invoke(currentHistory);
//           const assistantMessage = new AIMessage({ content: response.toString() });
//           currentHistory.push(assistantMessage);

//           request.response = {
//             provider: Role.ASSISTANT,
//             content: response.toString()
//           };
//           request.status = 'complete';
//         }
//       }

//       setMessageHistory(currentHistory);
//       return requests;

//     } catch (error) {
//       console.error('LangChain request failed:', error);
//       throw error;
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const getModel = async (
//     selectedAPI: ApiProvider,
//     temperature = 0.7
//   ): Promise<BaseChatModel> => {
//     if (currentModel) return currentModel;

//     let model: BaseChatModel;

//     switch (selectedAPI) {
//       case ApiProvider.OPENAI:
//         model = new ChatOpenAI({
//           modelName: "gpt-3.5-turbo",
//           temperature,
//           openAIApiKey: process.env.VITE_OPENAI_API_KEY
//         });
//         break;

//       case ApiProvider.CLAUDE:
//         model = new ChatAnthropic({
//           modelName: "claude-3-sonnet-20240229",
//           temperature,
//           anthropicApiKey: process.env.VITE_ANTHROPIC_API_KEY
//         });
//         break;

//       case ApiProvider.OLLAMA:
//         model = new Ollama({
//           baseUrl: ollamaConfig?.baseUrl || "http://localhost:11434",
//           model: ollamaConfig?.modelName || "llama2",
//           temperature
//         });
//         break;

//       default:
//         throw new Error(`Unsupported API provider: ${selectedAPI}`);
//     }

//     setCurrentModel(model);
//     return model;
//   };

//   return {
//     processRequests,
//     isProcessing,
//     messageHistory,
//     rag  // Expose RAG functionality
//   };
// };






import { useState } from 'react';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Ollama } from "@langchain/ollama";
import { BaseMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ChatRequest, ChatCardState, ChatResponse, Role, SequentialStepType, ChatType } from '@/utils/types/chat.types';
import {
	ApiProvider,
	ApiConfig,
	OpenAIConfig,
	ClaudeConfig,
	OllamaConfig
} from '@/services/api/interfaces/api.types';

export const useLangChainService = (
	systemContext: string,
	ollamaConfig?: OllamaConfig
) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [messageHistory, setMessageHistory] = useState<BaseMessage[]>([]);
	const [currentModel, setCurrentModel] = useState<BaseLanguageModel | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	const checkApiKeys = () => {
		const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY');
		const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('ANTHROPIC_API_KEY');

		return {
			hasOpenAI: !!openaiKey,
			hasClaude: !!claudeKey,
			openaiKey,
			claudeKey
		};
	};

	const checkOllamaConnection = async () => {
		try {
			const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/version`);
			if (!response.ok) throw new Error('Failed to connect to Ollama');

			const data = await response.json();
			setIsConnected(true);
			return { connected: true, version: data.version };
		} catch (error) {
			setIsConnected(false);
			console.error('Ollama connection failed:', error);
			return { connected: false, error };
		}
	};
	const checkOpenAIConnection = async (apiKey: string) => {
		try {
			const model = new ChatOpenAI({
				modelName: "gpt-3.5-turbo",
				temperature: 0.7,
				openAIApiKey: apiKey
			});

			// Test the connection with a simple request
			await model.invoke([new HumanMessage({ content: "test" })]);

			return {
				connected: true,
				provider: ApiProvider.OPENAI,
				error: null
			};
		} catch (error) {
			return {
				connected: false,
				provider: ApiProvider.OPENAI,
				error: error.message
			};
		}
	};

	const checkClaudeConnection = async (apiKey: string) => {
		try {
			const model = new ChatAnthropic({
				modelName: "claude-3-sonnet-20240229",
				temperature: 0.7,
				anthropicApiKey: apiKey
			});

			// Test the connection with a simple request
			await model.invoke([new HumanMessage({ content: "test" })]);

			return {
				connected: true,
				provider: ApiProvider.CLAUDE,
				error: null
			};
		} catch (error) {
			return {
				connected: false,
				provider: ApiProvider.CLAUDE,
				error: error.message
			};
		}
	};

	const getAvailableAPI = async (): Promise<{ api: ApiProvider; config: Partial<ApiConfig> }> => {
		const { hasOpenAI, hasClaude, openaiKey, claudeKey } = checkApiKeys();

		if (hasOpenAI) {
			return {
				api: ApiProvider.OPENAI,
				config: {
					provider: ApiProvider.OPENAI,
					apiKey: openaiKey
				} as OpenAIConfig
			};
		}

		if (hasClaude) {
			return {
				api: ApiProvider.CLAUDE,
				config: {
					provider: ApiProvider.CLAUDE,
					anthropicApiKey: claudeKey
				} as ClaudeConfig
			};
		}

		const ollamaStatus = await checkOllamaConnection();
		if (ollamaStatus.connected) {
			return {
				api: ApiProvider.OLLAMA,
				config: {
					provider: ApiProvider.OLLAMA,
					baseUrl: ollamaConfig?.baseUrl || "http://localhost:11434",
					modelName: ollamaConfig?.modelName || "llama3.1"
				} as OllamaConfig
			};
		}

		throw new Error('No available API providers found. Please configure an API key or ensure Ollama is running.');
	};

	const createModel = (config: ApiConfig): BaseChatModel => {
		switch (config.provider) {
			case ApiProvider.OPENAI:
				return new ChatOpenAI({
					modelName: config.modelName || "gpt-3.5-turbo",
					temperature: config.temperature || 0.7,
					openAIApiKey: (config as OpenAIConfig).apiKey,
					streaming: config.streaming
				});

			case ApiProvider.CLAUDE:
				return new ChatAnthropic({
					modelName: config.modelName || "claude-3-sonnet-20240229",
					temperature: config.temperature || 0.7,
					anthropicApiKey: (config as ClaudeConfig).anthropicApiKey,
					streaming: config.streaming
				});

			case ApiProvider.OLLAMA:
				return new Ollama({
					baseUrl: (config as OllamaConfig).baseUrl,
					model: config.modelName || "llama3.1",
					temperature: config.temperature || 0.7
				});

			default:
				throw new Error(`Unsupported API provider: ${config.provider}`);
		}
	};

	const convertStoredMessageToLangChain = (message: ChatRequest): BaseMessage => {
		console.log("Got here" + message.role);

		switch (message.role) {
			case Role.SYSTEM:
				return new SystemMessage({ content: message.content });
			case Role.ASSISTANT:
				return new AIMessage({ content: message.response?.content || '' });
			case Role.USER:
			default:
				return new HumanMessage({ content: message.content });
		}
	};

	const initializeHistory = (messages: ChatRequest[], context?: string) => {
		let history: BaseMessage[] = [];

		// Add system context if provided
		if (context) {
			console.log("Yes Context");
			history.push(new SystemMessage({ content: context }));
		}

		// Convert existing messages to LangChain format
		messages.forEach(message => {
			// Add user message
			if (message.content) {
				history.push(convertStoredMessageToLangChain(message));
			}
			// Add assistant response if it exists
			if (message.response?.content) {
				history.push(new AIMessage({ content: message.response.content }));
			}
		});

		setMessageHistory(history);
		return history;
	};

	const processRequests = async (
		requests: ChatRequest[] | string,
		selectedAPI: ApiProvider,
		delay = 0,
		context?: string
	) => {
		console.log('Processing requests with history:', messageHistory);
		setIsProcessing(true);

		try {
			const { api, config } = await getAvailableAPI();
			const activeAPI = selectedAPI || api;

			let activeModel = currentModel;
			if (!activeModel || currentModel?.constructor.name !== activeAPI) {
				activeModel = createModel({ ...config, provider: activeAPI });
				setCurrentModel(activeModel);
			}

			if (!activeModel) {
				throw new Error('Failed to initialize language model');
			}

			// Use existing message history
			let currentHistory = [...messageHistory];

			// Handle single request case (string)
			// if (typeof requests === 'string') {
			//   const message = new HumanMessage({ content: requests });
			//   currentHistory.push(message);

			//   const response = await activeModel.invoke(currentHistory);
			//   const aiMessage = new AIMessage({ content: response.toString() });
			//   currentHistory.push(aiMessage);

			//   setMessageHistory(currentHistory);
			//   return [{
			//     id: Date.now().toString(),
			//     role: Role.USER,
			//     type: ChatType.BASE,
			//     content: requests,
			//     status: ChatCardState.COMPLETE,
			//     response: {
			//       provider: Role.ASSISTANT,
			//       content: response.toString(),
			//     },
			//     number: currentHistory.length / 2
			//   }];
			// }
			// Add system context if provided
			if (context) {
				console.log("Yes Context");
				currentHistory.push(new SystemMessage({ content: context }));
			}
			// Process multiple requests
			for (const request of requests) {
				console.log("Processing Request");
				console.log(request.step);
				console.log(request.number);

				if (request.step === SequentialStepType.MESSAGE || request.number === 1) {
					console.log("Request is Message");
					const message = new HumanMessage({ content: request.content });
					currentHistory.push(message);

					try {
						console.log("Trying to invoke model");
						const response = await activeModel.invoke(currentHistory);
						console.log("Model Invoked with history");
						const aiMessage = new AIMessage({ content: response.toString() });
						currentHistory.push(aiMessage);

						request.response = {
							provider: Role.ASSISTANT,
							content: response.toString(),
							langChainMessage: aiMessage
						};
						request.status = ChatCardState.COMPLETE;
						request.langChainMessage = message;
					} catch (error) {
						console.error(`Error processing request with ${activeAPI}:`, error);
						request.status = ChatCardState.ERROR;
						request.response = {
							provider: Role.ASSISTANT,
							content: `Error: ${error.message}`,
							responseType: { type: 'error', message: error.message, code: 'PROCESSING_ERROR' }
						};
						throw error;
					}
				}
			}

			setMessageHistory(currentHistory);
			return requests;

		} catch (error) {
			console.error('LangChain request failed:', error);
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};




	//Recently Worked 
	// const processRequests = async (
	//   requests: ChatRequest[], 
	//   selectedAPI: ApiProvider,
	//   delay = 0
	// ) => {
	//   console.log('Processing requests with history:', messageHistory);
	//   setIsProcessing(true);

	//   try {
	//     // Get available API and config
	//     console.log("getting API");
	//     const { api, config } = await getAvailableAPI();
	//     const activeAPI = selectedAPI || api;

	//     // Create or update model
	//     let activeModel = currentModel;
	//     if (!activeModel || currentModel?.constructor.name !== activeAPI) {
	//       activeModel = createModel({ ...config, provider: activeAPI });
	//       setCurrentModel(activeModel);
	//       console.log("model Created");
	//     }

	//     if (!activeModel) {
	//       throw new Error('Failed to initialize language model');
	//     }

	//     // Initialize message history with system context if provided
	//     let currentHistory = [...messageHistory];
	//     if (systemContext && currentHistory.length === 0) {
	//       const systemMsg = new SystemMessage({ content: systemContext });
	//       currentHistory = [systemMsg];
	//     }

	//     // Process each request sequentially
	//     for (const request of requests) {
	//       console.log("start handling requests");
	//       // // Handle Pause Step
	//       // if (request.step === SequentialStepType.PAUSE && request.isPaused) {
	//       //   request.status = ChatCardState.COMPLETE;
	//       //   // Exit the processing loop - will resume from next request when restarted
	//       //   break;
	//       // }

	//       // // Handle Delay Step
	//       // if (request.step === SequentialStepType.DELAY) {
	//       //   await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds delay
	//       //   request.status = ChatCardState.COMPLETE;
	//       //   continue; // Skip to next request
	//       // }

	//       // Only process message steps
	//       if (request.step === SequentialStepType.MESSAGE) {
	//         console.log("At process Message STEP");
	//         // Convert request to LangChain message
	//         const message = new HumanMessage({ content: request.content });
	//         currentHistory = [...currentHistory, message];

	//         // if (delay > 0) {
	//         //   await new Promise(resolve => setTimeout(resolve, delay));
	//         // }

	//         try {
	//           console.log("Trying to invoke model");
	//           const response = await activeModel.invoke(currentHistory);
	//           const aiMessage = new AIMessage({ content: response.toString() });
	//           currentHistory.push(aiMessage);

	//           // Update request with response
	//           request.response = {
	//             provider: Role.ASSISTANT,
	//             content: response.toString(),
	//             langChainMessage: aiMessage
	//           };
	//           request.status = ChatCardState.COMPLETE;
	//           console.log("Complete");
	//           request.langChainMessage = message;

	//         } catch (error) {
	//           console.error(`Error processing request with ${activeAPI}:`, error);
	//           request.status = ChatCardState.ERROR;
	//           request.response = {
	//             provider: Role.ASSISTANT,
	//             content: `Error: ${error.message}`,
	//             responseType: { type: 'error', message: error.message, code: 'PROCESSING_ERROR' }
	//           };
	//           throw error;
	//         }
	//       }
	//     }




	// Process each request sequentially
	// for (const request of requests) {
	//   // Convert request to LangChain message
	//   const message = new HumanMessage({ content: request.content });
	//   currentHistory = [...currentHistory, message];

	//   if (delay > 0) {
	//     await new Promise(resolve => setTimeout(resolve, delay));
	//   }

	//   try {
	//     const response = await activeModel.invoke(currentHistory);
	//     const aiMessage = new AIMessage({ content: response.toString() });
	//     currentHistory.push(aiMessage);

	//     // Update request with response
	//     request.response = {
	//       provider: Role.ASSISTANT,
	//       content: response.toString(),
	//       langChainMessage: aiMessage
	//     };
	//     request.status = ChatCardState.COMPLETE;
	//     request.langChainMessage = message;

	//   } catch (error) {
	//     console.error(`Error processing request with ${activeAPI}:`, error);
	//     request.status = ChatCardState.ERROR;
	//     request.response = {
	//       provider: Role.ASSISTANT,
	//       content: `Error: ${error.message}`,
	//       responseType: { type: 'error', message: error.message, code: 'PROCESSING_ERROR' }
	//     };
	//     throw error;
	//   }
	// }

	//need to fix in top part
	//     setMessageHistory(currentHistory);
	//     return requests;

	//   } catch (error) {
	//     console.error('LangChain request failed:', error);
	//     throw error;
	//   } finally {
	//     setIsProcessing(false);
	//   }
	// };

	const resetHistory = () => {
		setMessageHistory([]);
		if (systemContext) {
			setMessageHistory([new SystemMessage({ content: systemContext })]);
		}
	};

	const getModelInfo = async (provider: ApiProvider) => {
		if (provider === ApiProvider.OLLAMA) {
			try {
				const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/tags`);
				if (!response.ok) throw new Error('Failed to get Ollama models');
				return await response.json();
			} catch (error) {
				console.error('Failed to get Ollama model info:', error);
				return null;
			}
		}
		return null;
	};

	const checkConnection = async (provider?: ApiProvider) => {
		try {
			// If no provider specified, check the one based on configuration
			if (!provider) {
				const { api } = await getAvailableAPI();
				provider = api;
			}

			switch (provider) {
				case ApiProvider.OPENAI: {
					const apiKey = import.meta.env.VITE_OPENAI_API_KEY;// || localStorage.getItem('OPENAI_API_KEY');

					if (!apiKey) {
						return {
							connected: false,
							provider: ApiProvider.OPENAI,
							error: 'No API key found'
						};
					}
					return await checkOpenAIConnection(apiKey);
				}

				case ApiProvider.CLAUDE: {
					const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('ANTHROPIC_API_KEY');
					if (!apiKey) {
						return {
							connected: false,
							provider: ApiProvider.CLAUDE,
							error: 'No API key found'
						};
					}
					return await checkClaudeConnection(apiKey);
				}

				case ApiProvider.OLLAMA: {
					try {
						const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/version`);
						if (!response.ok) {
							throw new Error('Failed to connect to Ollama');
						}
						const data = await response.json();
						return {
							connected: true,
							provider: ApiProvider.OLLAMA,
							version: data.version,
							error: null
						};
					} catch (error) {
						return {
							connected: false,
							provider: ApiProvider.OLLAMA,
							error: error.message
						};
					}
				}

				default:
					return {
						connected: false,
						provider: provider,
						error: `Unsupported provider: ${provider}`
					};
			}
		} catch (error) {
			return {
				connected: false,
				provider: provider,
				error: error.message
			};
		}
	};

	return {
		processRequests,
		isProcessing,
		setIsProcessing,
		messageHistory,
		resetHistory,
		getModelInfo,
		checkConnection,
		isConnected,
		currentModel,
		initializeHistory
	};
};








