// server/services/rag.service.js
// import { Chroma } from "@langchain/community/vectorstores/chroma";
// import { OpenAIEmbeddings } from "@langchain/openai";
// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { Document } from "@langchain/core/documents";
// import { v4 as uuidv4 } from 'uuid';
// import dotenv from 'dotenv';

// dotenv.config();

// // Enum for embedding providers
// export const EmbeddingProvider = {
// 	OPENAI: 'openai',
// 	OLLAMA: 'ollama'
// };

// export class RAGService {
// 	static instance = null;
// 	embeddings = null;
// 	collections = new Map();
// 	collectionMetadata = new Map();
// 	embeddingProvider = null;

// 	constructor(provider = EmbeddingProvider.OLLAMA) {
// 		this.initializeEmbeddings(provider);
// 	}

// 	initializeEmbeddings(provider) {
// 		this.embeddingProvider = provider;

// 		if (provider === EmbeddingProvider.OPENAI) {
// 			this.embeddings = new OpenAIEmbeddings({
// 				openAIApiKey: process.env.OPENAI_API_KEY,
// 				modelName: "text-embedding-3-small"
// 			});
// 		} else {
// 			// Default to Ollama
// 			this.embeddings = new OllamaEmbeddings({
// 				model: "nomic-embed-text", // or any other Ollama embedding model
// 				baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
// 			});
// 		}
// 	}

// 	static getInstance(provider) {
// 		if (!RAGService.instance) {
// 			RAGService.instance = new RAGService(provider);
// 		} else if (provider && RAGService.instance.embeddingProvider !== provider) {
// 			// Reinitialize embeddings if provider changes
// 			RAGService.instance.initializeEmbeddings(provider);
// 		}
// 		return RAGService.instance;
// 	}

// 	async getOrCreateCollection(containerId, settings) {
// 		try {
// 			// Check if collection exists in memory
// 			if (this.collections.has(containerId)) {
// 				const collection = this.collections.get(containerId);

// 				// Update settings if provided
// 				if (settings && this.collectionMetadata.has(containerId)) {
// 					const metadata = this.collectionMetadata.get(containerId);
// 					metadata.settings = settings;
// 					metadata.lastUpdated = new Date();
// 					this.collectionMetadata.set(containerId, metadata);
// 				}

// 				return collection;
// 			}

// 			// Create a new collection with unique name
// 			const collectionName = `${containerId}-${uuidv4()}`;

// 			const collection = await Chroma.fromTexts(
// 				["initialization"],
// 				[{ containerId, initialization: true }],
// 				this.embeddings,
// 				{
// 					collectionName,
// 					collectionMetadata: {
// 						containerId: containerId,
// 						settings: JSON.stringify(settings || {}),
// 						embeddingProvider: this.embeddingProvider
// 					}
// 				}
// 			);

// 			this.collections.set(containerId, collection);

// 			// Store collection metadata
// 			this.collectionMetadata.set(containerId, {
// 				documentCount: 0,
// 				lastUpdated: new Date(),
// 				settings: settings || {
// 					chunkSize: 1000,
// 					chunkOverlap: 200,
// 					embedding: {
// 						model: this.embeddingProvider === EmbeddingProvider.OPENAI ?
// 							'text-embedding-3-small' : 'nomic-embed-text',
// 						dimensions: this.embeddingProvider === EmbeddingProvider.OPENAI ? 1536 : 768
// 					},
// 					similarity: {
// 						threshold: 0.7,
// 						maxResults: 5
// 					}
// 				}
// 			});

// 			return collection;
// 		} catch (error) {
// 			console.error('Error creating/getting collection:', error);
// 			throw error;
// 		}
// 	}

// 	async addDocument(containerId, document, settings) {
// 		try {
// 			if (!document.content) {
// 				throw new Error("Document content is required");
// 			}

// 			const collection = await this.getOrCreateCollection(containerId, settings);

// 			// Split text into chunks
// 			const splitter = new RecursiveCharacterTextSplitter({
// 				chunkSize: settings.chunkSize,
// 				chunkOverlap: settings.chunkOverlap,
// 			});

// 			const chunks = await splitter.createDocuments(
// 				[document.content],
// 				[{
// 					source: document.source,
// 					documentId: document._id.toString(),
// 					metadata: document.metadata
// 				}]
// 			);

// 			// Generate unique IDs for each chunk
// 			const chunkIds = chunks.map(() => uuidv4());

