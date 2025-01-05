export enum Role {
    SYSTEM = 'system',
    USER = 'user',
    DEVELOPER = 'developer',
    ASSISTANT = 'assistant'
  }
  
  // API Request
  
  export interface chatRequest {
    provider: Role;
    content: string;
    requestType: 'text' | 'code' | 'images';
  }
  
  /**
   * API Response interface
   */
  export interface chatResponse  {
    provider: Role;
    content: string;
    responseType: 'text' | 'code' | 'images';
  }
  