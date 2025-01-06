export enum Role {
    SYSTEM = 'system',
    USER = 'user',
    DEVELOPER = 'developer',
    ASSISTANT = 'assistant'
  }
  
  // API Request
  
  export interface ChatRequest {
    id: string;
    role: Role;
    type: 'chat' | 'pause';
    content?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'paused';
    response?: ChatResponse;
    isPaused?: boolean;
    number: number;
  }
  
  /**
   * API Response interface
   */
  export interface ChatResponse  {
    provider: Role;
    content: string;
    responseType: 'text' | 'code' | 'images';
  }
  