// 			// Add metadata to chunks
// 			const documentsWithMetadata = chunks.map((chunk, index) => {
// 				const doc = new Document({
// 					pageContent: chunk.pageContent,
// 					metadata: {
// 						...chunk.metadata,
// 						documentId: document._id.toString(),
// 						chunkId: chunkIds[index],
// 						source: document.source,
// 						lastUpdated: new Date().toISOString(),
// 						embeddingProvider: this.embeddingProvider
// 					}
// 				});
// 				return doc;
// 			});

// 			// Add chunks to collection
// 			await collection.addDocuments(documentsWithMetadata);

// 			// Store chunk information in document object
// 			document.chunks = chunks.map((chunk, index) => ({
// 				id: chunkIds[index],
// 				content: chunk.pageContent,
// 				metadata: {
// 					start: chunk.metadata?.start || 0,
// 					end: chunk.metadata?.end || chunk.pageContent.length,
// 					source: document.source,
// 					embeddingProvider: this.embeddingProvider
// 				}
// 			}));

// 			// Update collection metadata
// 			const metadata = this.collectionMetadata.get(containerId);
// 			metadata.documentCount += chunks.length;
// 			metadata.lastUpdated = new Date();
// 			this.collectionMetadata.set(containerId, metadata);

// 			return document;
// 		} catch (error) {
// 			console.error('Error adding document to RAG:', error);
// 			throw error;
// 		}
// 	}

// 	async query(containerId, query, settings) {
// 		try {
// 			const collection = await this.getOrCreateCollection(containerId, settings);

// 			const results = await collection.similaritySearch(
// 				query,
// 				settings.similarity.maxResults,
// 				{ score: true }
// 			);

// 			// Format results
// 			const formattedResults = results.map(result => ({
// 				content: result.pageContent,
// 				score: result.metadata.score || 0,
// 				metadata: {
// 					documentId: result.metadata.documentId,
// 					chunkId: result.metadata.chunkId,
// 					source: result.metadata.source,
// 					embeddingProvider: result.metadata.embeddingProvider
// 				}
// 			}));

// 			return {
// 				query,
// 				results: formattedResults,
// 				embeddingProvider: this.embeddingProvider
// 			};
// 		} catch (error) {
// 			console.error('Error querying RAG system:', error);
// 			throw error;
// 		}
// 	}

// 	async removeDocument(containerId, documentId) {
// 		try {
// 			const collection = await this.getOrCreateCollection(containerId);

// 			// Delete all chunks associated with the document
// 			await collection.delete({
// 				filter: { documentId: documentId.toString() }
// 			});

// 			// Update collection metadata
// 			const metadata = this.collectionMetadata.get(containerId);
// 			if (metadata) {
// 				metadata.lastUpdated = new Date();
// 				this.collectionMetadata.set(containerId, metadata);
// 			}
// 		} catch (error) {
// 			console.error('Error removing document from RAG:', error);
// 			throw error;
// 		}
// 	}

// 	async updateSettings(containerId, settings) {
// 		try {
// 			// For LangChain/Chroma, we need to recreate the collection with new settings
// 			// First, get all documents from the existing collection
// 			const oldCollection = await this.getOrCreateCollection(containerId);
// 			const allDocs = await oldCollection.similaritySearch("", 1000); // Get all documents

// 			// Remove the old collection
// 			this.collections.delete(containerId);

// 			// Create new collection with updated settings
// 			const newCollection = await this.getOrCreateCollection(containerId, settings);

// 			// Re-add all documents
// 			if (allDocs.length > 0) {
// 				await newCollection.addDocuments(allDocs);
// 			}

// 			// Update local metadata
// 			this.collectionMetadata.set(containerId, {
// 				...this.collectionMetadata.get(containerId),
// 				settings: settings,
// 				lastUpdated: new Date()
// 			});
// 		} catch (error) {
// 			console.error('Error updating RAG settings:', error);
// 			throw error;
// 		}
// 	}

// 	async reindexDocument(containerId, document, settings) {
// 		try {
// 			// Remove existing document chunks
// 			await this.removeDocument(containerId, document._id);

// 			// Re-add document with current settings
// 			return await this.addDocument(containerId, document, settings);
// 		} catch (error) {
// 			console.error('Error reindexing document:', error);
// 			throw error;
// 		}
// 	}

// 	async getCollectionInfo(containerId) {
// 		try {
// 			if (this.collectionMetadata.has(containerId)) {
// 				return {
// 					...this.collectionMetadata.get(containerId),
// 					embeddingProvider: this.embeddingProvider
// 				};
// 			}
// 			return null;
// 		} catch (error) {
// 			console.error('Error getting collection info:', error);
// 			throw error;
// 		}
// 	}
// }

