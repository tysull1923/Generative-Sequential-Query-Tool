import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Ollama } from "@langchain/ollama";
import { BaseMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Ollama } from "@langchain/ollama";

/**
 * Available API providers in the application
 */
export enum ApiProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  OLLAMA = 'ollama'
}

/**
 * Model configuration interface - extends LangChain's model options
 */
export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
  streaming?: boolean;
}

/**
 * Provider-specific configurations
 */
export interface OpenAIConfig extends ModelConfig {
  provider: ApiProvider.OPENAI;
  apiKey: string;
  organization?: string;
}

export interface ClaudeConfig extends ModelConfig {
  provider: ApiProvider.CLAUDE;
  anthropicApiKey: string;
}

export interface OllamaConfig extends ModelConfig {
  provider: ApiProvider.OLLAMA;
  baseUrl: string;
}

/**
 * Union type for all provider configurations
 */
export type ApiConfig = OpenAIConfig | ClaudeConfig | OllamaConfig;

/**
 * Map between provider and their LangChain model types
 */
export interface ProviderModelMap {
  [ApiProvider.OPENAI]: ChatOpenAI;
  [ApiProvider.CLAUDE]: ChatAnthropic;
  [ApiProvider.OLLAMA]: Ollama;
}

/**
 * API status information
 */
export interface ApiStatus {
  provider: ApiProvider;
  model: BaseLanguageModel;
  isAvailable: boolean;
  latency: number;
  lastChecked: Date;
  errorMessage?: string;
  statusCode?: number;
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
 * API message types using LangChain's base types
 */
export type ApiMessage = BaseMessage;
export type SystemContextMessage = SystemMessage;
export type UserMessage = HumanMessage;
export type AssistantMessage = AIMessage;

/**
 * API Response interface
 */
export interface ApiResponse {
  success: boolean;
  message?: ApiMessage;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// /**
//  * Available API providers in the application
//  */
// export enum ApiProvider {
//   OPENAI = 'openai',
//   CLAUDE = 'claude',
//   OLLAMA = 'ollama'
// }

// /**
//  * API configuration interface
//  */
// export interface ApiConfig {
//   provider: ApiProvider;
//   name: string;
//   apiKey: string;
//   baseUrl: string;
//   defaultModel: string;
//   timeout?: number;
//   maxRetries?: number;
// }

// /**
//  * API status information
//  */
// export interface ApiStatus {
//   provider: ApiProvider;
//   isAvailable: boolean;
//   latency: number;
//   lastChecked: Date;
//   errorMessage?: string;
//   statusCode?: number;
// }

// /**
//  * API status history entry
//  */
// export interface ApiStatusHistory {
//   timestamp: Date;
//   status: ApiStatus;
// }

// /**
//  * Status check result
//  */
// export interface StatusCheckResult {
//   success: boolean;
//   latency: number;
//   errorMessage?: string;
//   statusCode?: number;
// }

// /**
//  * API status event types
//  */
// export enum ApiStatusEventType {
//   STATUS_CHANGED = 'status_changed',
//   ERROR_OCCURRED = 'error_occurred',
//   RECOVERED = 'recovered'
// }

// /**
//  * API status event
//  */
// export interface ApiStatusEvent {
//   type: ApiStatusEventType;
//   provider: ApiProvider;
//   status: ApiStatus;
//   previousStatus?: ApiStatus;
//   timestamp: Date;
// }


// // export interface ApiMessage {
// //     role: 'user' | 'assistant' | 'system';
// //     content: string;
// //   }
  
// //   export interface ApiResponse {
// //     success: boolean;
// //     data?: any;
// //     error?: string;
// //   }
  
// //   export interface OpenAIResponse {
// //     id: string;
// //     object: string;
// //     created: number;
// //     model: string;
// //     choices: {
// //       message: {
// //         role: string;
// //         content: string;
// //       };
// //       finish_reason: string;
// //       index: number;
// //     }[];
// //     usage: {
// //       prompt_tokens: number;
// //       completion_tokens: number;
// //       total_tokens: number;
// //     };
// //   }
  
// //   export interface ClaudeResponse {
// //     id: string;
// //     type: string;
// //     role: string;
// //     content: string;
// //     model: string;
// //     stop_reason: string;
// //     stop_sequence: string | null;
// //     usage: {
// //       input_tokens: number;
// //       output_tokens: number;
// //     };
// //   }
  
// //   export interface ApiConfig {
// //     name: string;
// //     keyName: string;
// //     baseUrl?: string;
// //     defaultModel?: string;
// //   }