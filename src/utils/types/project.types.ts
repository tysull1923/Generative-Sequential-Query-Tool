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
 * Project Document interface
 */
export interface ProjectDocument {
	id: string;
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
export interface ProjectServiceResponse {
	success: boolean;
	data?: any;
	error?: string;
}

/**
 * Project Context Provider interface
 */
export interface ProjectContextType {
	currentProject: ProjectDocument | null;
	setCurrentProject: (project: ProjectDocument) => void;
	queryKnowledgeBase: (query: string) => Promise<RAGQueryResult>;
	addDocument: (doc: KnowledgeDocument) => Promise<ProjectServiceResponse>;
	updateDocument: (docId: string, updates: Partial<KnowledgeDocument>) => Promise<ProjectServiceResponse>;
	removeDocument: (docId: string) => Promise<ProjectServiceResponse>;
	addChat: (chatId: string, includeInRAG?: boolean) => Promise<ProjectServiceResponse>;
	removeChat: (chatId: string) => Promise<ProjectServiceResponse>;
	updateSettings: (settings: Partial<RAGSettings>) => Promise<ProjectServiceResponse>;
}