// export default RAGService;


// 
// server/services/rag.service.js
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export class RAGService {
	static instance = null;
	embeddings = null;
	collections = new Map();
	collectionMetadata = new Map();
	chromaClient = null;

	constructor() {
		// Initialize Chroma client
		this.chromaClient = new ChromaClient({
			path: process.env.CHROMA_URL || "http://localhost:8000"
		});

		// Initialize Ollama embeddings
		this.embeddings = new OllamaEmbeddings({
			model: "llama3.1",
			baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
		});

		// Test connections on startup
		this.initializeConnections();
	}

	async initializeConnections() {
		try {
			// Test Chroma connection
			const heartbeat = await this.chromaClient.heartbeat();
			console.log("Chroma connection established:", heartbeat);

			// Test Ollama connection
			await this.embeddings.embedQuery("test");
			console.log("Ollama embedding connection established");
		} catch (error) {
			console.error("Error initializing connections:", error);
			throw error;
		}
	}

	static getInstance() {
		if (!RAGService.instance) {
			RAGService.instance = new RAGService();
		}
		return RAGService.instance;
	}

	async getOrCreateCollection(containerId, settings) {
		try {
			// Check if collection exists in memory
			if (this.collections.has(containerId)) {
				const collection = this.collections.get(containerId);

				// Update settings if provided
				if (settings && this.collectionMetadata.has(containerId)) {
					const metadata = this.collectionMetadata.get(containerId);
					metadata.settings = settings;
					metadata.lastUpdated = new Date();
					this.collectionMetadata.set(containerId, metadata);
				}

				return collection;
			}

			// Check if collection exists in Chroma
			const collections = await this.chromaClient.listCollections();
			console.log("Available collections:", collections);
			try {
				const existingCollection = collections.find(c =>
					c.name.startsWith(`${containerId}-`));

				if (existingCollection) {
					// Reconnect to existing collection
					const collection = await Chroma.fromExistingCollection(
						this.embeddings,
						{
							collectionName: existingCollection.name,
							url: process.env.CHROMA_URL || "http://localhost:8000",
						}
					);
					this.collections.set(containerId, collection);
					return collection;
				}
			} catch (error) {
				console.error('Error checking existing collections:', error);
			}

			// const existingCollection = collections.find(c =>
			// 	c.name.startsWith(`${containerId}-`));

			// if (existingCollection) {
			// 	// Reconnect to existing collection
			// 	const collection = await Chroma.fromExistingCollection(
			// 		this.embeddings,
			// 		{
			// 			collectionName: existingCollection.name,
			// 			url: process.env.CHROMA_URL || "http://localhost:8000",
			// 		}
			// 	);
			// 	this.collections.set(containerId, collection);
			// 	return collection;
			// }

			// Create a new collection
			const collectionName = `${containerId}-${uuidv4()}`;

			// First create in Chroma directly
			await this.chromaClient.createCollection({
				name: collectionName,
				metadata: {
					containerId: containerId,
					settings: JSON.stringify(settings || {})
				}
			});

			// Then create LangChain wrapper
			const collection = await Chroma.fromExistingCollection(
				this.embeddings,
				{
					collectionName,
					url: process.env.CHROMA_URL || "http://localhost:8000",
				}
			);

			this.collections.set(containerId, collection);

			// Store collection metadata
			this.collectionMetadata.set(containerId, {
				documentCount: 0,
				lastUpdated: new Date(),
				settings: settings || {
					chunkSize: 512,
					chunkOverlap: 50,
					embedding: {
						model: 'llama3.1',
						dimensions: 4096
					},
					similarity: {
						threshold: 0.7,
						maxResults: 5
					}
				}
			});

			return collection;
		} catch (error) {
			console.error('Error creating/getting collection:', error);
			throw error;
		}
	}
	async addDocument(containerId, document, settings) {
		try {
			if (!document.content) {
				throw new Error("Document content is required");
			}

			const collection = await this.getOrCreateCollection(containerId, settings);

			// Split text into chunks
			const splitter = new RecursiveCharacterTextSplitter({
				chunkSize: settings.chunkSize,
				chunkOverlap: settings.chunkOverlap,
			});

			const chunks = await splitter.createDocuments(
				[document.content],
				[{
					source: document.source,
					documentId: document._id.toString(),
					metadata: document.metadata
				}]
			);

			// Generate unique IDs for each chunk
			const chunkIds = chunks.map(() => uuidv4());

			// Add metadata to chunks
			const documentsWithMetadata = chunks.map((chunk, index) => {
				const doc = new Document({
					pageContent: chunk.pageContent,
					metadata: {
						...chunk.metadata,
						documentId: document._id.toString(),
						chunkId: chunkIds[index],
						source: document.source,
						lastUpdated: new Date().toISOString(),
						embeddingProvider: this.embeddingProvider
					}
				});
				return doc;
			});

			// Add chunks to collection
			await collection.addDocuments(documentsWithMetadata);

			// Store chunk information in document object
			document.chunks = chunks.map((chunk, index) => ({
				id: chunkIds[index],
				content: chunk.pageContent,
				metadata: {
					start: chunk.metadata?.start || 0,
					end: chunk.metadata?.end || chunk.pageContent.length,
					source: document.source,
					embeddingProvider: this.embeddingProvider
				}
			}));

			// Update collection metadata
			const metadata = this.collectionMetadata.get(containerId);
			metadata.documentCount += chunks.length;
			metadata.lastUpdated = new Date();
			this.collectionMetadata.set(containerId, metadata);

			return document;
		} catch (error) {
			console.error('Error adding document to RAG:', error);
			throw error;
		}
	}

	async query(containerId, query, settings) {
		try {
			const collection = await this.getOrCreateCollection(containerId, settings);

			const results = await collection.similaritySearch(
				query,
				settings.similarity.maxResults,
				{ score: true }
			);

			// Format results
			const formattedResults = results.map(result => ({
				content: result.pageContent,
				score: result.metadata.score || 0,
				metadata: {
					documentId: result.metadata.documentId,
					chunkId: result.metadata.chunkId,
					source: result.metadata.source,
					embeddingProvider: result.metadata.embeddingProvider
				}
			}));

			return {
				query,
				results: formattedResults,
				embeddingProvider: this.embeddingProvider
			};
		} catch (error) {
			console.error('Error querying RAG system:', error);
			throw error;
		}
	}

	async removeDocument(containerId, documentId) {
		try {
			const collection = await this.getOrCreateCollection(containerId);

			// Delete all chunks associated with the document
			await collection.delete({
				filter: { documentId: documentId.toString() }
			});

			// Update collection metadata
			const metadata = this.collectionMetadata.get(containerId);
			if (metadata) {
				metadata.lastUpdated = new Date();
				this.collectionMetadata.set(containerId, metadata);
			}
		} catch (error) {
			console.error('Error removing document from RAG:', error);
			throw error;
		}
	}

	async updateSettings(containerId, settings) {
		try {
			// For LangChain/Chroma, we need to recreate the collection with new settings
			// First, get all documents from the existing collection
			const oldCollection = await this.getOrCreateCollection(containerId);
			const allDocs = await oldCollection.similaritySearch("", 1000); // Get all documents

			// Remove the old collection
			this.collections.delete(containerId);

			// Create new collection with updated settings
			const newCollection = await this.getOrCreateCollection(containerId, settings);

			// Re-add all documents
			if (allDocs.length > 0) {
				await newCollection.addDocuments(allDocs);
			}

			// Update local metadata
			this.collectionMetadata.set(containerId, {
				...this.collectionMetadata.get(containerId),
				settings: settings,
				lastUpdated: new Date()
			});
		} catch (error) {
			console.error('Error updating RAG settings:', error);
			throw error;
		}
	}

	async reindexDocument(containerId, document, settings) {
		try {
			// Remove existing document chunks
			await this.removeDocument(containerId, document._id);

			// Re-add document with current settings
			return await this.addDocument(containerId, document, settings);
		} catch (error) {
			console.error('Error reindexing document:', error);
			throw error;
		}
	}

	async deleteCollection(containerId) {
		try {
			const collection = this.collections.get(containerId);
			if (collection) {
				// Delete from Chroma
				await this.chromaClient.deleteCollection({
					name: collection.collectionName,
				});

				// Remove from local cache
				this.collections.delete(containerId);
				this.collectionMetadata.delete(containerId);
			}
		} catch (error) {
			console.error('Error deleting collection:', error);
			throw error;
		}
	}

	async listCollections() {
		try {
			const collections = await this.chromaClient.listCollections();
			return collections.map(collection => ({
				name: collection.name,
				metadata: collection.metadata
			}));
		} catch (error) {
			console.error('Error listing collections:', error);
			throw error;
		}
	}
}

export default RAGService;