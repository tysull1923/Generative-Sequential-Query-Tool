// src/hooks/useChatHistory.ts

import { useState, useEffect } from 'react';
import { ChatRequest, ChatType, Role } from '@/utils/types/chat.types';

export const useChatHistory = (
  requests: ChatRequest[],
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>
) => {
  const [chatHistory, setChatHistory] = useState<ChatRequest[]>([]);

  useEffect(() => {
    // Update history when requests change
    const newHistory = requests
      .filter(req => req.response) // Only include completed requests
      .map(req => ({
        ...req,
        type: ChatType.SEQUENTIAL
      }));
    
    setChatHistory(newHistory);
  }, [requests]);

  const addToHistory = (request: ChatRequest, response: any) => {
    const updatedRequest = {
      ...request,
      response,
      type: ChatType.SEQUENTIAL
    };

    setChatHistory(prev => [...prev, updatedRequest]);
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  const removeFromHistory = (id: string) => {
    setChatHistory(prev => prev.filter(req => req.id !== id));
  };

  const restoreFromHistory = (id: string) => {
    const historyItem = chatHistory.find(req => req.id === id);
    if (historyItem) {
      setRequests(prev => [...prev, {
        ...historyItem,
        id: Date.now().toString(),
        status: 'ready'
      }]);
    }
  };

  return {
    chatHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
    restoreFromHistory
  };
};