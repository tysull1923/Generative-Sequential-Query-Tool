import { ApiMessage, ClaudeResponse, ApiResponse } from '../interfaces/api.types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1';
const DEFAULT_MODEL = 'claude-3-opus-20240229';
const API_VERSION = '2023-06-01';

export class AnthropicService {
  private static instance: AnthropicService;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = CLAUDE_API_URL;
  }

  public static getInstance(): AnthropicService {
    if (!AnthropicService.instance) {
      AnthropicService.instance = new AnthropicService();
    }
    return AnthropicService.instance;
  }

  /**
   * Check if the Claude API is accessible with the provided key
   */
  public async checkConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          model: DEFAULT_MODEL,
          max_tokens: 1
        })
      });
      return response.status === 200;
    } catch (error) {
      console.error('Claude connection check failed:', error);
      return false;
    }
  }

  /**
   * Send a chat request to Claude
   */
  public async sendChat(
    messages: ApiMessage[],
    apiKey: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<ApiResponse> {
    if (!messages?.length || !apiKey) {
      throw new Error('Invalid request parameters');
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION
        },
        body: JSON.stringify({
          messages,
          model: options.model || DEFAULT_MODEL,
          max_tokens: options.maxTokens,
          temperature: options.temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as ClaudeResponse;
      
      return {
        success: true,
        data: {
          content: data.content,
          usage: data.usage,
          model: data.model,
          stopReason: data.stop_reason
        }
      };
    } catch (error) {
      console.error('Claude request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List available Claude models
   */
  public async listModels(apiKey: string): Promise<string[]> {
    // Claude doesn't have a models endpoint, so we return the known models
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }
}

export const anthropicService = AnthropicService.getInstance();