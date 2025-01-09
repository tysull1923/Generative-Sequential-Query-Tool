/**
 * Available API providers in the application
 */
export enum ApiProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  OLLAMA = 'ollama'
}

/**
 * API configuration interface
 */
export interface ApiConfig {
  provider: ApiProvider;
  name: string;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * API status information
 */
export interface ApiStatus {
  provider: ApiProvider;
  isAvailable: boolean;
  latency: number;
  lastChecked: Date;
  errorMessage?: string;
  statusCode?: number;
}

/**
 * API status history entry
 */
export interface ApiStatusHistory {
  timestamp: Date;
  status: ApiStatus;
}

/**
 * Status check result
 */
export interface StatusCheckResult {
  success: boolean;
  latency: number;
  errorMessage?: string;
  statusCode?: number;
}

/**
 * API status event types
 */
export enum ApiStatusEventType {
  STATUS_CHANGED = 'status_changed',
  ERROR_OCCURRED = 'error_occurred',
  RECOVERED = 'recovered'
}

/**
 * API status event
 */
export interface ApiStatusEvent {
  type: ApiStatusEventType;
  provider: ApiProvider;
  status: ApiStatus;
  previousStatus?: ApiStatus;
  timestamp: Date;
}


// export interface ApiMessage {
//     role: 'user' | 'assistant' | 'system';
//     content: string;
//   }
  
//   export interface ApiResponse {
//     success: boolean;
//     data?: any;
//     error?: string;
//   }
  
//   export interface OpenAIResponse {
//     id: string;
//     object: string;
//     created: number;
//     model: string;
//     choices: {
//       message: {
//         role: string;
//         content: string;
//       };
//       finish_reason: string;
//       index: number;
//     }[];
//     usage: {
//       prompt_tokens: number;
//       completion_tokens: number;
//       total_tokens: number;
//     };
//   }
  
//   export interface ClaudeResponse {
//     id: string;
//     type: string;
//     role: string;
//     content: string;
//     model: string;
//     stop_reason: string;
//     stop_sequence: string | null;
//     usage: {
//       input_tokens: number;
//       output_tokens: number;
//     };
//   }
  
//   export interface ApiConfig {
//     name: string;
//     keyName: string;
//     baseUrl?: string;
//     defaultModel?: string;
//   }