/**
 * @fileoverview Core API service implementation
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  ChatType,
  ChatSettings,
  BaseMessage,
  FileMessage,
  ChatResponse,
  ResponseType
} from '@/utils/types/chat.types';

/**
 * Base configuration for API service
 */
export interface BaseApiConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: {
    requestsPerMinute: number;
    concurrentRequests: number;
  };
}

/**
 * Request options for API calls
 */
export interface RequestOptions<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: T;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * Message request payload
 */
export interface SendMessageRequest {
  message: BaseMessage | FileMessage;
  settings: ChatSettings;
}

/**
 * Custom error types
 */
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public message: string,
    public status?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Rate limiter implementation
 */
class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private activeRequests = 0;
  private requestHistory: number[] = [];

  constructor(
    private requestsPerMinute: number,
    private concurrentRequests: number
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    
    try {
      this.activeRequests++;
      const result = await fn();
      return result;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  private async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter(time => now - time < 60000);

    if (
      this.activeRequests >= this.concurrentRequests ||
      this.requestHistory.length >= this.requestsPerMinute
    ) {
      return new Promise((resolve) => {
        this.queue.push(async () => {
          await this.waitForSlot();
          resolve();
        });
      });
    }

    this.requestHistory.push(now);
  }

  private processQueue(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }
}

/**
 * Main API service class
 */
export class ApiService {
  protected readonly axios: AxiosInstance;
  protected readonly rateLimiter: RateLimiter;
  protected retryCount: number = 0;
  private pendingRetry: boolean = false;

  constructor(protected config: BaseApiConfig) {
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.rateLimiter = new RateLimiter(
      config.rateLimit?.requestsPerMinute || 60,
      config.rateLimit?.concurrentRequests || 5
    );

    this.axios.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }

  /**
   * Send a message to the API
   */
  async sendMessage(params: SendMessageRequest): Promise<ChatResponse> {
    const response = await this.request<ChatResponse>({
      method: 'POST',
      endpoint: '/chat/messages',
      data: {
        content: params.message.content,
        attachments: 'attachments' in params.message ? params.message.attachments : undefined,
        settings: params.settings
      }
    });

    return response.data;
  }

  /**
   * Send a request to the API
   */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      method: options.method,
      url: options.endpoint,
      data: options.data,
      params: options.params,
      headers: options.headers,
      timeout: options.timeout || this.config.timeout
    };

    try {
      const response = await this.rateLimiter.execute(async () => {
        const result = await this.axios.request<T>(config);
        this.validateResponse(result.data);
        return result;
      });

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.type === ApiErrorType.RATE_LIMIT &&
        !this.pendingRetry
      ) {
        await this.handleRateLimit();
        return this.request(options);
      }
      throw error;
    }
  }

  /**
   * Get chat completion from the API
   */
  async getChatCompletion(messages: (BaseMessage | FileMessage)[], settings: ChatSettings): Promise<ChatResponse> {
    const response = await this.request<ChatResponse>({
      method: 'POST',
      endpoint: '/chat/completions',
      data: {
        messages,
        ...settings
      }
    });

    return response.data;
  }

  /**
   * Handle API errors
   */
  protected handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      switch (status) {
        case 429:
          throw new ApiError(
            ApiErrorType.RATE_LIMIT,
            'Rate limit exceeded',
            status,
            error
          );
        case 401:
        case 403:
          throw new ApiError(
            ApiErrorType.AUTH,
            'Authentication failed',
            status,
            error
          );
        case 400:
        case 422:
          throw new ApiError(
            ApiErrorType.VALIDATION,
            'Validation failed',
            status,
            error
          );
        case 500:
        case 502:
        case 503:
          throw new ApiError(
            ApiErrorType.SERVER,
            'Server error',
            status,
            error
          );
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new ApiError(
          ApiErrorType.TIMEOUT,
          'Request timed out',
          undefined,
          error
        );
      }

      if (!axiosError.response) {
        throw new ApiError(
          ApiErrorType.NETWORK,
          'Network error',
          undefined,
          error
        );
      }
    }

    throw new ApiError(
      ApiErrorType.UNKNOWN,
      'Unknown error occurred',
      undefined,
      error
    );
  }

  /**
   * Validate API response
   */
  protected validateResponse(response: any): void {
    if (!response) {
      throw new ApiError(
        ApiErrorType.VALIDATION,
        'Empty response received'
      );
    }

    // Add additional validation for chat responses
    if ('type' in response && !Object.values(ResponseType).includes(response.type)) {
      throw new ApiError(
        ApiErrorType.VALIDATION,
        'Invalid response type received'
      );
    }
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  protected async handleRateLimit(): Promise<void> {
    this.pendingRetry = true;
    const maxRetries = this.config.maxRetries || 3;
    
    try {
      if (this.retryCount >= maxRetries) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT,
          `Maximum retry attempts (${maxRetries}) exceeded`
        );
      }

      const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      this.retryCount++;
    } finally {
      this.pendingRetry = false;
    }
  }
}




