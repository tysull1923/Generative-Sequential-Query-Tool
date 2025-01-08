import { useState } from 'react';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatRequest } from '@/lib/api/openai.api-requests.types';
import { ApiProvider, ApiConfig } from '@/services/api/interfaces/api.types';

// Update ApiProvider type to include Ollama
type ExtendedApiProvider = ApiProvider | 'Ollama';

interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  temperature?: number;
}

export const useLangChainService = (
  systemContext: string,
  ollamaConfig?: OllamaConfig
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<HumanMessage | SystemMessage | AIMessage>>([]);
  const [apiKeyValue, setAPIKey] = useState<ApiConfig["apiKey"]>();

  const createModel = (selectedAPI: ExtendedApiProvider, apiKey?: string) => {
    switch (selectedAPI) {
      case 'OpenAI':
        return new ChatOpenAI({
          modelName: "gpt-3.5-turbo",
          temperature: 0.7,
          apiKey: apiKey,
        });
      case 'Anthropic':
        return new ChatAnthropic({
          modelName: "claude-3-sonnet-20240229",
          temperature: 0.7,
          anthropicApiKey: apiKey,
        });
      case 'Ollama':
        return new ChatOllama({
          baseUrl: ollamaConfig?.baseUrl || "http://localhost:11434",
          model: ollamaConfig?.model || "llama2",
          temperature: ollamaConfig?.temperature || 0.7,
        });
      default:
        throw new Error(`Unsupported API provider: ${selectedAPI}`);
    }
  };

  const convertToLangChainMessages = (
    requests: ChatRequest[],
    systemPrompt?: string
  ) => {
    const messages: Array<HumanMessage | SystemMessage | AIMessage> = [];
    
    if (systemPrompt) {
      messages.push(new SystemMessage({ content: systemPrompt }));
    }

    for (const request of requests) {
      if (request.type === 'chat') {
        messages.push(new HumanMessage({ content: request.content }));
      }
    }

    return messages;
  };

  const processRequests = async (
    requests: ChatRequest[], 
    selectedAPI: ExtendedApiProvider, 
    delay = 0
  ) => {
    console.log('Starting with history:', conversationHistory);
    setIsProcessing(true);

    try {
      let model;
      
      if (selectedAPI === 'Ollama') {
        // Create Ollama model with local configuration
        model = createModel('Ollama');
      } else {
        // Get API key for cloud providers
        const apiKey = selectedAPI === 'OpenAI' 
          ? (process.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY'))
          : (process.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('ANTHROPIC_API_KEY'));

        if (!apiKey) {
          throw new Error(`No API key found for ${selectedAPI}`);
        }

        setAPIKey(apiKey);
        model = createModel(selectedAPI, apiKey);
      }

      // Initialize message history with system context if provided
      let currentHistory = [...conversationHistory];
      if (systemContext && currentHistory.length === 0) {
        currentHistory = [new SystemMessage({ content: systemContext })];
      }

      // Process each request sequentially
      for (const request of requests) {
        if (request.type === 'chat') {
          // Add user message to history
          const userMessage = new HumanMessage({ content: request.content });
          currentHistory.push(userMessage);

          // Apply delay if specified
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          try {
            // Get response from model
            const response = await model.invoke(currentHistory);
            
            // Add assistant response to history
            currentHistory.push(new AIMessage({ content: response.content }));
            
            // Update request status and response
            request.response = response.content;
            request.status = 'completed';
          } catch (error) {
            console.error(`Error processing request with ${selectedAPI}:`, error);
            request.status = 'error';
            request.response = `Error: ${error.message}`;
            throw error;
          }
        }
      }

      // Update conversation history
      setConversationHistory(currentHistory);
      console.log('Updated history:', currentHistory);
      
      return requests;

    } catch (error) {
      console.error('LangChain request failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetHistory = () => {
    setConversationHistory([]);
  };

  const getModelInfo = async (selectedAPI: ExtendedApiProvider) => {
    if (selectedAPI === 'Ollama') {
      const model = createModel('Ollama');
      try {
        // Attempt to get model information
        const modelInfo = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/show`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: ollamaConfig?.model || "llama2"
          })
        }).then(res => res.json());
        
        return modelInfo;
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
    conversationHistory,
    resetHistory,
    getModelInfo
  };
};