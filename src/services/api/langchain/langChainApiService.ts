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
    delay = 0
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

  return {
    processRequests,
    isProcessing,
    setIsProcessing,
    messageHistory,
    resetHistory,
    getModelInfo,
    checkConnection: checkOllamaConnection,
    isConnected,
    currentModel,
    initializeHistory
  };
};








// import { useState } from 'react';
// import { ChatOpenAI } from "@langchain/openai";
// import { ChatAnthropic } from "@langchain/anthropic";
// //import { ChatOllama } from "@langchain/community/chat_models/ollama";
// import { Ollama } from "@langchain/ollama"
// import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
// import { ChatRequest, ChatCardState, ChatResponse, ChatDocument } from '@/utils/types/chat.types';
// import { ApiProvider, ApiConfig } from '@/services/api/interfaces/api.types';

// // Update ApiProvider type to include Ollama
// //type ExtendedApiProvider = ApiProvider | 'Ollama';

// interface OllamaConfig {
//   baseUrl?: string;
//   model?: string;
//   temperature?: number;
// }

// export const useLangChainService = (
//   systemContext: string,
//   ollamaConfig?: OllamaConfig
// ) => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [conversationHistory, setConversationHistory] = useState<Array<HumanMessage | SystemMessage | AIMessage>>([]);
//   const [apiKeyValue, setAPIKey] = useState<ApiConfig["apiKey"]>();
//   const [isConnected, setIsConnected] = useState(false);

//   const checkApiKeys = () => {
//     const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY');
//     const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('ANTHROPIC_API_KEY');
    
//     return {
//       hasOpenAI: !!openaiKey,
//       hasClaude: !!claudeKey,
//       openaiKey,
//       claudeKey
//     };
//   };

//   const checkOllamaConnection = async () => {
//     try {
//       const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/version`, {
//         method: 'GET',
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to connect to Ollama');
//       }
      
//       const data = await response.json();
//       setIsConnected(true);
//       return { connected: true, version: data.version };
//     } catch (error) {
//       setIsConnected(false);
//       console.error('Ollama connection failed:', error);
//       return { connected: false, error };
//     }
//   };

//   const getAvailableAPI = async (): Promise<{ api: ApiProvider; apiKey?: string }> => {
//     const { hasOpenAI, hasClaude, openaiKey, claudeKey } = checkApiKeys();
    
//     // If we have API keys, use them in order of preference
//     if (hasOpenAI) {
//       return { api: ApiProvider.OPENAI, apiKey: openaiKey };
//     }
//     if (hasClaude) {
//       return { api: ApiProvider.OLLAMA, apiKey: claudeKey };
//     }
    
//     // If no API keys, check if Ollama is available
//     try {
//       const ollamaStatus = await checkOllamaConnection();
//       if (ollamaStatus.connected) {
//         return { api: ApiProvider.OLLAMA };
//       }
//     } catch (error) {
//       console.error('Failed to connect to Ollama:', error);
//     }
    
//     throw new Error('No available API providers found. Please configure an API key or ensure Ollama is running.');
//   };

//   const createModel = (selectedAPI: ApiProvider, apiKey?: string) => {
//     switch (selectedAPI) {
//       case ApiProvider.OPENAI:
//         return new ChatOpenAI({
//           modelName: "gpt-3.5-turbo",
//           temperature: 0.7,
//           apiKey: apiKey,
//         });
//       case ApiProvider.CLAUDE:
//         return new ChatAnthropic({
//           modelName: "claude-3-sonnet-20240229",
//           temperature: 0.7,
//           anthropicApiKey: apiKey,
//         });
//       case ApiProvider.OLLAMA:
//         return new Ollama({
//           baseUrl: ollamaConfig?.baseUrl || "http://localhost:11434",
//           model: ollamaConfig?.model || "llama3.1",
//           temperature: ollamaConfig?.temperature || 0.7,
//         });
//       default:
//         throw new Error(`Unsupported API provider: ${selectedAPI}`);
//     }
//   };

