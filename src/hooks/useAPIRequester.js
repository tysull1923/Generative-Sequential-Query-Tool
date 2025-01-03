import { useState } from 'react';
import { openAIService } from '../services/openai';
import { anthropicService } from '../services/anthropic';

export const useApiRequests = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const processRequests = async (requests, selectedAPI, delay = 0) => {
    console.log('Starting with history:', conversationHistory);
    setIsProcessing(true);

    try {
      const service = openAIService;
        //selectedAPI === 'OpenAI' ? openAIService : anthropicService;
        // const apiKey = localStorage.getItem(
        //   selectedAPI === 'OpenAI' ? 'OPENAI_API_KEY' : 'CLAUDE_API_KEY'
        // ) || import.meta.env.VITE_OPENAI_API_KEY;
    
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log('Got API key:', apiKey ? 'Yes' : 'No');
      const updatedHistory = [...conversationHistory];
      for (const request of requests) {
        if (request.type === 'chat') {
          updatedHistory.push({ role: 'user', content: request.content });
          const response = await service.sendChat(updatedHistory, apiKey);
          const assistantMessage = response.choices[0].message;
          updatedHistory.push(assistantMessage);
          request.response = assistantMessage.content;
          request.status = 'completed';
        }
      }

      setConversationHistory(updatedHistory);
      console.log(updatedHistory);
      return requests;

    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processRequests, isProcessing, setIsProcessing, conversationHistory };
};