// src/hooks/useAPIStatus.js
import { useState, useEffect } from 'react';
import { validateOpenAIKey, validateClaudeKey } from '../services/api/utils/apiKeyValidator';

export function useAPIStatus() {
  const [apiStatus, setApiStatus] = useState({
    openai: 'checking',
    claude: 'checking'
  });

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    // Get API keys from environment variables or local storage
    const openaiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;
    const claudeKey = localStorage.getItem('claude_api_key') || import.meta.env.VITE_ANTHROPIC_API_KEY;

    // Check OpenAI API status
    if (openaiKey) {
      const isOpenAIValid = await validateOpenAIKey(openaiKey);
      setApiStatus(prev => ({
        ...prev,
        openai: isOpenAIValid ? 'operational' : 'nonoperational'
      }));
    } else {
      setApiStatus(prev => ({
        ...prev,
        openai: 'nonoperational'
      }));
    }

    // Check Claude API status
    if (claudeKey) {
      const isClaudeValid = await validateClaudeKey(claudeKey);
      setApiStatus(prev => ({
        ...prev,
        claude: isClaudeValid ? 'operational' : 'nonoperational'
      }));
    } else {
      setApiStatus(prev => ({
        ...prev,
        claude: 'nonoperational'
      }));
    }
  };

  const updateAPIKey = async (provider, key) => {
    localStorage.setItem(`${provider}_api_key`, key);
    
    // Validate and update status for the specific provider
    if (provider === 'openai') {
      const isValid = await validateOpenAIKey(key);
      setApiStatus(prev => ({
        ...prev,
        openai: isValid ? 'operational' : 'nonoperational'
      }));
      return isValid;
    } else if (provider === 'claude') {
      const isValid = await validateClaudeKey(key);
      setApiStatus(prev => ({
        ...prev,
        claude: isValid ? 'operational' : 'nonoperational'
      }));
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