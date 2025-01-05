import { ApiMessage, OpenAIResponse, ApiResponse } from '../interfaces/api.types';

const OPENAI_API_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4';

export class OpenAIService {
  private static instance: OpenAIService;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = OPENAI_API_URL;
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Check if the OpenAI API is accessible with the provided key
   */
  public async checkConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('OpenAI connection check failed:', error);
      return false;
    }
  }

  /**
   * Send a chat completion request to OpenAI
   */
  public async sendChat(
    messages: ApiMessage[],
    apiKey: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ApiResponse> {
    if (!messages?.length || !apiKey) {
      throw new Error('Invalid request parameters');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: options.model || DEFAULT_MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as OpenAIResponse;
      
      return {
        success: true,
        data: {
          content: data.choices[0].message.content,
          usage: data.usage,
          model: data.model
        }
      };
    } catch (error) {
      console.error('OpenAI request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List available models
   */
  public async listModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.startsWith('gpt'))
        .map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }
}

export const openAIService = OpenAIService.getInstance();