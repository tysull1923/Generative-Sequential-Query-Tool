// src/server/services/embedding.service.ts

import { OpenAI } from 'openai';
import { CohereClient } from 'cohere-ai';
import { KnowledgeDocument, RAGSettings, RAGQueryResult } from '@/utils/types/project.types';

interface EmbeddingProvider {
	getEmbedding(text: string): Promise<number[]>;
	getDimensions(): number;
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
	private client: OpenAI;
	private model: string;

	constructor(apiKey: string, model = 'text-embedding-ada-002') {
		this.client = new OpenAI({ apiKey });
		this.model = model;
	}

	async getEmbedding(text: string): Promise<number[]> {
		const response = await this.client.embeddings.create({
			model: this.model,
			input: text,
		});
		return response.data[0].embedding;
	}

	getDimensions(): number {
		return 1536; // Ada-002 model dimension
	}
}

class CohereEmbeddingProvider implements EmbeddingProvider {
	private client: CohereClient;
	private model: string;

	constructor(apiKey: string, model = 'embed-multilingual-v3.0') {
		this.client = new CohereClient({ token: apiKey });
		this.model = model;
	}

	async getEmbedding(text: string): Promise<number[]> {
		const response = await this.client.embed({
			texts: [text],
			model: this.model,
		});
		return response.embeddings[0];
	}

	getDimensions(): number {
		return 1024; // Cohere model dimension
	}
}

export class EmbeddingService {
	private provider: EmbeddingProvider;
	private static instance: EmbeddingService;

	private constructor() {
		// Default to OpenAI provider - you might want to make this configurable
		this.provider = new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY || '');
	}

	public static getInstance(): EmbeddingService {
		if (!EmbeddingService.instance) {
			EmbeddingService.instance = new EmbeddingService();
		}
		return EmbeddingService.instance;
	}

	public setProvider(provider: 'openai' | 'cohere', apiKey: string): void {
		switch (provider) {
			case 'openai':
				this.provider = new OpenAIEmbeddingProvider(apiKey);
				break;
			case 'cohere':
				this.provider = new CohereEmbeddingProvider(apiKey);
				break;
			default:
				throw new Error(`Unsupported embedding provider: ${provider}`);
		}
	}

	/**
	 * Process a document by splitting it into chunks and generating embeddings
	 */
	async processDocument(
		document: KnowledgeDocument,
		settings: RAGSettings
	): Promise<KnowledgeDocument> {
		try {
			// Split document into chunks
			const chunks = this.splitIntoChunks(
				document.content,
				settings.chunkSize,
				settings.chunkOverlap
			);

			// Generate embeddings for each chunk
			const processedChunks = await Promise.all(
				chunks.map(async (chunk, index) => {
					const embedding = await this.provider.getEmbedding(chunk.content);
					return {
						...chunk,
						embedding,
					};
				})
			);

			// Generate embedding for the entire document
			const documentEmbedding = await this.provider.getEmbedding(document.content);

			return {
				...document,
				embedding: documentEmbedding,
				chunks: processedChunks,
				lastUpdated: new Date()
			};
		} catch (error) {
			console.error('Error processing document:', error);
			throw error;
		}
	}

	/**
	 * Split text into chunks with overlap
	 */
	private splitIntoChunks(
		text: string,
		chunkSize: number,
		overlap: number
	): Array<{ content: string; metadata: { start: number; end: number } }> {
		const chunks: Array<{ content: string; metadata: { start: number; end: number } }> = [];
		const words = text.split(/\s+/);
		const chunkLength = Math.floor(chunkSize * 0.75); // Approximate words per chunk
		const overlapLength = Math.floor(overlap * 0.75); // Approximate overlap words

		for (let i = 0; i < words.length; i += chunkLength - overlapLength) {
			const chunk = words.slice(i, i + chunkLength).join(' ');
			chunks.push({
				content: chunk,
				metadata: {
					start: i,
					end: Math.min(i + chunkLength, words.length),
					source: 'text'
				}
			});
		}

		return chunks;
	}

	/**
	 * Calculate cosine similarity between two vectors
	 */
	private cosineSimilarity(vec1: number[], vec2: number[]): number {
		if (vec1.length !== vec2.length) {
			throw new Error('Vectors must have the same length');
		}

		let dotProduct = 0;
		let norm1 = 0;
		let norm2 = 0;

		for (let i = 0; i < vec1.length; i++) {
			dotProduct += vec1[i] * vec2[i];
			norm1 += vec1[i] * vec1[i];
			norm2 += vec2[i] * vec2[i];
		}

		return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
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
			// Generate embedding for query
			const queryEmbedding = await this.provider.getEmbedding(query);

			// Find relevant chunks across all documents
			const relevantChunks = documents.flatMap(doc =>
				(doc.chunks || []).map(chunk => ({
					content: chunk.content,
					score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
					metadata: {
						source: doc.source,
						documentId: doc.id,
						chunkId: chunk.metadata.source
					}
				}))
			);

			// Sort by similarity and filter by threshold
			const results = relevantChunks
				.filter(chunk => chunk.score >= settings.similarity.threshold)
				.sort((a, b) => b.score - a.score)
				.slice(0, settings.similarity.maxResults);

			return {
				query,
				results,
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
}

export default EmbeddingService;