// src/services/api/projectDatabaseApiService.ts
import axios, { AxiosError } from 'axios';
import {
	Project,
	CreateProjectInput,
	UpdateProjectInput,
	ProjectQueryParams,
	AddDocumentInput,
	UpdateRAGSettingsInput,
	AddChatInput
} from '@/utils/types/project.types';

const API_BASE_URL = 'http://localhost:5000/api/projects';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class ProjectApiService {
	private static instance: ProjectApiService;

	private constructor() { }

	public static getInstance(): ProjectApiService {
		if (!ProjectApiService.instance) {
			ProjectApiService.instance = new ProjectApiService();
		}
		return ProjectApiService.instance;
	}

	// List projects with optional filters
	async listProjects(params?: ProjectQueryParams): Promise<Project[]> {
		try {
			const queryParams = new URLSearchParams();
			if (params?.status) queryParams.append('status', params.status);
			if (params?.tags) queryParams.append('tags', params.tags.join(','));
			if (params?.category) queryParams.append('category', params.category);

			const response = await axios.get<ApiResponse<Project[]>>(
				`${API_BASE_URL}?${queryParams.toString()}`
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to fetch projects');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Get a specific project
	async getProject(id: string): Promise<Project> {
		try {
			const response = await axios.get<ApiResponse<Project>>(`${API_BASE_URL}/${id}`);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to fetch project');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Create a new project
	async createProject(data: CreateProjectInput): Promise<Project> {
		try {
			const response = await axios.post<ApiResponse<Project>>(API_BASE_URL, data);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to create project');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Update a project
	async updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
		try {
			const response = await axios.put<ApiResponse<Project>>(`${API_BASE_URL}/${id}`, data);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to update project');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Delete a project
	async deleteProject(id: string): Promise<void> {
		try {
			const response = await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/${id}`);

			// Handle both 200 and 204 status codes
			if (response.status !== 200 && response.status !== 204) {
				throw new Error('Failed to delete project');
			}

			// If we have response data, check for success flag
			if (response.data && !response.data.success) {
				throw new Error(response.data.error || 'Failed to delete project');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Add document to project
	async addDocument(projectId: string, document: AddDocumentInput): Promise<Project> {
		try {
			const response = await axios.post<ApiResponse<Project>>(
				`${API_BASE_URL}/${projectId}/documents`,
				document
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to add document');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Remove document from project
	async removeDocument(projectId: string, documentId: string): Promise<void> {
		try {
			const response = await axios.delete<ApiResponse<void>>(
				`${API_BASE_URL}/${projectId}/documents/${documentId}`
			);

			if (response.status !== 200 && response.status !== 204) {
				throw new Error('Failed to remove document');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Update RAG settings
	async updateRAGSettings(projectId: string, settings: UpdateRAGSettingsInput): Promise<Project> {
		try {
			const response = await axios.put<ApiResponse<Project>>(
				`${API_BASE_URL}/${projectId}/rag-settings`,
				settings
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to update RAG settings');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Add chat to project
	// async addChat(projectId: string, chatData: AddChatInput): Promise<Project> {
	// 	try {
	// 		const response = await axios.post<ApiResponse<Project>>(
	// 			`${API_BASE_URL}/${projectId}/chats/${chatData.chatId}`,
	// 			{ includeInRAG: chatData.includeInRAG }
	// 		);

	// 		if (!response.data.success || !response.data.data) {
	// 			throw new Error(response.data.error || 'Failed to add chat');
	// 		}

	// 		return response.data.data;
	// 	} catch (error) {
	// 		throw this.handleError(error);
	// 	}
	// }



	async addChat(projectId: string, chatData: AddChatInput): Promise<Project> {
		try {
			const response = await axios.post<ApiResponse<Project>>(
				`${API_BASE_URL}/${projectId}/chats/${chatData.chatId}`,
				{ includeInRAG: chatData.includeInRAG }
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to add chat');
			}

			// Fetch the full chat details after adding to project
			const chatDetails = await this.getChatDetails(chatData.chatId);

			// Update the project data with the full chat details
			const updatedProject = response.data.data;
			updatedProject.chats = updatedProject.chats.map(chat =>
				chat.chatId === chatData.chatId
					? { ...chat, chat: chatDetails }
					: chat
			);

			return updatedProject;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	private async getChatDetails(chatId: string): Promise<any> {
		try {
			const response = await axios.get(`${API_BASE_URL}/chats/${chatId}`);
			return response.data.data;
		} catch (error) {
			console.error('Error fetching chat details:', error);
			return null;
		}
	}

	// Remove chat from project
	async removeChat(projectId: string, chatId: string): Promise<void> {
		try {
			const response = await axios.delete<ApiResponse<void>>(
				`${API_BASE_URL}/${projectId}/chats/${chatId}`
			);

			if (response.status !== 200 && response.status !== 204) {
				throw new Error('Failed to remove chat');
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