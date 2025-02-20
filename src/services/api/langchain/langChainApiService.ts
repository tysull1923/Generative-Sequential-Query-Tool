import { useState } from 'react';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Ollama } from "@langchain/ollama";
import { BaseMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { RAGApiService } from '@/services/rag/ragApiService';
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

const RAG_PROMPT_TEMPLATE = `[INST] <<SYS>>
You are a helpful AI assistant. Use the following context to answer the question. 
If the context doesn't contain relevant information, draw from your general knowledge but mention this fact.
<</SYS>>

Context information:
{context}

Question: {question} [/INST]`;


export const useLangChainService = (
	containerId: string | null,
	systemContext: string,
	ollamaConfig?: OllamaConfig
) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [messageHistory, setMessageHistory] = useState<BaseMessage[]>([]);
	const [currentModel, setCurrentModel] = useState<BaseLanguageModel | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const ragService = RAGApiService.getInstance();

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
		context?: string,
		useRAG = true
	) => {
		setIsProcessing(true);

		try {
			const { api, config } = await getAvailableAPI();
			const activeAPI = selectedAPI || api;
			let activeModel = currentModel;

			if (!activeModel || currentModel?.constructor.name !== activeAPI) {
				activeModel = createModel({ ...config, provider: activeAPI });
				setCurrentModel(activeModel);
			}

			let currentHistory = [...messageHistory];
			if (context) {
				currentHistory.push(new SystemMessage({ content: context }));
			}

			for (const request of requests) {
				if (request.step === SequentialStepType.MESSAGE || request.number === 1) {
					try {
						let response;

						if (useRAG && containerId) {
							// Query RAG system for relevant context
							const ragResults = await ragService.query(containerId, request.content, {
								enabled: true,
								chunkSize: 512,
								chunkOverlap: 50,
								embedding: {
									model: 'nomic-embed-text',
									dimensions: 768
								},
								similarity: {
									threshold: 500,
									maxResults: 50
								}
							});
							console.log("RAG Results: ", ragResults.results);
							// Format context from RAG results
							const contextText = ragResults.results
								.map(result => result.content)
								.join('\n\n');
							console.log("Context Text: ", contextText);

							// Create RAG-aware prompt
							const promptTemplate = PromptTemplate.fromTemplate(RAG_PROMPT_TEMPLATE);

							// Create chain with RAG context
							const chain = RunnableSequence.from([
								promptTemplate,
								activeModel,
								new StringOutputParser()
							]);

							// Run chain with context and question
							response = await chain.invoke({
								context: contextText,
								question: request.content
							});

							// Add additional metadata about RAG usage
							request.metadata = {
								...request.metadata,
								ragEnabled: true,
								ragResults: ragResults.results.map(r => ({
									score: r.score,
									documentId: r.metadata.documentId
								}))
							};
						} else {
							// Regular processing without RAG
							const message = new HumanMessage({ content: request.content });
							currentHistory.push(message);
							response = await activeModel.invoke(currentHistory);
							request.metadata = { ...request.metadata, ragEnabled: false };
						}

						const aiMessage = new AIMessage({ content: response.toString() });
						currentHistory.push(aiMessage);

						request.response = {
							provider: Role.ASSISTANT,
							content: response.toString(),
							langChainMessage: aiMessage
						};
						request.status = ChatCardState.COMPLETE;

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









// const processRequests = async (
// 	requests: ChatRequest[] | string,
// 	selectedAPI: ApiProvider,
// 	delay = 0,
// 	context?: string
// ) => {
// 	console.log('Processing requests with history:', messageHistory);
// 	setIsProcessing(true);

// 	try {
// 		const { api, config } = await getAvailableAPI();
// 		const activeAPI = selectedAPI || api;

// 		let activeModel = currentModel;
// 		if (!activeModel || currentModel?.constructor.name !== activeAPI) {
// 			activeModel = createModel({ ...config, provider: activeAPI });
// 			setCurrentModel(activeModel);
// 		}

// 		if (!activeModel) {
// 			throw new Error('Failed to initialize language model');
// 		}

// 		// Use existing message history
// 		let currentHistory = [...messageHistory];

// 		// Handle single request case (string)
// 		// if (typeof requests === 'string') {
// 		//   const message = new HumanMessage({ content: requests });
// 		//   currentHistory.push(message);

// 		//   const response = await activeModel.invoke(currentHistory);
// 		//   const aiMessage = new AIMessage({ content: response.toString() });
// 		//   currentHistory.push(aiMessage);

// 		//   setMessageHistory(currentHistory);
// 		//   return [{
// 		//     id: Date.now().toString(),
// 		//     role: Role.USER,
// 		//     type: ChatType.BASE,
// 		//     content: requests,
// 		//     status: ChatCardState.COMPLETE,
// 		//     response: {
// 		//       provider: Role.ASSISTANT,
// 		//       content: response.toString(),
// 		//     },
// 		//     number: currentHistory.length / 2
// 		//   }];
// 		// }
// 		// Add system context if provided
// 		if (context) {
// 			console.log("Yes Context");
// 			currentHistory.push(new SystemMessage({ content: context }));
// 		}
// 		// Process multiple requests
// 		for (const request of requests) {
// 			console.log("Processing Request");
// 			console.log(request.step);
// 			console.log(request.number);

// 			if (request.step === SequentialStepType.MESSAGE || request.number === 1) {
// 				console.log("Request is Message");
// 				const message = new HumanMessage({ content: request.content });
// 				currentHistory.push(message);

// 				try {
// 					console.log("Trying to invoke model");
// 					const response = await activeModel.invoke(currentHistory);
// 					console.log("Model Invoked with history");
// 					const aiMessage = new AIMessage({ content: response.toString() });
// 					currentHistory.push(aiMessage);

// 					request.response = {
// 						provider: Role.ASSISTANT,
// 						content: response.toString(),
// 						langChainMessage: aiMessage
// 					};
// 					request.status = ChatCardState.COMPLETE;
// 					request.langChainMessage = message;
// 				} catch (error) {
// 					console.error(`Error processing request with ${activeAPI}:`, error);
// 					request.status = ChatCardState.ERROR;
// 					request.response = {
// 						provider: Role.ASSISTANT,
// 						content: `Error: ${error.message}`,
// 						responseType: { type: 'error', message: error.message, code: 'PROCESSING_ERROR' }
// 					};
// 					throw error;
// 				}
// 			}
// 		}

// 		setMessageHistory(currentHistory);
// 		return requests;

// 	} catch (error) {
// 		console.error('LangChain request failed:', error);
// 		throw error;
// 	} finally {
// 		setIsProcessing(false);
// 	}
// };


