// src/services/api/knowledgeDocumentApiService.ts
import axios, { AxiosError } from 'axios';
import {
	ProjectServiceResponse,
	RAGSettings
} from '@/utils/types/project.types';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';

const API_BASE_URL = 'http://localhost:5000/api/knowledge';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class KnowledgeDocumentApiService {
	private static instance: KnowledgeDocumentApiService;

	private constructor() { }

	public static getInstance(): KnowledgeDocumentApiService {
		if (!KnowledgeDocumentApiService.instance) {
			KnowledgeDocumentApiService.instance = new KnowledgeDocumentApiService();
		}
		return KnowledgeDocumentApiService.instance;
	}

	// Get all documents for a project with optional filters
	async getProjectDocuments(
		projectId: string,
		filters?: { source?: string; includeInRAG?: boolean }
	): Promise<KnowledgeDocument[]> {
		try {
			const params = new URLSearchParams();
			if (filters?.source) params.append('source', filters.source);
			if (filters?.includeInRAG !== undefined) params.append('includeInRAG', String(filters.includeInRAG));

			const response = await axios.get<ApiResponse<KnowledgeDocument[]>>(
				`${API_BASE_URL}/project/${projectId}?${params.toString()}`
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to fetch documents');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Get a specific document with its full content
	async getDocument(documentId: string): Promise<KnowledgeDocument> {
		try {
			const response = await axios.get<ApiResponse<KnowledgeDocument>>(
				`${API_BASE_URL}/${documentId}`
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to fetch document');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Create a new document with content
	async createDocument(
		projectId: string,
		document: Partial<KnowledgeDocument>
	): Promise<KnowledgeDocument> {
		try {
			const response = await axios.post<ApiResponse<KnowledgeDocument>>(
				`${API_BASE_URL}/project/${projectId}`,
				{
					...document,
					includeInRAG: document.includeInRAG ?? true,
					metadata: document.metadata || {}
				}
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to create document');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Update an existing document
	async updateDocument(
		documentId: string,
		updates: Partial<KnowledgeDocument>
	): Promise<KnowledgeDocument> {
		try {
			const response = await axios.put<ApiResponse<KnowledgeDocument>>(
				`${API_BASE_URL}/${documentId}`,
				{
					...updates,
					lastUpdated: new Date()
				}
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to update document');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Upload multiple files as documents
	async uploadDocuments(projectId: string, files: File[]): Promise<KnowledgeDocument[]> {
		try {
			const formData = new FormData();
			files.forEach(file => {
				formData.append('documents', file);
			});

			const response = await axios.post<ApiResponse<KnowledgeDocument[]>>(
				`${API_BASE_URL}/project/${projectId}/upload`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					// Add upload progress tracking
					onUploadProgress: (progressEvent) => {
						const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
						// You can emit an event or use a callback here to track progress
					}
				}
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to upload documents');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Delete a document
	async deleteDocument(documentId: string): Promise<void> {
		try {
			const response = await axios.delete<ApiResponse<void>>(
				`${API_BASE_URL}/${documentId}`
			);

			if (response.status !== 200 && response.status !== 204) {
				throw new Error('Failed to delete document');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Toggle RAG inclusion
	async toggleRagInclusion(documentId: string): Promise<KnowledgeDocument> {
		try {
			const response = await axios.patch<ApiResponse<KnowledgeDocument>>(
				`${API_BASE_URL}/${documentId}/toggle-rag`
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to toggle RAG inclusion');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	// Reindex a document
	async reindexDocument(documentId: string): Promise<KnowledgeDocument> {
		try {
			const response = await axios.post<ApiResponse<KnowledgeDocument>>(
				`${API_BASE_URL}/${documentId}/reindex`
			);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to reindex document');
			}

			return response.data.data;
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

// // src/services/api/knowledgeDocumentApiService.ts
// import axios, { AxiosError } from 'axios';
// import {
// 	KnowledgeDocument,
// 	ProjectServiceResponse,
// 	RAGSettings
// } from '@/utils/types/project.types';

// const API_BASE_URL = 'http://localhost:5000/api/knowledge';

// interface ApiResponse<T> {
// 	success: boolean;
// 	data?: T;
// 	error?: string;
// }

// export class KnowledgeDocumentApiService {
// 	private static instance: KnowledgeDocumentApiService;

// 	private constructor() { }

// 	public static getInstance(): KnowledgeDocumentApiService {
// 		if (!KnowledgeDocumentApiService.instance) {
// 			KnowledgeDocumentApiService.instance = new KnowledgeDocumentApiService();
// 		}
// 		return KnowledgeDocumentApiService.instance;
// 	}

// 	// Get all documents for a project
// 	async getProjectDocuments(projectId: string): Promise<KnowledgeDocument[]> {
// 		try {
// 			const response = await axios.get<ApiResponse<KnowledgeDocument[]>>(
// 				`${API_BASE_URL}/project/${projectId}`
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to fetch documents');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Get a specific document
// 	async getDocument(documentId: string): Promise<KnowledgeDocument> {
// 		try {
// 			const response = await axios.get<ApiResponse<KnowledgeDocument>>(
// 				`${API_BASE_URL}/${documentId}`
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to fetch document');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Create a new document
// 	async createDocument(projectId: string, document: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
// 		try {
// 			const response = await axios.post<ApiResponse<KnowledgeDocument>>(
// 				`${API_BASE_URL}/project/${projectId}`,
// 				document
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to create document');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Update an existing document
// 	async updateDocument(documentId: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
// 		try {
// 			const response = await axios.put<ApiResponse<KnowledgeDocument>>(
// 				`${API_BASE_URL}/${documentId}`,
// 				updates
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to update document');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Delete a document
// 	async deleteDocument(documentId: string): Promise<void> {
// 		try {
// 			const response = await axios.delete<ApiResponse<void>>(
// 				`${API_BASE_URL}/${documentId}`
// 			);

// 			// Handle both 200 and 204 status codes
// 			if (response.status !== 200 && response.status !== 204) {
// 				throw new Error('Failed to delete document');
// 			}
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Toggle RAG inclusion for a document
// 	async toggleRagInclusion(documentId: string): Promise<KnowledgeDocument> {
// 		try {
// 			const response = await axios.patch<ApiResponse<KnowledgeDocument>>(
// 				`${API_BASE_URL}/${documentId}/toggle-rag`
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to toggle RAG inclusion');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Reindex a document
// 	async reindexDocument(documentId: string): Promise<KnowledgeDocument> {
// 		try {
// 			const response = await axios.post<ApiResponse<KnowledgeDocument>>(
// 				`${API_BASE_URL}/${documentId}/reindex`
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to reindex document');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	// Upload multiple documents
// 	async uploadDocuments(projectId: string, files: File[]): Promise<KnowledgeDocument[]> {
// 		try {
// 			const formData = new FormData();
// 			files.forEach(file => {
// 				formData.append('documents', file);
// 			});

// 			const response = await axios.post<ApiResponse<KnowledgeDocument[]>>(
// 				`${API_BASE_URL}/project/${projectId}/upload`,
// 				formData,
// 				{
// 					headers: {
// 						'Content-Type': 'multipart/form-data',
// 					},
// 				}
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to upload documents');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	private handleError(error: unknown): Error {
// 		console.error('API Error:', error);

// 		if (axios.isAxiosError(error)) {
// 			const axiosError = error as AxiosError<ApiResponse<any>>;
// 			return new Error(
// 				axiosError.response?.data?.error ||
// 				axiosError.message ||
// 				'An error occurred while communicating with the API'
// 			);
// 		}

// 		if (error instanceof Error) {
// 			return error;
// 		}

// 		return new Error('An unexpected error occurred');
// 	}
// }

// export default KnowledgeDocumentApiService;