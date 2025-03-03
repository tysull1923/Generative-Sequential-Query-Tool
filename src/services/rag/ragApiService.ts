// src/services/api/ragApiService.ts
// src/services/api/ragApiService.ts
// import axios, { AxiosError } from 'axios';
// import {
// 	RAGSettings,
// 	RAGQueryResult,
// 	ProjectServiceResponse
// } from '@/utils/types/project.types';
// import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';

// const API_BASE_URL = 'http://localhost:5000/api/rag';

// interface ApiResponse<T> {
// 	success: boolean;
// 	data?: T;
// 	error?: string;
// }

// export class RAGApiService {
// 	private static instance: RAGApiService;

// 	private constructor() { }

// 	public static getInstance(): RAGApiService {
// 		if (!RAGApiService.instance) {
// 			RAGApiService.instance = new RAGApiService();
// 		}
// 		return RAGApiService.instance;
// 	}

// 	/**
// 	 * Query the RAG system for relevant content
// 	 */
// 	async query(
// 		containerId: string,
// 		query: string,
// 		settings: RAGSettings
// 	): Promise<RAGQueryResult> {
// 		try {
// 			const response = await axios.post<ApiResponse<RAGQueryResult>>(
// 				`${API_BASE_URL}/${containerId}/query`,
// 				{
// 					query,
// 					settings
// 				}
// 			);

// 			if (!response.data.success || !response.data.data) {
// 				throw new Error(response.data.error || 'Failed to query RAG system');
// 			}

// 			return response.data.data;
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	/**
// 	 * Add a document to the RAG system
// 	 */
// 	async addDocument(
// 		containerId: string,
// 		document: KnowledgeDocument,
// 		settings: RAGSettings
// 	): Promise<void> {
// 		try {
// 			const response = await axios.post<ApiResponse<void>>(
// 				`${API_BASE_URL}/${containerId}/documents`,
// 				{
// 					document,
// 					settings
// 				}
// 			);

// 			if (!response.data.success) {
// 				throw new Error(response.data.error || 'Failed to add document to RAG system');
// 			}
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	/**
// 	 * Remove a document from the RAG system
// 	 */
// 	async removeDocument(
// 		containerId: string,
// 		documentId: string
// 	): Promise<void> {
// 		try {
// 			const response = await axios.delete<ApiResponse<void>>(
// 				`${API_BASE_URL}/${containerId}/documents/${documentId}`
// 			);

// 			if (response.status !== 200 && response.status !== 204) {
// 				throw new Error('Failed to remove document from RAG system');
// 			}
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	/**
// 	 * Toggle document inclusion in RAG
// 	 */
// 	async toggleDocumentInclusion(
// 		containerId: string,
// 		documentId: string,
// 		include: boolean
// 	): Promise<void> {
// 		try {
// 			const response = await axios.patch<ApiResponse<void>>(
// 				`${API_BASE_URL}/${containerId}/documents/${documentId}/toggle`,
// 				{ include }
// 			);

// 			if (!response.data.success) {
// 				throw new Error(response.data.error || 'Failed to toggle document inclusion');
// 			}
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	/**
// 	 * Reindex a document in the RAG system
// 	 */
// 	async reindexDocument(
// 		containerId: string,
// 		documentId: string
// 	): Promise<void> {
// 		try {
// 			const response = await axios.post<ApiResponse<void>>(
// 				`${API_BASE_URL}/${containerId}/documents/${documentId}/reindex`
// 			);

// 			if (!response.data.success) {
// 				throw new Error(response.data.error || 'Failed to reindex document');
// 			}
// 		} catch (error) {
// 			throw this.handleError(error);
// 		}
// 	}

// 	private handleError(error: unknown): Error {
// 		console.error('RAG API Error:', error);

// 		if (axios.isAxiosError(error)) {
// 			const axiosError = error as AxiosError<ApiResponse<any>>;
// 			return new Error(
// 				axiosError.response?.data?.error ||
// 				axiosError.message ||
// 				'An error occurred while communicating with the RAG API'
// 			);
// 		}

// 		if (error instanceof Error) {
// 			return error;
// 		}

// 		return new Error('An unexpected error occurred');
// 	}
// }

// export default RAGApiService;


// src/services/api/ragApiService.ts
import axios, { AxiosError } from 'axios';
import {
	RAGSettings,
	RAGQueryResult,
	ProjectServiceResponse
} from '@/utils/types/project.types';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';

const API_BASE_URL = 'http://localhost:5000/api/rag';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class RAGApiService {
	private static instance: RAGApiService;

	private constructor() { }

	public static getInstance(): RAGApiService {
		if (!RAGApiService.instance) {
			RAGApiService.instance = new RAGApiService();
		}
		return RAGApiService.instance;
	}

	/**
	 * Query the RAG system for relevant content
	 */
	async query(
		containerId: string,
		query: string,
		settings: RAGSettings
	): Promise<RAGQueryResult> {
		try {
			console.log(`Querying RAG system for container ${containerId} with query: ${query}`);
			const response = await axios.post<ApiResponse<RAGQueryResult>>(
				`${API_BASE_URL}/${containerId}/query`,
				{
					query,
					settings
				}
			);
			console.log(`RAG system response: ${JSON.stringify(response.data)}`);

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.error || 'Failed to query RAG system');
			}

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Add a document to the RAG system
	 */
	async addDocument(
		containerId: string,
		document: KnowledgeDocument,
		settings: RAGSettings
	): Promise<void> {
		try {
			const response = await axios.post<ApiResponse<void>>(
				`${API_BASE_URL}/${containerId}/documents`,
				{
					document,
					settings
				}
			);

			if (!response.data.success) {
				throw new Error(response.data.error || 'Failed to add document to RAG system');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}


	/**
	 * Remove a document from the RAG system
	 */
	async removeDocument(
		containerId: string,
		documentId: string
	): Promise<void> {
		try {
			const response = await axios.delete<ApiResponse<void>>(
				`${API_BASE_URL}/${containerId}/documents/${documentId}`
			);

			if (response.status !== 200 && response.status !== 204) {
				throw new Error('Failed to remove document from RAG system');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	/**
	 * Toggle document inclusion in RAG
	 */
	async toggleDocumentInclusion(
		containerId: string,
		documentId: string,
		include: boolean
	): Promise<void> {
		try {
			const response = await axios.patch<ApiResponse<void>>(
				`${API_BASE_URL}/${containerId}/documents/${documentId}/toggle`,
				{ include }
			);

			if (!response.data.success) {
				throw new Error(response.data.error || 'Failed to toggle document inclusion');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}


	/**
	 * Reindex a document in the RAG system
	 */
	async reindexDocument(
		containerId: string,
		documentId: string
	): Promise<void> {
		try {
			const response = await axios.post<ApiResponse<void>>(
				`${API_BASE_URL}/${containerId}/documents/${documentId}/reindex`
			);

			if (!response.data.success) {
				throw new Error(response.data.error || 'Failed to reindex document');
			}
		} catch (error) {
			throw this.handleError(error);
		}
	}

	private handleError(error: unknown): Error {
		console.error('RAG API Error:', error);

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<ApiResponse<any>>;
			return new Error(
				axiosError.response?.data?.error ||
				axiosError.message ||
				'An error occurred while communicating with the RAG API'
			);
		}

		if (error instanceof Error) {
			return error;
		}

		return new Error('An unexpected error occurred');
	}
}

export default RAGApiService;