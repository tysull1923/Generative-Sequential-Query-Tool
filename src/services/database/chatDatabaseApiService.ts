// src/services/api/chatApiService.ts
// src/services/api/chatApiService.ts
import axios from 'axios';
import { ChatDocument } from '@/utils/types/chat.types';

const API_BASE_URL = 'http://localhost:5000/api';

export class ChatApiService {
  private static instance: ChatApiService;

  private constructor() {}

  public static getInstance(): ChatApiService {
    if (!ChatApiService.instance) {
      ChatApiService.instance = new ChatApiService();
    }
    return ChatApiService.instance;
  }

  async createChat(chatData: Partial<ChatDocument>): Promise<string> {
    try {
      // Ensure we're sending a plain object
      const payload = JSON.parse(JSON.stringify(chatData));
      const response = await axios.post(`${API_BASE_URL}/chats`, payload);
      return response.data._id;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateChat(id: string, chatData: Partial<ChatDocument>): Promise<void> {
    try {
      // Ensure we're sending a plain object
      const payload = JSON.parse(JSON.stringify(chatData));
      await axios.put(`${API_BASE_URL}/chats/${id}`, payload);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChat(id: string): Promise<ChatDocument> {
    try {
      const response = await axios.get(`${API_BASE_URL}/chats/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listChats(): Promise<ChatDocument[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/chats`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    console.error('API Error:', error.response?.data || error);
    if (axios.isAxiosError(error)) {
      return new Error(error.response?.data?.error || 'API request failed');
    }
    return error;
  }

  // Add this method to the ChatApiService class
  async deleteChat(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/chats/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
}
}


// import axios from 'axios';
// import { ChatDocument } from '@/utils/types/chat.types';

// const API_BASE_URL = 'http://localhost:5000/api';

// export class ChatApiService {
//   private static instance: ChatApiService;

//   private constructor() {}

//   public static getInstance(): ChatApiService {
//     if (!ChatApiService.instance) {
//       ChatApiService.instance = new ChatApiService();
//     }
//     return ChatApiService.instance;
//   }

//   async createChat(chatData: Partial<ChatDocument>): Promise<string> {
//     try {
//       const response = await axios.post(`${API_BASE_URL}/chats`, chatData);
//       return response.data._id;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }
//   async updateChat(id: string, chatData: Partial<ChatDocument>): Promise<void> {
//     try {
//       await axios.put(`${API_BASE_URL}/chats/${id}`, chatData);
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async getChat(id: string): Promise<ChatDocument> {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/chats/${id}`);
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async listChats(): Promise<ChatDocument[]> {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/chats`);
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   private handleError(error: any): Error {
//     if (axios.isAxiosError(error)) {
//       return new Error(error.response?.data?.error || 'API request failed');
//     }
//     return error;
//   }
// }