
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
			model: "nomic-embed-text",
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

			// Check if Chroma is properly initialized
			const collections = await this.chromaClient.listCollections();
			console.log("Successfully retrieved collections:",
				Array.isArray(collections) ? collections.length : 'Invalid response');

			// Test Ollama connection
			const testEmbedding = await this.embeddings.embedQuery("test");
			console.log("Ollama embedding connection established, dimensions:", testEmbedding.length);
		} catch (error) {
			console.error("Error initializing connections:", error);
			console.error("Error stack:", error.stack);
			// Don't throw the error, but log it for debugging
		}
	}
	// async initializeConnections() {
	// 	try {
	// 		// Test Chroma connection
	// 		const heartbeat = await this.chromaClient.heartbeat();
	// 		console.log("Chroma connection established:", heartbeat);

	// 		// Test Ollama connection
	// 		await this.embeddings.embedQuery("test");
	// 		console.log("Ollama embedding connection established");
	// 	} catch (error) {
	// 		console.error("Error initializing connections:", error);
	// 		throw error;
	// 	}
	// }

	static getInstance() {
		if (!RAGService.instance) {
			RAGService.instance = new RAGService();
			console.log("RAGService instance created");
		}
		return RAGService.instance;
	}

	// async getOrCreateCollection(containerId, settings) {
	// 	try {
	// 		// Check if collection exists in memory
	// 		if (this.collections.has(containerId)) {
	// 			const collection = this.collections.get(containerId);

	// 			// Update settings if provided
	// 			if (settings && this.collectionMetadata.has(containerId)) {
	// 				const metadata = this.collectionMetadata.get(containerId);
	// 				metadata.settings = settings;
	// 				metadata.lastUpdated = new Date();
	// 				this.collectionMetadata.set(containerId, metadata);
	// 			}

	// 			return collection;
	// 		}

	// 		// Check if collection exists in Chroma
	// 		const collections = await this.chromaClient.listCollections();
	// 		console.log("Available collections:", collections);
	// 		try {
	// 			const existingCollection = collections.find(c =>
	// 				c.name.startsWith(`${containerId}-`));

	// 			if (existingCollection) {
	// 				// Reconnect to existing collection
	// 				const collection = await Chroma.fromExistingCollection(
	// 					this.embeddings,
	// 					{
	// 						collectionName: existingCollection.name,
	// 						url: process.env.CHROMA_URL || "http://localhost:8000",
	// 					}
	// 				);
	// 				this.collections.set(containerId, collection);
	// 				return collection;
	// 			}
	// 		} catch (error) {
	// 			console.error('Error checking existing collections:', error);
	// 		}

	// 		// const existingCollection = collections.find(c =>
	// 		// 	c.name.startsWith(`${containerId}-`));

	// 		// if (existingCollection) {
	// 		// 	// Reconnect to existing collection
	// 		// 	const collection = await Chroma.fromExistingCollection(
	// 		// 		this.embeddings,
	// 		// 		{
	// 		// 			collectionName: existingCollection.name,
	// 		// 			url: process.env.CHROMA_URL || "http://localhost:8000",
	// 		// 		}
	// 		// 	);
	// 		// 	this.collections.set(containerId, collection);
	// 		// 	return collection;
	// 		// }

	// 		// Create a new collection
	// 		const collectionName = `${containerId}-${uuidv4()}`;

	// 		// First create in Chroma directly
	// 		await this.chromaClient.createCollection({
	// 			name: collectionName,
	// 			metadata: {
	// 				containerId: containerId,
	// 				settings: JSON.stringify(settings || {})
	// 			}
	// 		});

	// 		// Then create LangChain wrapper
	// 		const collection = await Chroma.fromExistingCollection(
	// 			this.embeddings,
	// 			{
	// 				collectionName,
	// 				url: process.env.CHROMA_URL || "http://localhost:8000",
	// 			}
	// 		);

	// 		this.collections.set(containerId, collection);

	// 		// Store collection metadata
	// 		this.collectionMetadata.set(containerId, {
	// 			documentCount: 0,
	// 			lastUpdated: new Date(),
	// 			settings: settings || {
	// 				chunkSize: 512,
	// 				chunkOverlap: 50,
	// 				embedding: {
	// 					model: 'nomic-embed-text',
	// 					dimensions: 4096
	// 				},
	// 				similarity: {
	// 					threshold: 0.7,
	// 					maxResults: 5
	// 				}
	// 			}
	// 		});

	// 		return collection;
	// 	} catch (error) {
	// 		console.error('Error creating/getting collection:', error);
	// 		throw error;
	// 	}
	// }
	async getOrCreateCollection(containerId, settings) {
		try {
			// Check if collection exists in memory
			if (this.collections.has(containerId)) {
				const collection = this.collections.get(containerId);
				return collection;
			}

			// Delete existing collection if it exists
			const collections = await this.chromaClient.listCollections();
			console.log("Available collections:", JSON.stringify(collections, null, 2));

			const existingCollection = collections && Array.isArray(collections)
				? collections.find(c => c && c.name && c.name.startsWith(`${containerId}-`))
				: null;

			if (existingCollection) {
				console.log("Found existing collection, deleting to recreate with correct embeddings");
				await this.chromaClient.deleteCollection({
					name: existingCollection.name
				});
			}

			// Create a new collection with proper embeddings
			const collectionName = `${containerId}-${uuidv4()}`;
			console.log("Creating new collection:", collectionName);

			// Test embeddings before creating collection
			const testEmbedding = await this.embeddings.embedQuery("test");
			console.log("Test embedding dimensions:", testEmbedding.length);

			// Create collection metadata with correct dimensions
			const collectionMetadata = {
				containerId: containerId,
				settings: JSON.stringify({
					...settings,
					embedding: {
						model: "nomic-embed-text",
						dimensions: testEmbedding.length // Use actual dimensions from embedding
					}
				})
			};

			// Create collection with explicit embeddings configuration
			const collection = await Chroma.fromTexts(
				["initialization"],
				[{ containerId, initialization: true }],
				this.embeddings,
				{
					collectionName,
					url: process.env.CHROMA_URL || "http://localhost:8000",
					collectionMetadata,
					numDimensions: testEmbedding.length
				}
			);

			// Verify the collection was created with correct embeddings
			console.log("Verifying collection embeddings:", {
				collectionName: collection.collectionName,
				embeddings: collection.embeddings,
				numDimensions: collection.numDimensions
			});

			// Store in memory cache
			this.collections.set(containerId, collection);
			this.collectionMetadata.set(containerId, {
				documentCount: 0,
				lastUpdated: new Date(),
				settings: {
					...settings,
					chunkSize: 512,
					chunkOverlap: 50,
					embedding: {
						model: "nomic-embed-text",
						dimensions: testEmbedding.length
					},
					similarity: {
						threshold: 0.1,
						maxResults: 50
					}
				}
			});

			return collection;
		} catch (error) {
			console.error('Error creating/getting collection:', error);
			console.error('Error stack:', error.stack);
			throw error;
		}
	}
	async addDocument(containerId, document, settings) {
		try {
			if (!document.content) {
				throw new Error("Document content is required");
			}

			const collection = await this.getOrCreateCollection(containerId, settings);
			console.log("Collection retrieved or created with embeddings:", collection.embeddings);

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

			console.log(`Created ${chunks.length} chunks from document`);

			// Generate unique IDs for each chunk
			const chunkIds = chunks.map(() => uuidv4());

			// Test embed first chunk to verify dimensions
			const testEmbedding = await this.embeddings.embedQuery(chunks[0].pageContent);
			console.log("Test chunk embedding dimensions:", testEmbedding.length);

			// Add metadata to chunks
			const documentsWithMetadata = chunks.map((chunk, index) => {
				const doc = new Document({
					id: chunkIds[index],
					pageContent: chunk.pageContent,
					metadata: {
						...chunk.metadata,
						documentId: document._id.toString(),
						chunkId: chunkIds[index],
						source: document.source,
						lastUpdated: new Date().toISOString(),
						embeddingModel: "nomic-embed-text",
						dimensions: testEmbedding.length
					}
				});
				return doc;
			});
			console.log("Documents with metadata prepared for addition:", documentsWithMetadata);
			// Add chunks to collection with verification
			try {
				await collection.addDocuments(documentsWithMetadata);
				console.log(`Successfully added ${documentsWithMetadata.length} chunks to collection`);

				// Verify chunks were added
				const testSearch = await collection.similaritySearch(
					chunks[0].pageContent,
					1,
					{ score: true }
				);
				console.log("Verification search result:", testSearch);
			} catch (error) {
				console.error("Error adding documents to collection:", error);
				throw error;
			}

			// Store chunk information in document object
			document.chunks = chunks.map((chunk, index) => ({
				id: chunkIds[index],
				content: chunk.pageContent,
				metadata: {
					start: chunk.metadata?.start || 0,
					end: chunk.metadata?.end || chunk.pageContent.length,
					source: document.source,
					embeddingModel: "nomic-embed-text",
					dimensions: testEmbedding.length
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

	// async query(containerId, query, settings) {
	// 	try {
	// 		const collection = await this.getOrCreateCollection(containerId, settings);
	// 		console.log("Collection retrieved for querying:", collection);
	// 		const results = await collection.similaritySearch(
	// 			query,
	// 			settings.similarity.maxResults,
	// 			{ score: true }
	// 		);
	// 		console.log("Query results in DB:", results);
	// 		// Format results
	// 		const formattedResults = results.map(result => ({
	// 			content: result.pageContent,
	// 			score: result.metadata.score || 0,
	// 			metadata: {
	// 				documentId: result.metadata.documentId,
	// 				chunkId: result.metadata.chunkId,
	// 				source: result.metadata.source,
	// 				embeddingProvider: result.metadata.embeddingProvider
	// 			}
	// 		}));

	// 		return {
	// 			query,
	// 			results: formattedResults,
	// 			embeddingProvider: this.embeddingProvider
	// 		};
	// 	} catch (error) {
	// 		console.error('Error querying RAG system:', error);
	// 		throw error;
	// 	}
	// }

	// async removeDocument(containerId, documentId) {
	// 	try {
	// 		const collection = await this.getOrCreateCollection(containerId);

	// 		// Delete all chunks associated with the document
	// 		await collection.delete({
	// 			filter: { documentId: documentId.toString() }
	// 		});

	// 		// Update collection metadata
	// 		const metadata = this.collectionMetadata.get(containerId);
	// 		if (metadata) {
	// 			metadata.lastUpdated = new Date();
	// 			this.collectionMetadata.set(containerId, metadata);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error removing document from RAG:', error);
	// 		throw error;
	// 	}
	// }
	async query(containerId, query, settings) {
		try {

			const collection = await this.getOrCreateCollection(containerId, settings);
			console.log("Collection retrieved for querying:", collection);

			console.log("Collection retrieved embeddings:", collection.embeddings);
			const allDocs = await collection.similaritySearch("", 1000);
			console.log("Documents in collection:", allDocs);

			// Log the embeddings configuration
			console.log("Using embeddings:", {
				model: this.embeddings.model,
				baseUrl: this.embeddings.baseUrl
			});

			// Generate embeddings for the query to verify embedding process
			const queryEmbedding = await this.embeddings.embedQuery(query);
			if (!queryEmbedding || queryEmbedding.length === 0) {
				throw new Error("Query embedding failed: No embeddings generated.");
			}
			console.log("Query embedding generated, dimensions:", queryEmbedding.length);

			// Perform similarity search with detailed logging
			console.log("Performing similarity search with settings:", settings.similarity);
			const results = await collection.similaritySearch(
				query,
				settings.similarity.maxResults,
				{ score: true }
			);

			console.log("Raw query results:", results);

			// Format results with additional checks
			const formattedResults = results.map(result => ({
				content: result.pageContent,
				score: result.metadata?.score || 0,
				metadata: {
					documentId: result.metadata?.documentId,
					chunkId: result.metadata?.chunkId,
					source: result.metadata?.source,
					embeddingModel: "nomic-embed-text"
				}
			}));

			console.log("Formatted results:", formattedResults);

			return {
				query,
				results: formattedResults,
				embeddingModel: "nomic-embed-text",
				dimensions: 768
			};
		} catch (error) {
			console.error('Error querying RAG system:', error);
			// Add more detailed error information
			throw new Error(`RAG query failed: ${error.message}. Collection ID: ${containerId}`);
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