import { useState, useEffect } from 'react';
import { validateOpenAIKey, validateClaudeKey } from '../services/api/utils/apiKeyValidator';
import { ApiProvider, ApiConfig, ApiStatus } from '@/services/api/interfaces/api.types';

export function useAPIStatus() {
  const [apiStatus, setApiStatus] = useState<ApiStatus["isAvailable"]>(false);
  useEffect(() => {
    checkAPIStatus();
  }, []);
  const [openaiKey, setOpenAIKey] = useState<ApiConfig["apiKey"]>();

  const checkAPIStatus = async () => {
    // Get API keys from environment variables or local storage
    const openaiKeyString = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;
    const claudeKey = localStorage.getItem('claude_api_key') || import.meta.env.VITE_ANTHROPIC_API_KEY;
    setOpenAIKey(openaiKeyString);
    // Check OpenAI API status
    if (openaiKey) {
      const isOpenAIValid = await validateOpenAIKey(openaiKey);
      setApiStatus(true);
    } else {
      setApiStatus(false);
    }

    // Check Claude API status
    if (claudeKey) {
      const isClaudeValid = await validateClaudeKey(claudeKey);
      setApiStatus(true);
    } else {
      setApiStatus(false);
    }
  };

  const updateAPIKey = async (provider: ApiProvider, key: ApiConfig["apiKey"]) => {
    localStorage.setItem(`${provider}_api_key`, key);
    
    // Validate and update status for the specific provider
    if (provider === 'openai') {
      const isValid = await validateOpenAIKey(key);
      setApiStatus(true);
      return isValid;
    } else if (provider === 'claude') {
      const isValid = await validateClaudeKey(key);
      setApiStatus(false);
      return isValid;
    }
    return false;
  };

  return {
    apiStatus,
    checkAPIStatus,
    updateAPIKey
  };
}

// import { useState, useEffect } from 'react';
// import ApiStatusService from '@/services/api/implementations/ApiStatusService';
// import {
//   ApiProvider,
//   ApiStatus,
//   ApiStatusEvent,
//   ApiStatusEventType,
// } from '@/services/api/interfaces/ApiStatus.interface';
// import { ApiConfig } from '@/services/api/interfaces/api.types';

// interface UseApiStatusResult {
//   statuses: Map<ApiConfig["name"], ApiStatus>;
//   getStatus: (provider: ApiProvider) => ApiStatus | undefined;
//   getStatusHistory: (provider: ApiProvider) => { timestamp: Date; status: ApiStatus }[];
//   isAnyApiDown: boolean;
//   lastEvent: ApiStatusEvent | null;
// }

// export const useApiStatus = (): UseApiStatusResult => {
//   const [statuses, setStatuses] = useState<Map<ApiProvider, ApiStatus>>(new Map());
//   const [lastEvent, setLastEvent] = useState<ApiStatusEvent | null>(null);
//   const apiStatusService = ApiStatusService.getInstance();

//   useEffect(() => {
//     setStatuses(apiStatusService.getAllStatuses());

//     const handleStatusChange = (event: ApiStatusEvent) => {
//       setStatuses(apiStatusService.getAllStatuses());
//       setLastEvent(event);
//     };

//     // Subscribe to events
//     apiStatusService.on(ApiStatusEventType.STATUS_CHANGED, handleStatusChange);
//     apiStatusService.on(ApiStatusEventType.ERROR_OCCURRED, handleStatusChange);
//     apiStatusService.on(ApiStatusEventType.RECOVERED, handleStatusChange);

//     // Check status immediately
//     Object.values(ApiProvider).forEach(provider => {
//       const config = apiStatusService.getStatus(provider);
//       if (!config) {
//         apiStatusService.configureApi({
//           provider,
//           apiKey: '', // You'll need to get this from your configuration
//           timeout: 5000,
//           maxRetries: 3
//         });
//       }
//     });

//     return () => {
//       apiStatusService.removeListener(ApiStatusEventType.STATUS_CHANGED, handleStatusChange);
//       apiStatusService.removeListener(ApiStatusEventType.ERROR_OCCURRED, handleStatusChange);
//       apiStatusService.removeListener(ApiStatusEventType.RECOVERED, handleStatusChange);
//     };
//   }, []);

//   return {
//     statuses,
//     getStatus: (provider: ApiProvider) => apiStatusService.getStatus(provider),
//     getStatusHistory: (provider: ApiProvider) => apiStatusService.getStatusHistory(provider),
//     isAnyApiDown: Array.from(statuses.values()).some(status => !status.isAvailable),
//     lastEvent,
//   };
// };

// export default useApiStatus;