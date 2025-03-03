// src/server/services/embedding.service.ts

import {
	OpenAIEmbeddings,

} from '@langchain/openai';
import { CohereEmbeddings } from '@langchain/cohere';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import {
	Document as LangChainDocument,
	Document
} from '@langchain/core/documents';
import {
	RecursiveCharacterTextSplitter,
	MarkdownTextSplitter,
	TokenTextSplitter
} from 'langchain/text_splitter';
import { Embeddings } from '@langchain/core/embeddings';
import {
	KnowledgeDocument,
	RAGSettings,
	RAGQueryResult
} from '@/utils/types/project.types';

export class EmbeddingService {
	private embeddings: Embeddings;
	private static instance: EmbeddingService;

	private constructor() {
		// Default to OpenAI embeddings
		this.embeddings = new OpenAIEmbeddings({
			openAIApiKey: process.env.OPENAI_API_KEY,
			modelName: 'text-embedding-ada-002',
			batchSize: 512, // Process more texts at once
			stripNewLines: true // Clean text
		});
	}

	public static getInstance(): EmbeddingService {
		if (!EmbeddingService.instance) {
			EmbeddingService.instance = new EmbeddingService();
		}
		return EmbeddingService.instance;
	}

	/**
	 * Switch embedding provider
	 */
	public setProvider(provider: 'openai' | 'cohere', apiKey: string): void {
		switch (provider) {
			case 'openai':
				this.embeddings = new OpenAIEmbeddings({
					openAIApiKey: apiKey,
					modelName: 'text-embedding-ada-002'
				});
				break;
			case 'cohere':
				this.embeddings = new CohereEmbeddings({
					apiKey,
					modelName: 'embed-multilingual-v3.0'
				});
				break;
			default:
				throw new Error(`Unsupported embedding provider: ${provider}`);
		}
	}

	/**
	 * Create text splitter based on document type and settings
	 */
	private createTextSplitter(settings: RAGSettings) {
		const baseConfig = {
			chunkSize: settings.chunkSize,
			chunkOverlap: settings.chunkOverlap
		};

		// You can expand this to handle different document types
		return new RecursiveCharacterTextSplitter({
			...baseConfig,
			separators: ["\n\n", "\n", " ", ""], // Try different splits
			lengthFunction: (text) => text.length, // Can be changed to token count
		});
	}

	/**
	 * Convert a KnowledgeDocument to LangChain Document format
	 */
	private toLanguageDocument(doc: KnowledgeDocument): Document {
		return new Document({
			pageContent: doc.content,
			metadata: {
				source: doc.source,
				title: doc.title,
				id: doc.id,
				addedAt: doc.addedAt,
				lastUpdated: doc.lastUpdated
			}
		});
	}

	/**
	 * Process a document by splitting it into chunks and generating embeddings
	 */
	async processDocument(
		document: KnowledgeDocument,
		settings: RAGSettings
	): Promise<KnowledgeDocument> {
		try {
			// Convert to LangChain document
			const langDoc = this.toLanguageDocument(document);

			// Split document
			const textSplitter = this.createTextSplitter(settings);
			const splitDocs = await textSplitter.splitDocuments([langDoc]);

			// Generate embeddings for chunks
			const vectorStore = await MemoryVectorStore.fromDocuments(
				splitDocs,
				this.embeddings
			);

			// Process each chunk
			const chunks = await Promise.all(
				splitDocs.map(async (chunk, index) => {
					const embedding = await this.embeddings.embedQuery(chunk.pageContent);
					return {
						content: chunk.pageContent,
						embedding,
						metadata: {
							start: index * settings.chunkSize,
							end: (index + 1) * settings.chunkSize,
							source: document.source
						}
					};
				})
			);

			// Generate embedding for full document
			const documentEmbedding = await this.embeddings.embedQuery(document.content);

			return {
				...document,
				embedding: documentEmbedding,
				chunks,
				lastUpdated: new Date()
			};
		} catch (error) {
			console.error('Error processing document:', error);
			throw error;
		}
	}

	/**
	 * Query documents using semantic search
	 */
	async queryDocuments(
		query: string,
		documents: KnowledgeDocument[],
		settings: RAGSettings
	): Promise<RAGQueryResult> {
		try {
			// Convert all documents to LangChain format
			const langDocs = documents.flatMap(doc =>
				doc.chunks?.map(chunk => new Document({
					pageContent: chunk.content,
					metadata: {
						source: doc.source,
						documentId: doc.id,
						chunkId: chunk.metadata.source,
						embedding: chunk.embedding
					}
				})) || []
			);

			// Create vector store
			const vectorStore = await MemoryVectorStore.fromDocuments(
				langDocs,
				this.embeddings
			);

			// Search for similar documents
			const results = await vectorStore.similaritySearch(
				query,
				settings.similarity.maxResults,
				{
					minSimilarity: settings.similarity.threshold
				}
			);

			// Format results
			const formattedResults = results.map(result => ({
				content: result.pageContent,
				score: result.metadata.similarity || 0,
				metadata: {
					source: result.metadata.source,
					documentId: result.metadata.documentId,
					chunkId: result.metadata.chunkId
				}
			}));

			return {
				query,
				results: formattedResults,
			};
		} catch (error) {
			console.error('Error querying documents:', error);
			throw error;
		}
	}

	/**
	 * Reindex a document's chunks
	 */
	async reindexDocument(
		document: KnowledgeDocument,
		settings: RAGSettings
	): Promise<KnowledgeDocument> {
		return this.processDocument(document, settings);
	}

	/**
	 * Get embeddings for a batch of texts
	 */
	async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
		try {
			const embeddings = await this.embeddings.embedDocuments(texts);
			return embeddings;
		} catch (error) {
			console.error('Error getting batch embeddings:', error);
			throw error;
		}
	}
}

export default EmbeddingService;