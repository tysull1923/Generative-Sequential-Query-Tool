export enum Role {
    SYSTEM = 'system',
    USER = 'user',
    DEVELOPER = 'developer',
    ASSISTANT = 'assistant'
  }
  
  // API Request
  
  interface ChatRequest {
    id: string;
    role: Role;
    type: 'chat' | 'pause';
    content?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'paused';
    response?: chatResponse;
    isPaused?: boolean;
    number: number;
  }
  
  /**
   * API Response interface
   */
  export interface chatResponse  {
    provider: Role;
    content: string;
    responseType: 'text' | 'code' | 'images';
  }
  