// import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
// import Chat
// /**
//  * Base configuration for API service
//  */
// export interface BaseApiConfig {
//   baseURL: string;
//   apiKey: string;
//   timeout?: number;
//   maxRetries?: number;
//   rateLimit?: {
//     requestsPerMinute: number;
//     concurrentRequests: number;
//   };
// }

// /**
//  * Request options for API calls
//  */
// export interface RequestOptions<T = unknown> {
//   method: 'GET' | 'POST' | 'PUT' | 'DELETE';
//   endpoint: string;
//   data?: T;
//   params?: Record<string, string | number>;
//   headers?: Record<string, string>;
//   timeout?: number;
//   retry?: boolean;
// }

// /**
//  * API response wrapper
//  */
// export interface ApiResponse<T> {
//   data: T;
//   status: number;
//   headers: Record<string, string>;
// }

// /**
//  * Custom error types
//  */
// export enum ApiErrorType {
//   NETWORK = 'NETWORK',
//   RATE_LIMIT = 'RATE_LIMIT',
//   AUTH = 'AUTH',
//   VALIDATION = 'VALIDATION',
//   SERVER = 'SERVER',
//   TIMEOUT = 'TIMEOUT',
//   UNKNOWN = 'UNKNOWN'
// }

// /**
//  * Custom API error class
//  */
// export class ApiError extends Error {
//   constructor(
//     public type: ApiErrorType,
//     public message: string,
//     public status?: number,
//     public originalError?: any
//   ) {
//     super(message);
//     this.name = 'ApiError';
//   }
// }

// /**
//  * Rate limiter implementation
//  */
// class RateLimiter {
//   private queue: Array<() => Promise<void>> = [];
//   private activeRequests = 0;
//   private requestHistory: number[] = [];

//   constructor(
//     private requestsPerMinute: number,
//     private concurrentRequests: number
//   ) {}

//   /**
//    * Executes a function within rate limits
//    */
//   async execute<T>(fn: () => Promise<T>): Promise<T> {
//     await this.waitForSlot();
    
//     try {
//       this.activeRequests++;
//       const result = await fn();
//       return result;
//     } finally {
//       this.activeRequests--;
//       this.processQueue();
//     }
//   }

//   /**
//    * Waits for an available request slot
//    */
//   private async waitForSlot(): Promise<void> {
//     const now = Date.now();
//     this.requestHistory = this.requestHistory.filter(time => now - time < 60000);

//     if (
//       this.activeRequests >= this.concurrentRequests ||
//       this.requestHistory.length >= this.requestsPerMinute
//     ) {
//       return new Promise((resolve) => {
//         this.queue.push(async () => {
//           await this.waitForSlot();
//           resolve();
//         });
//       });
//     }

//     this.requestHistory.push(now);
//   }

//   /**
//    * Processes the queue of pending requests
//    */
//   private processQueue(): void {
//     if (this.queue.length > 0) {
//       const next = this.queue.shift();
//       next?.();
//     }
//   }
// }

// /**
//  * Main API service class
//  */
// export class ApiService {
//   protected readonly axios: AxiosInstance;
//   protected readonly rateLimiter: RateLimiter;
//   protected retryCount: number = 0;
//   private pendingRetry: boolean = false;

//   constructor(protected config: BaseApiConfig) {
//     this.axios = axios.create({
//       baseURL: config.baseURL,
//       timeout: config.timeout || 30000,
//       headers: {
//         'Authorization': `Bearer ${config.apiKey}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     this.rateLimiter = new RateLimiter(
//       config.rateLimit?.requestsPerMinute || 60,
//       config.rateLimit?.concurrentRequests || 5
//     );

//     // Add response interceptor for error handling
//     this.axios.interceptors.response.use(
//       response => response,
//       error => this.handleError(error)
//     );
//   }

