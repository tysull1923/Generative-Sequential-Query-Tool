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
      const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/version`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to Ollama');
      }
      
      const data = await response.json();
      setIsConnected(true);
      return { connected: true, version: data.version };
    } catch (error) {
      setIsConnected(false);
      console.error('Ollama connection failed:', error);
      return { connected: false, error };
    }
  };

  const getAvailableAPI = async (): Promise<{ api: ExtendedApiProvider; apiKey?: string }> => {
    const { hasOpenAI, hasClaude, openaiKey, claudeKey } = checkApiKeys();
    
    // If we have API keys, use them in order of preference
    if (hasOpenAI) {
      return { api: 'OpenAI', apiKey: openaiKey };
    }
    if (hasClaude) {
      return { api: 'Anthropic', apiKey: claudeKey };
    }
    
    // If no API keys, check if Ollama is available
    try {
      const ollamaStatus = await checkOllamaConnection();
      if (ollamaStatus.connected) {
        return { api: 'Ollama' };
      }
    } catch (error) {
      console.error('Failed to connect to Ollama:', error);
    }
    
    throw new Error('No available API providers found. Please configure an API key or ensure Ollama is running.');
  };

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
          model: ollamaConfig?.model || "llama3.1",
          temperature: ollamaConfig?.temperature || 0.7,
        });
      default:
        throw new Error(`Unsupported API provider: ${selectedAPI}`);
    }
  };

  const processRequests = async (
    requests: ChatRequest[], 
    selectedAPI: ExtendedApiProvider, 
    delay = 0
  ) => {
    console.log('Starting with history:', conversationHistory);
    setIsProcessing(true);

    try {
      let activeAPI = selectedAPI;
      let activeApiKey;

      // If no API key is available for the selected API, get an available one
      if (selectedAPI !== 'Ollama') {
        const apiKey = selectedAPI === 'OpenAI' 
          ? (import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY'))
          : (import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('ANTHROPIC_API_KEY'));

        if (!apiKey) {
          console.log('No API key found, attempting to find available provider...');
          const available = await getAvailableAPI();
          activeAPI = available.api;
          activeApiKey = available.apiKey;
          console.log(`Defaulting to ${activeAPI}`);
        } else {
          activeApiKey = apiKey;
        }
      }

      // If we're using Ollama, verify the connection first
      if (activeAPI === 'Ollama') {
        const ollamaStatus = await checkOllamaConnection();
        if (!ollamaStatus.connected) {
          throw new Error('Failed to connect to Ollama. Please ensure Ollama is running.');
        }
      }

      // Create model with the active API
      const model = createModel(activeAPI, activeApiKey);

      // Initialize message history with system context if provided
      let currentHistory = [...conversationHistory];
      if (systemContext && currentHistory.length === 0) {
        currentHistory = [new SystemMessage({ content: systemContext })];
      }

      // Process each request sequentially
      for (const request of requests) {
        const messages = convertToLangChainMessages([request], systemContext);
        currentHistory = [...currentHistory, ...messages];

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
          const response = await model.invoke(currentHistory);
          const aiMessage = new AIMessage({ content: response.content });
          currentHistory.push(aiMessage);
          
          request.response = response.content;
          request.status = 'completed';
        } catch (error) {
          console.error(`Error processing request with ${activeAPI}:`, error);
          request.status = 'error';
          request.response = `Error: ${error.message}`;
          throw error;
        }
      }

      setConversationHistory(currentHistory);
      return requests;

    } catch (error) {
      console.error('LangChain request failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
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
      messages.push(new HumanMessage({ content: request.content }));
    }

    return messages;
  };

  const resetHistory = () => {
    setConversationHistory([]);
  };

  const getModelInfo = async (selectedAPI: ExtendedApiProvider) => {
    if (selectedAPI === 'Ollama') {
      try {
        const response = await fetch(`${ollamaConfig?.baseUrl || "http://localhost:11434"}/api/tags`, {
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error('Failed to get Ollama models');
        }
        
        const data = await response.json();
        return data.models;
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
    getModelInfo,
    checkConnection: checkOllamaConnection,
    isConnected
  };
};