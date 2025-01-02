import { useState } from 'react';
import { openAIService } from '../services/openai';
import { anthropicService } from '../services/anthropic';

export const useApiRequests = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processRequests = async (requests, selectedAPI, delay = 0) => {
    setIsProcessing(true);
    const service = selectedAPI === 'OpenAI' ? openAIService : anthropicService;
    // const apiKey = localStorage.getItem(
    //   selectedAPI === 'OpenAI' ? 'OPENAI_API_KEY' : 'CLAUDE_API_KEY'
    // ) || import.meta.env.VITE_OPENAI_API_KEY;
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    for (const request of requests) {
      if (!isProcessing) break;
      
      try {
        request.status = 'in-progress';

        const response = await service.sendChat([{
          role: 'user',
          content: request.content
        }], apiKey);

        // Update request with response
        request.response = response.content;
        request.status = 'completed';

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
      } catch (error) {
        request.status = 'error';
        request.response = `Error: ${error.message}`;
      }
    }
    setIsProcessing(false);
  };

  return { processRequests, isProcessing, setIsProcessing };
};