//   const processRequests = async (
//     requests: ChatRequest[], 
//     selectedAPI: ApiProvider, 
//     delay = 0
//   ) => {
//     console.log('Starting with history:', conversationHistory);
//     setIsProcessing(true);

//     try {
//       let activeAPI = selectedAPI;
//       let activeApiKey;

//       // If no API key is available for the selected API, get an available one
//       if (selectedAPI !== ApiProvider.OLLAMA) {
//         const apiKey = selectedAPI === ApiProvider.OPENAI 
//           ? (import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY'))
//           : (import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('ANTHROPIC_API_KEY'));

//         if (!apiKey) {
//           console.log('No API key found, attempting to find available provider...');
//           const available = await getAvailableAPI();
//           activeAPI = available.api;
//           activeApiKey = available.apiKey;
//           console.log(`Defaulting to ${activeAPI}`);
//         } else {
//           activeApiKey = apiKey;
//         }
//       }

//       // If we're using Ollama, verify the connection first
//       if (activeAPI === ApiProvider.OLLAMA) {
//         const ollamaStatus = await checkOllamaConnection();
//         if (!ollamaStatus.connected) {
//           throw new Error('Failed to connect to Ollama. Please ensure Ollama is running.');
//         }
//       }

//       // Create model with the active API
//       const model = createModel(activeAPI, activeApiKey);

//       // Initialize message history with system context if provided
//       let currentHistory = [...conversationHistory];
//       if (systemContext && currentHistory.length === 0) {
//         currentHistory = [new SystemMessage({ content: systemContext })];
//       }

//       // Process each request sequentially
//       for (const request of requests) {
//         const messages = convertToLangChainMessages([request], systemContext);
//         currentHistory = [...currentHistory, ...messages];

//         if (delay > 0) {
//           await new Promise(resolve => setTimeout(resolve, delay));
//         }

//         try {
//           const response = await model.invoke(currentHistory);
//           const aiMessage = new AIMessage({ content: response.toString() });
//           currentHistory.push(aiMessage);
          
//           request.response.content = response.toString();
//           request.status = ChatCardState.COMPLETE;
//         } catch (error) {
//           console.error(`Error processing request with ${activeAPI}:`, error);
//           request.status = ChatCardState.ERROR;
//           request.response.content = "Error:" + error.message.toString();
//           throw error;
//         }
//       }

//       setConversationHistory(currentHistory);
//       return requests;

//     } catch (error) {
//       console.error('LangChain request failed:', error);
//       throw error;
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const convertToLangChainMessages = (
//     requests: ChatRequest[],
//     systemPrompt?: string
//   ) => {
//     const messages: Array<HumanMessage | SystemMessage | AIMessage> = [];
    
//     if (systemPrompt) {
//       messages.push(new SystemMessage({ content: systemPrompt }));
//     }

//     for (const request of requests) {
//       messages.push(new HumanMessage({ content: request.content }));
//     }

//     return messages;
//   };

//   const resetHistory = () => {
//     setConversationHistory([]);
//   };

//   const getModelInfo = async (selectedAPI: ApiProvider) => {
//     if (selectedAPI === ApiProvider.OLLAMA) {
//       try {
//         const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/tags`, {
//           method: 'GET'
//         });
        
//         if (!response.ok) {
//           throw new Error('Failed to get Ollama models');
//         }
        
//         const data = await response.json();
//         return data.models;
//       } catch (error) {
//         console.error('Failed to get Ollama model info:', error);
//         return null;
//       }
//     }
//     return null;
//   };

//   return { 
//     processRequests, 
//     isProcessing, 
//     setIsProcessing, 
//     conversationHistory,
//     resetHistory,
//     getModelInfo,
//     checkConnection: checkOllamaConnection,
//     isConnected
//   };
// };