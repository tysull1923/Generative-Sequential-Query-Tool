// src/components/Project/KnowledgeBase/KnowledgeBasePanel.types.ts

import { KnowledgeDocument } from "@/utils/types/KnowledgeBase.types"
// export interface KnowledgeDocument {
// 	id: string
// 	projectId: string
// 	title: string
// 	content?: string
// 	contentUrl?: string
// 	source: string
// 	chunks?: {
// 		id: string
// 		content: string
// 		embedding: number[]
// 		metadata: {
// 			start: number
// 			end: number
// 			source: string
// 		}
// 	}[]
// 	addedAt: Date
// 	lastUpdated: Date
// }

export interface RAGSettings {
	chunkSize: number
	chunkOverlap: number
	embedding: {
		model: string
		dimensions: number
	}
	similarity: {
		threshold: number
		maxResults: number
	}
}

export interface KnowledgeBasePanelProps {
	projectId: string
	documents: KnowledgeDocument[]
	onAddDocument: (doc: KnowledgeDocument) => Promise<void>
	onRemoveDocument?: (docId: string) => Promise<void>
	onReindexDocument?: (docId: string) => Promise<void>
	settings: RAGSettings
	className?: string
}

export interface DocumentCardProps {
	document: KnowledgeDocument
	onDelete: () => void
	onReindex?: () => void
	className?: string
}

export interface UploadState {
	isUploading: boolean
	progress: number
	error: string | null
}

export interface DocumentSearchResult {
	id: string
	score: number
	matches: {
		text: string
		score: number
	}[]
}

