// src/components/Project/KnowledgeBase/KnowledgeBasePanel.types.ts

import type { RAGSettings } from "@/utils/types/project.types"

export interface KnowledgeDocument {
	_id: string
	projectId: string
	title: string
	content?: string
	contentUrl?: string
	source: string
	embedding?: number[]
	chunks?: {
		id: string
		content: string
		embedding: number[]
		metadata: {
			start: number
			end: number
			source: string
		}
	}[]
	metadata?: {
		fileType?: string;
		fileSize?: number;
		extension?: string;
	};
	includeInRAG?: boolean
	addedAt: Date
	lastUpdated: Date
}
export interface KnowledgeBasePanelProps {
	/**
	 * Project ID
	 */
	projectId: string

	/**
	 * Array of knowledge documents to display
	 */
	documents: KnowledgeDocument[]

	/**
	 * Callback to add a new document
	 */
	onAddDocument: (doc: KnowledgeDocument) => Promise<void>

	/**
	 * Optional callback to remove a document
	 */
	onRemoveDocument?: (docId: string) => Promise<void>

	/**
	 * Optional callback to update a document
	 */
	onUpdateDocument?: (docId: string, updates: Partial<KnowledgeDocument>) => Promise<void>

	/**
	 * Optional callback to reindex a document
	 */
	onReindexDocument?: (docId: string) => Promise<void>

	/**
	 * RAG system settings
	 */
	settings: RAGSettings

	/**
	 * Optional CSS class name
	 */
	className?: string
}

export interface DocumentCardProps {
	/**
	 * Document to display
	 */
	document: KnowledgeDocument

	/**
	 * Callback when document is deleted
	 */
	onDelete?: () => Promise<void>

	/**
	 * Callback when document should be reindexed
	 */
	onReindex?: () => Promise<void>

	/**
	 * Optional CSS class name
	 */
	className?: string
}

export interface UploadState {
	/**
	 * Whether a file is currently being uploaded
	 */
	isUploading: boolean

	/**
	 * Upload progress percentage (0-100)
	 */
	progress: number

	/**
	 * Any error that occurred during upload
	 */
	error?: string
}

export interface DocumentSearchResult {
	/**
	 * Document ID
	 */
	id: string

	/**
	 * Relevance score (0-1)
	 */
	score: number

	/**
	 * Matched text snippets
	 */
	matches: {
		text: string
		score: number
	}[]
}

