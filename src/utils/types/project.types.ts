// src/types/project.types.ts

import { ChatDocument } from './chat.types';

/**
 * Project status enum
 */
export enum ProjectStatus {
	ACTIVE = 'active',
	ARCHIVED = 'archived',
	COMPLETED = 'completed'
}

/**
 * RAG Knowledge Base Settings
 */
export interface RAGSettings {
	chunkSize: number;
	chunkOverlap: number;
	embedding: {
		model: string;
		dimensions: number;
	};
	similarity: {
		threshold: number;
		maxResults: number;
	};
}

/**
 * Project-specific chat reference
 */
export interface ProjectChat {
	chatId: string;
	addedAt: Date;
	includeInRAG: boolean;
	chat?: ChatDocument;
}

/**
 * Knowledge Base Document
 */
export interface KnowledgeDocument {
	id: string;
	title: string;
	content: string;
	source: string;
	embedding?: number[];
	chunks?: {
		id: string;
		content: string;
		embedding: number[];
		metadata: {
			start: number;
			end: number;
			source: string;
		};
	}[];
	addedAt: Date;
	lastUpdated: Date;
}

/**
 * Project interface
 */
export interface Project {
	_id: string;
	title: string;
	description: string;
	status: ProjectStatus;
	chats: ProjectChat[];
	knowledgeBase: {
		documents: KnowledgeDocument[];
		settings: RAGSettings;
	};
	createdAt: Date;
	lastModified: Date;
	metadata?: {
		tags?: string[];
		category?: string;
		[key: string]: any;
	};
}

/**
 * RAG Query Result
 */
export interface RAGQueryResult {
	query: string;
	results: {
		content: string;
		score: number;
		metadata: {
			source: string;
			documentId: string;
			chunkId?: string;
		};
	}[];
}

/**
 * Project Service Response
 */
export interface ProjectServiceResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Project Context Provider interface
 */
export interface ProjectContextType {
	currentProject: Project | null;
	setCurrentProject: (project: Project) => void;
	queryKnowledgeBase: (query: string) => Promise<RAGQueryResult>;
	addDocument: (doc: KnowledgeDocument) => Promise<ProjectServiceResponse>;
	updateDocument: (docId: string, updates: Partial<KnowledgeDocument>) => Promise<ProjectServiceResponse>;
	removeDocument: (docId: string) => Promise<ProjectServiceResponse>;
	addChat: (chatId: string, includeInRAG?: boolean) => Promise<ProjectServiceResponse>;
	removeChat: (chatId: string) => Promise<ProjectServiceResponse>;
	updateSettings: (settings: Partial<RAGSettings>) => Promise<ProjectServiceResponse>;
}

/**
 * Input types for API operations
 */
export interface CreateProjectInput {
	title: string;
	description: string;
	status?: ProjectStatus;
	metadata?: {
		tags?: string[];
		category?: string;
		[key: string]: any;
	};
}

export interface UpdateProjectInput {
	title?: string;
	description?: string;
	status?: ProjectStatus;
	metadata?: {
		tags?: string[];
		category?: string;
		[key: string]: any;
	};
}

export interface ProjectQueryParams {
	status?: ProjectStatus;
	tags?: string[];
	category?: string;
}

export interface AddDocumentInput extends Omit<KnowledgeDocument, 'id' | 'addedAt' | 'lastUpdated' | 'chunks'> {
	chunks?: Omit<KnowledgeDocument['chunks'][0], 'id'>[];
}

export interface UpdateRAGSettingsInput extends Partial<RAGSettings> { }

export interface AddChatInput {
	chatId: string;
	includeInRAG?: boolean;
}

/**
 * Utility types for API responses
 */
export type ProjectListResponse = ProjectServiceResponse<Project[]>;
export type ProjectResponse = ProjectServiceResponse<Project>;
export type RAGQueryResponse = ProjectServiceResponse<RAGQueryResult>;