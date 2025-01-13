import { useState, useEffect } from 'react';
import { openAIService } from '../services/api/implementations/openai';
import { anthropicService } from '../services/api/implementations/anthropic';

export const useApiConnection = (selectedAPI) => {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    const checkConnection = async () => {
      const apiKey = localStorage.getItem(
        selectedAPI === 'OpenAI' ? 'OPENAI_API_KEY' : 'CLAUDE_API_KEY'
      );
      
      if (!apiKey) {
        setStatus('disconnected');
        return;
      }

      const service = selectedAPI === 'OpenAI' ? openAIService : anthropicService;
      const isConnected = await service.checkConnection(apiKey);
      setStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkConnection();
  }, [selectedAPI]);

  return status;
};