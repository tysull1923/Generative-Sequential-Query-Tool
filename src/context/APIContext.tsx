// src/contexts/APIContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ApiProvider } from '@/services/api/interfaces/api.types';

interface APIContextType {
  selectedAPI: ApiProvider;
  apiKey: string | undefined;
  setSelectedAPI: (api: ApiProvider) => void;
  setAPIKey: (key: string) => void;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export const APIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAPI, setSelectedAPI] = useState<ApiProvider>(ApiProvider.OPENAI);
  const [apiKey, setAPIKey] = useState<string | undefined>();

  const handleSetSelectedAPI = useCallback((api: ApiProvider) => {
    setSelectedAPI(api);
  }, []);

  const handleSetAPIKey = useCallback((key: string) => {
    setAPIKey(key);
    // Store API key in localStorage
    localStorage.setItem(`${selectedAPI.toLowerCase()}_api_key`, key);
  }, [selectedAPI]);

  return (
    <APIContext.Provider 
      value={{
        selectedAPI,
        apiKey,
        setSelectedAPI: handleSetSelectedAPI,
        setAPIKey: handleSetAPIKey,
      }}
    >
      {children}
    </APIContext.Provider>
  );
};

export const useAPI = () => {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};