// src/components/Project/KnowledgeBase/KnowledgeBasePanel.types.ts

import { KnowledgeDocument, RAGSettings } from '@/utils/types/project.types';

export interface KnowledgeBasePanelProps {
	/**
	 * Array of knowledge documents to display
	 */
	documents: KnowledgeDocument[];

	/**
	 * Callback to add a new document
	 */
	onAddDocument: (doc: KnowledgeDocument) => Promise<void>;

	/**
	 * Optional callback to remove a document
	 */
	onRemoveDocument?: (docId: string) => Promise<void>;

	/**
	 * Optional callback to update a document
	 */
	onUpdateDocument?: (docId: string, updates: Partial<KnowledgeDocument>) => Promise<void>;

	/**
	 * Optional callback to reindex a document
	 */
	onReindexDocument?: (docId: string) => Promise<void>;

	/**
	 * RAG system settings
	 */
	settings: RAGSettings;

	/**
	 * Optional CSS class name
	 */
	className?: string;
}

export interface DocumentCardProps {
	/**
	 * Document to display
	 */
	document: KnowledgeDocument;

	/**
	 * Callback when document is deleted
	 */
	onDelete?: () => Promise<void>;

	/**
	 * Callback when document should be reindexed
	 */
	onReindex?: () => Promise<void>;

	/**
	 * Optional CSS class name
	 */
	className?: string;
}

export interface UploadState {
	/**
	 * Whether a file is currently being uploaded
	 */
	isUploading: boolean;

	/**
	 * Upload progress percentage (0-100)
	 */
	progress: number;

	/**
	 * Any error that occurred during upload
	 */
	error?: string;
}

export interface DocumentSearchResult {
	/**
	 * Document ID
	 */
	id: string;

	/**
	 * Relevance score (0-1)
	 */
	score: number;

	/**
	 * Matched text snippets
	 */
	matches: {
		text: string;
		score: number;
	}[];
}