//   /**
//    * Sends a request to the API
//    */
//   async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
//     const config: AxiosRequestConfig = {
//       method: options.method,
//       url: options.endpoint,
//       data: options.data,
//       params: options.params,
//       headers: options.headers,
//       timeout: options.timeout || this.config.timeout
//     };

//     try {
//       const response = await this.rateLimiter.execute(async () => {
//         const result = await this.axios.request<T>(config);
//         this.validateResponse(result.data);
//         return result;
//       });

//       return {
//         data: response.data,
//         status: response.status,
//         headers: response.headers as Record<string, string>
//       };
//     } catch (error) {
//       if (
//         error instanceof ApiError &&
//         error.type === ApiErrorType.RATE_LIMIT &&
//         !this.pendingRetry
//       ) {
//         await this.handleRateLimit();
//         return this.request(options);
//       }
//       throw error;
//     }
//   }

//   /**
//    * Handles API errors
//    */
//   protected handleError(error: any): never {
//     if (axios.isAxiosError(error)) {
//       const axiosError = error as AxiosError;
//       const status = axiosError.response?.status;

//       switch (status) {
//         case 429:
//           throw new ApiError(
//             ApiErrorType.RATE_LIMIT,
//             'Rate limit exceeded',
//             status,
//             error
//           );
//         case 401:
//         case 403:
//           throw new ApiError(
//             ApiErrorType.AUTH,
//             'Authentication failed',
//             status,
//             error
//           );
//         case 400:
//         case 422:
//           throw new ApiError(
//             ApiErrorType.VALIDATION,
//             'Validation failed',
//             status,
//             error
//           );
//         case 500:
//         case 502:
//         case 503:
//           throw new ApiError(
//             ApiErrorType.SERVER,
//             'Server error',
//             status,
//             error
//           );
//       }

//       if (axiosError.code === 'ECONNABORTED') {
//         throw new ApiError(
//           ApiErrorType.TIMEOUT,
//           'Request timed out',
//           undefined,
//           error
//         );
//       }

//       if (!axiosError.response) {
//         throw new ApiError(
//           ApiErrorType.NETWORK,
//           'Network error',
//           undefined,
//           error
//         );
//       }
//     }

//     throw new ApiError(
//       ApiErrorType.UNKNOWN,
//       'Unknown error occurred',
//       undefined,
//       error
//     );
//   }

//   /**
//    * Validates API response
//    */
//   protected validateResponse(response: any): void {
//     if (!response) {
//       throw new ApiError(
//         ApiErrorType.VALIDATION,
//         'Empty response received'
//       );
//     }

//     // Add additional validation as needed
//   }

//   /**
//    * Handles rate limiting with exponential backoff
//    */
//   protected async handleRateLimit(): Promise<void> {
//     this.pendingRetry = true;
//     const maxRetries = this.config.maxRetries || 3;
    
//     try {
//       if (this.retryCount >= maxRetries) {
//         throw new ApiError(
//           ApiErrorType.RATE_LIMIT,
//           `Maximum retry attempts (${maxRetries}) exceeded`
//         );
//       }

//       const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
//       await new Promise(resolve => setTimeout(resolve, backoffTime));
//       this.retryCount++;
//     } finally {
//       this.pendingRetry = false;
//     }
//   }
//   async sendMessage(params: {
//     message: BaseMessage | FileMessage;
//     settings: ChatSettings;
//   }): Promise<ChatResponse> {
//     return this.request<ChatResponse>({
//       method: 'POST',
//       endpoint: '/messages',
//       data: params
//     });
//   }
// }

// // Usage example:
// /*
// const apiConfig: BaseApiConfig = {
//   baseURL: 'https://api.example.com',
//   apiKey: 'your-api-key',
//   timeout: 5000,
//   maxRetries: 3,
//   rateLimit: {
//     requestsPerMinute: 60,
//     concurrentRequests: 5
//   }
// };

// const api = new ApiService(apiConfig);

// // Making a request
// try {
//   const response = await api.request<{ message: string }>({
//     method: 'POST',
//     endpoint: '/messages',
//     data: { text: 'Hello, World!' }
//   });
//   console.log(response.data);
// } catch (error) {
//   if (error instanceof ApiError) {
//     switch (error.type) {
//       case ApiErrorType.RATE_LIMIT:
//         console.error('Rate limit exceeded, please try again later');
//         break;
//       case ApiErrorType.AUTH:
//         console.error('Authentication failed');
//         break;
//       default:
//         console.error('An error occurred:', error.message);
//     }
//   }
// }
// */