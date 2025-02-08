// src/components/Project/RAGSettings/RAGSettingsModal.types.ts

import { RAGSettings } from '@/utils/types/project.types';

export interface RAGSettingsModalProps {
	/**
	 * Whether the modal is visible
	 */
	isOpen: boolean;

	/**
	 * Callback when modal is closed
	 */
	onClose: () => void;

	/**
	 * Current RAG settings
	 */
	settings: RAGSettings;

	/**
	 * Callback to update RAG settings
	 */
	onUpdateSettings: (settings: RAGSettings) => Promise<void>;
}

export interface EmbeddingModel {
	/**
	 * Unique identifier for the model
	 */
	id: string;

	/**
	 * Display name of the model
	 */
	name: string;

	/**
	 * Number of dimensions in the embedding vector
	 */
	dimensions: number;

	/**
	 * Optional metadata about the model
	 */
	metadata?: {
		provider: string;
		maxTokens?: number;
		languages?: string[];
		[key: string]: any;
	};
}

export interface ChunkingSettings {
	/**
	 * Size of each document chunk in tokens
	 */
	chunkSize: number;

	/**
	 * Number of overlapping tokens between chunks
	 */
	chunkOverlap: number;

	/**
	 * Optional advanced settings
	 */
	advanced?: {
		splitOnHeadings?: boolean;
		respectParagraphs?: boolean;
		minChunkSize?: number;
	};
}

export interface SimilaritySettings {
	/**
	 * Similarity threshold for retrieval (0-1)
	 */
	threshold: number;

	/**
	 * Maximum number of results to return
	 */
	maxResults: number;

	/**
	 * Optional advanced settings
	 */
	advanced?: {
		algorithm: 'cosine' | 'euclidean' | 'dot';
		reranking?: {
			enabled: boolean;
			model?: string;
			threshold?: number;
		};
	};
}

export type SettingsTab = 'chunking' | 'embedding' | 'retrieval';