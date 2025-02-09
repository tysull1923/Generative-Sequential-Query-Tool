// src/services/api/chatApiService.ts

// src/services/api/chatDatabaseApiService.ts
import axios, { AxiosError } from 'axios';
import { ChatDocument } from '@/utils/types/chat.types';

const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class ChatApiService {
	private static instance: ChatApiService;

	private constructor() { }

	public static getInstance(): ChatApiService {
		if (!ChatApiService.instance) {
			ChatApiService.instance = new ChatApiService();
		}
		return ChatApiService.instance;
	}

	async createChat(chatData: Partial<ChatDocument>): Promise<string> {
		try {
			const payload = JSON.parse(JSON.stringify(chatData));
			const response = await axios.post<ApiResponse<ChatDocument>>(`${API_BASE_URL}/chats`, payload);

			if (!response.data.success) {
				throw new Error(response.data.error || 'Failed to create chat');
			}

			return response.data.data!._id;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async updateChat(id: string, chatData: Partial<ChatDocument>): Promise<void> {
		try {
			const payload = JSON.parse(JSON.stringify(chatData));
			const response = await axios.put<ApiResponse<ChatDocument>>(`${API_BASE_URL}/chats/${id}`, payload);

			if (!response.data.success) {
				throw new Error(response.data.error || 'Failed to update chat');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async getChat(id: string): Promise<ChatDocument> {
		try {
			const response = await axios.get<ApiResponse<ChatDocument>>(`${API_BASE_URL}/chats/${id}`);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to fetch chat');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async listChats(): Promise<ChatDocument[]> {
		try {
			const response = await axios.get<ApiResponse<ChatDocument[]>>(`${API_BASE_URL}/chats`);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to fetch chats');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async copyChat(id: string): Promise<string> {
		try {
			const response = await axios.post<ApiResponse<ChatDocument>>(`${API_BASE_URL}/chats/${id}/copy`);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to copy chat');
			}

			return response.data.data._id;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async deleteChat(id: string): Promise<void> {
		try {
			const response = await axios.delete<ApiResponse<{ id: string }>>(`${API_BASE_URL}/chats/${id}`);

			// Handle both 200 and 204 status codes
			if (response.status !== 200 && response.status !== 204) {
				throw new Error('Failed to delete chat');
			}

			// If we have response data, check for success flag
			if (response.data && !response.data.success) {
				throw new Error(response.data.error || 'Failed to delete chat');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	private handleError(error: unknown): Error {
		console.error('API Error:', error);

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<ApiResponse<any>>;
			return new Error(
				axiosError.response?.data?.error ||
				axiosError.message ||
				'An error occurred while communicating with the API'
			);
		}

		if (error instanceof Error) {
			return error;
		}

		return new Error('An unexpected error occurred');
	}
}




// src/services/api/chatApiService.ts
// import axios from 'axios';
// import { ChatDocument } from '@/utils/types/chat.types';

// const API_BASE_URL = 'http://localhost:5000/api';

// export class ChatApiService {
// 	private static instance: ChatApiService;

// 	private constructor() { }

// 	public static getInstance(): ChatApiService {
// 		if (!ChatApiService.instance) {
// 			ChatApiService.instance = new ChatApiService();
// 		}
// 		return ChatApiService.instance;
// 	}

// 	async createChat(chatData: Partial<ChatDocument>): Promise<string> {
// 		try {
// 			// Ensure we're sending a plain object
// 			const payload = JSON.parse(JSON.stringify(chatData));
// 			const response = await axios.post(`${API_BASE_URL}/chats`, payload);
// 			return response.data._id;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	async updateChat(id: string, chatData: Partial<ChatDocument>): Promise<void> {
// 		try {
// 			// Ensure we're sending a plain object
// 			const payload = JSON.parse(JSON.stringify(chatData));
// 			await axios.put(`${API_BASE_URL}/chats/${id}`, payload);
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	async getChat(id: string): Promise<ChatDocument> {
// 		try {
// 			const response = await axios.get(`${API_BASE_URL}/chats/${id}`);
// 			return response.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	async listChats(): Promise<ChatDocument[]> {
// 		try {
// 			const response = await axios.get(`${API_BASE_URL}/chats`);
// 			return response.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}
// 	async copyChat(id: string): Promise<string> {
// 		try {
// 			const response = await axios.post(`${API_BASE_URL}/chats/${id}/copy`);
// 			return response.data._id;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	private handleError(error: any): Error {
// 		console.error('API Error:', error.response?.data || error);
// 		if (axios.isAxiosError(error)) {
// 			return new Error(error.response?.data?.error || 'API request failed');
// 		}
// 		return error;
// 	}

// 	// Add this method to the ChatApiService class
// 	async deleteChat(id: string): Promise<void> {
// 		try {
// 			await axios.delete(`${API_BASE_URL}/chats/${id}`);
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}
// }


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