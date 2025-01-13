// src/components/features/APIStatus.jsx
// src/components/features/API/GetAPIStatus.tsx
import React from 'react';
import { useAPI } from '@/context/APIContext';
import { useAPIStatus } from '@/services/api/hooks/useAPIStatus';
import { ApiProvider } from '@/services/api/interfaces/api.types';

const APIStatus = () => {
  const { selectedAPI, setSelectedAPI } = useAPI();
  const { apiStatus } = useAPIStatus();

  const handleApiSelect = (api: string) => {
    switch (api) {
      case 'openai':
        setSelectedAPI(ApiProvider.OPENAI);
        break;
      case 'claude':
        setSelectedAPI(ApiProvider.CLAUDE);
        break;
      case 'ollama':
        setSelectedAPI(ApiProvider.OLLAMA);
        break;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-4">
        <select 
          value={selectedAPI}
          onChange={(e) => handleApiSelect(e.target.value)}
          className="bg-gray-700 rounded px-3 py-1 text-sm"
        >
          <option value={ApiProvider.OPENAI}>OpenAI</option>
          <option value={ApiProvider.CLAUDE}>Claude</option>
          <option value={ApiProvider.OLLAMA}>Ollama</option>
        </select>
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${
              apiStatus ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">{selectedAPI}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIStatus;