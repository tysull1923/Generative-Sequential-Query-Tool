// server/services/rag.service.js
import { ChromaClient } from 'chromadb';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

class RAGService {
	constructor() {
		this.client = new ChromaClient();
		this.collections = new Map();
		this.embeddings = new Map();
		this.textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 512,
			chunkOverlap: 50
		});
	}

	static getInstance() {
		if (!RAGService.instance) {
			RAGService.instance = new RAGService();
		}
		return RAGService.instance;
	}

	async initializeCollection(containerId, documentId = null) {
		try {
			// If documentId is provided, we'll use a separate collection for each document
			const collectionKey = documentId ? `${containerId}_${documentId}` : containerId;
			let collection = this.collections.get(collectionKey);

			if (!collection) {
				// Create unique collection name for each container+document combination
				const collectionName = documentId 
					? `collection_${containerId}_doc_${documentId}` 
					: `collection_${containerId}`;
					
				collection = await this.client.getOrCreateCollection({
					name: collectionName,
					metadata: { 
						containerId,
						documentId: documentId || null,
						createdAt: new Date().toISOString()
					}
				});
				this.collections.set(collectionKey, collection);
			}

			return collection;
		} catch (error) {
			console.error('Error initializing collection:', error);
			throw new Error('Failed to initialize ChromaDB collection');
		}
	}

	async getEmbeddingModel(settings = {}) {
		const modelName = 'nomic-embed-text';
		const baseUrl = settings?.ollama?.baseUrl || 'http://localhost:11434';

		if (!this.embeddings.has(modelName)) {
			this.embeddings.set(modelName, new OllamaEmbeddings({
				model: modelName,
				baseUrl: baseUrl
			}));
		}

		return this.embeddings.get(modelName);
	}


	async processDocument(document, settings = {}) {
		try {
			// Configure text splitter based on settings
			this.textSplitter.chunkSize = settings?.chunkSize || 512;
			this.textSplitter.chunkOverlap = settings?.chunkOverlap || 50;

			// Split the document into chunks
			const docs = await this.textSplitter.createDocuments(
				[document.content],
				[{
					documentId: document._id,
					source: document.source,
					metadata: document.metadata
				}]
			);

			return docs;
		} catch (error) {
			console.error('Error processing document:', error);
			throw new Error('Failed to process document');
		}
	}



	async query(containerId, query, settings = {}) {
		try {
			const embedder = await this.getEmbeddingModel(settings);
			console.log('Generating query embedding for:', query);
			const queryEmbedding = await embedder.embedQuery(query);

			// Get maximum number of results (default 50)
			const maxResults = settings?.similarity?.maxResults || 50;
			const threshold = settings?.similarity?.threshold || 500.0;
			console.log('Querying with maxResults:', maxResults);

			// Get all collections for this container
			const allCollections = await this.client.listCollections();
			const containerCollections = allCollections.filter(c => 
				c.name.startsWith(`collection_${containerId}_doc_`) || 
				c.name === `collection_${containerId}`
			);
			
			console.log(`Found ${containerCollections.length} collections for container ${containerId}`);
			
			if (containerCollections.length === 0) {
				console.log('No collections found for container');
				return { results: [] };
			}

			// Perform query against each collection and combine results
			const allResults = [];
			
			for (const collectionInfo of containerCollections) {
				try {
					const collection = await this.client.getCollection({
						name: collectionInfo.name
					});
					
					// Skip if collection doesn't exist anymore
					if (!collection) continue;
					
					// Query this collection
					const results = await collection.query({
						queryEmbeddings: [queryEmbedding],
						nResults: maxResults,
						where: { includeInRAG: true }
					});
					
					// Process results from this collection
					if (results.documents?.[0]?.length) {
						const processedCollectionResults = results.documents[0]
							.map((doc, index) => ({
								content: doc,
								score: results.distances[0][index],
								metadata: results.metadatas[0][index],
								collectionName: collectionInfo.name // Track which collection this came from
							}));
						
						allResults.push(...processedCollectionResults);
					}
				} catch (error) {
					console.error(`Error querying collection ${collectionInfo.name}:`, error);
					// Continue with other collections
					continue;
				}
			}
			
			if (allResults.length === 0) {
				console.log('No results found across all collections');
				return { results: [] };
			}

			// Process combined results
			console.log(`Combined results from all collections: ${allResults.length}`);
			
			// Sort by score (lower is better) and take top results
			const processedResults = allResults
				.sort((a, b) => a.score - b.score) // Sort by similarity score
				.filter(result => {
					console.log(`Document score: ${result.score} - ${result.score <= threshold ? 'Accepted' : 'Filtered'}`);
					return result.score <= threshold;
				})
				.slice(0, maxResults); // Limit to maxResults
			
			console.log(`Processed ${processedResults.length} results after filtering`);
			return { results: processedResults };
		} catch (error) {
			console.error('Error querying RAG system:', error);
			throw new Error('Failed to query RAG system');
		}
	}






	async addDocument(containerId, document, settings = {}) {
		try {
			// Initialize a collection specifically for this document within this container
			const collection = await this.initializeCollection(containerId, document._id);
			const embedder = await this.getEmbeddingModel(settings);

			// Process document into chunks
			const docs = await this.processDocument(document, settings);
			const chunks = [];
			
			// Generate embeddings and add to collection
			for (const doc of docs) {
				const embedding = await embedder.embedDocuments([doc.pageContent]);
				const chunkIndex = docs.indexOf(doc);
				const chunkId = `${document._id}_${chunkIndex}`;
				
				await collection.add({
					ids: [chunkId],
					embeddings: embedding,
					documents: [doc.pageContent],
					metadatas: [{
						documentId: document._id,
						containerId: containerId,
						chunkIndex: chunkIndex,
						includeInRAG: true,
						...doc.metadata
					}]
				});

				chunks.push({
					id: chunkId,
					content: doc.pageContent,
					metadata: {
						start: doc.metadata?.start || 0,
						end: doc.metadata?.end || doc.pageContent.length,
						source: document.title || document.source
					}
				});
			}
			
			// Store the collection ID in the document for future reference
			document.ragCollectionId = `collection_${containerId}_doc_${document._id}`;
			document.includeInRAG = true;
			document.chunks = chunks;
			
			// Return the updated document data
			return {
				...document,
				ragCollectionId: document.ragCollectionId,
				includeInRAG: true,
				chunks: chunks
			};
		} catch (error) {
			console.error('Error adding document to RAG:', error);
			throw new Error('Failed to add document to RAG system');
		}
	}


	async removeDocument(containerId, documentId) {
		try {
			// Get the document-specific collection
			const collectionKey = `${containerId}_${documentId}`;
			const collectionName = `collection_${containerId}_doc_${documentId}`;
			
			try {
				// Delete the entire collection if it exists
				const exists = await this.client.listCollections();
				const collectionExists = exists.some(c => c.name === collectionName);
				
				if (collectionExists) {
					await this.client.deleteCollection({ name: collectionName });
					// Remove from the collections cache
					this.collections.delete(collectionKey);
					console.log(`Deleted collection ${collectionName} for document ${documentId}`);
				} else {
					console.log(`Collection ${collectionName} not found for document ${documentId}`);
				}
				
				// Also try to delete from the container's main collection as a fallback
				// (In case documents were added to a shared collection in earlier versions)
				const containerCollection = await this.initializeCollection(containerId);
				
				// Find all chunks for this document in the main container collection
				const chunks = await containerCollection.get({
					where: { documentId: documentId }
				});
				
				// Remove chunks if found
				if (chunks.ids.length > 0) {
					await containerCollection.delete({
						ids: chunks.ids
					});
					console.log(`Deleted ${chunks.ids.length} chunks from main collection`);
				}
				
				return true;
			} catch (error) {
				console.error(`Error deleting collection: ${error.message}`);
				return false;
			}
		} catch (error) {
			console.error('Error removing document from RAG:', error);
			throw new Error('Failed to remove document from RAG system');
		}
	}

	async toggleDocumentInclusion(containerId, documentId, include, document = null, settings = {}) {
		try {
			if (include && document) {
				// Add document to RAG
				const result = await this.addDocument(containerId, document, settings);
				
				// Update document with RAG inclusion info
				return {
					success: true,
					ragCollectionId: result.ragCollectionId,
					includeInRAG: true
				};
			} else {
				// Remove document from RAG
				const removed = await this.removeDocument(containerId, documentId);
				
				return {
					success: removed,
					includeInRAG: false,
					ragCollectionId: null
				};
			}
		} catch (error) {
			console.error('Error toggling document inclusion:', error);
			throw new Error('Failed to toggle document inclusion');
		}
	}

	async reindexDocument(containerId, document, settings = {}) {
		try {
			// Remove existing document chunks
			await this.removeDocument(containerId, document._id);

			// Re-add document with potentially new settings
			await this.addDocument(containerId, document, settings);
		} catch (error) {
			console.error('Error reindexing document:', error);
			throw new Error('Failed to reindex document');
		}
	}
}

export default RAGService;