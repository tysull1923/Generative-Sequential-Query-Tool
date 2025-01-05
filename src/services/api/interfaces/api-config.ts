import { ApiConfig, ApiProvider } from './api.types';

export const API_CONFIG: Record<string, ApiConfig> = {
  OPENAI: {
    provider: ApiProvider.OPENAI,
    name: "openai",
    apiKey: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4'
  },
  CLAUDE: {
    provider: ApiProvider.CLAUDE,
    name: "claude",
    apiKey: 'CLAUDE_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-opus-20240229'
  }
};