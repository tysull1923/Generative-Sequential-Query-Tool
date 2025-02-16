// src/services/rag/RAGService.ts
import { v4 as uuidv4 } from 'uuid';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
	RAGSettings,
	RAGQueryResult
} from "@/utils/types/project.types";
import { KnowledgeDocument } from "@/utils/types/KnowledgeBase.types";

export class RAGService {
	private static instance: RAGService;
	private chromaClient: ChromaClient;
	private embeddings: OpenAIEmbeddings;
	private collections: Map<string, Chroma> = new Map();
	private collectionMetadata: Map<string, {
		documentCount: number;
		lastUpdated: Date;
		settings: RAGSettings;
	}> = new Map();

	private constructor() {
		this.chromaClient = new ChromaClient();
		this.embeddings = new OpenAIEmbeddings({
			openAIApiKey: process.env.VITE_OPENAI_API_KEY,
		});
	}

	public static getInstance(): RAGService {
		if (!RAGService.instance) {
			RAGService.instance = new RAGService();
		}
		return RAGService.instance;
	}

	/**
	 * Initialize a collection for a project or chat
	 */
	private async getOrCreateCollection(id: string, settings?: RAGSettings): Promise<Chroma> {
		if (this.collections.has(id)) {
			const collection = this.collections.get(id)!;

			// Update settings if provided
			if (settings && this.collectionMetadata.has(id)) {
				const metadata = this.collectionMetadata.get(id)!;
				metadata.settings = settings;
				metadata.lastUpdated = new Date();
				this.collectionMetadata.set(id, metadata);
			}

			return collection;
		}

		// Create a new collection with unique name
		const collectionName = `${id}-${uuidv4()}`;
		const collection = await Chroma.fromExistingCollection(
			this.embeddings,
			{
				collectionName,
				collectionMetadata: {
					containerId: id,
					settings: JSON.stringify(settings || {})
				}
			}
		);

		this.collections.set(id, collection);

		// Store collection metadata
		this.collectionMetadata.set(id, {
			documentCount: 0,
			lastUpdated: new Date(),
			settings: settings || {
				chunkSize: 1000,
				chunkOverlap: 200,
				embedding: {
					model: 'default',
					dimensions: 1536
				},
				similarity: {
					threshold: 0.7,
					maxResults: 5
				}
			}
		});
		return collection;
	}

	/**
	 * Process and store a document in the vector store
	 */
	async addDocument(
		containerId: string, // project or chat ID
		document: KnowledgeDocument,
		settings: RAGSettings
	): Promise<void> {
		try {
			// Get or create collection
			const collection = await this.getOrCreateCollection(containerId, settings);

			// Split text into chunks
			const splitter = new RecursiveCharacterTextSplitter({
				chunkSize: settings.chunkSize,
				chunkOverlap: settings.chunkOverlap,
			});

			// Process document content
			if (!document.content) {
				throw new Error("Document content is required");
			}

			const docs = await splitter.createDocuments(
				[document.content],
				[
					{
						source: document.source,
						documentId: document._id,
						metadata: document.metadata,
					},
				]
			);

			// Generate unique IDs for each chunk
			const chunkIds = docs.map(() => uuidv4());

			// Add document chunks to vector store with metadata
			await collection.addDocuments(docs, {
				ids: chunkIds,
				metadatas: docs.map((doc, index) => ({
					...doc.metadata,
					chunkId: chunkIds[index],
					documentId: document._id,
					source: document.source,
					lastUpdated: new Date().toISOString()
				}))
			});

			// Update collection metadata
			const metadata = this.collectionMetadata.get(containerId)!;
			metadata.documentCount += docs.length;
			metadata.lastUpdated = new Date();
			this.collectionMetadata.set(containerId, metadata);

			// Store chunk information in document
			document.chunks = docs.map((doc, index) => ({
				id: `${document._id}-chunk-${index}`,
				content: doc.pageContent,
				embedding: [], // Embeddings are stored in Chroma
				metadata: {
					start: doc.metadata.start || 0,
					end: doc.metadata.end || doc.pageContent.length,
					source: doc.metadata.source,
				},
			}));

		} catch (error) {
			console.error("Error adding document to RAG:", error);
			throw error;
		}
	}

	/**
	 * Query the vector store for relevant documents
	 */
	async query(
		containerId: string,
		query: string,
		settings: RAGSettings
	): Promise<RAGQueryResult> {
		try {
			const collection = await this.getOrCreateCollection(containerId);

			const results = await collection.similaritySearch(
				query,
				settings.similarity.maxResults,
				{ score: true }
			);

			return {
				query,
				results: results.map((result) => ({
					content: result.pageContent,
					score: result.metadata.score || 0,
					metadata: {
						source: result.metadata.source,
						documentId: result.metadata.documentId,
						chunkId: result.metadata.chunkId,
					},
				})),
			};
		} catch (error) {
			console.error("Error querying RAG system:", error);
			throw error;
		}
	}

	/**
	 * Remove a document from the vector store
	 */
	async removeDocument(
		containerId: string,
		documentId: string
	): Promise<void> {
		try {
			const collection = await this.getOrCreateCollection(containerId);
			await collection.delete({
				filter: { documentId: documentId },
			});
		} catch (error) {
			console.error("Error removing document from RAG:", error);
			throw error;
		}
	}

	/**
	 * Update RAG settings for a collection
	 */
	async updateSettings(
		containerId: string,
		settings: RAGSettings
	): Promise<void> {
		// Remove existing collection from cache to force recreation with new settings
		this.collections.delete(containerId);

		// The collection will be recreated with new settings on next access
		await this.getOrCreateCollection(containerId);
	}

	/**
	 * Toggle document inclusion in RAG
	 */
	async toggleDocumentInclusion(
		containerId: string,
		documentId: string,
		include: boolean
	): Promise<void> {
		const collection = await this.getOrCreateCollection(containerId);

		if (!include) {
			// Remove document from vector store
			await this.removeDocument(containerId, documentId);
		} else {
			// Re-add document to vector store
			// This requires the document data and settings to be passed
			// You'll need to implement the logic to retrieve these
		}
	}

	/**
	 * Reindex a document
	 */
	async reindexDocument(
		containerId: string,
		document: KnowledgeDocument,
		settings: RAGSettings
	): Promise<void> {
		// Remove existing document
		await this.removeDocument(containerId, document._id);

		// Re-add document with current settings
		await this.addDocument(containerId, document, settings);
	}
}

export default RAGService;