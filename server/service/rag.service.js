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

	async initializeCollection(containerId) {
		try {
			let collection = this.collections.get(containerId);

			if (!collection) {
				collection = await this.client.getOrCreateCollection({
					name: `collection_${containerId}`,
					metadata: { containerId }
				});
				this.collections.set(containerId, collection);
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
			const collection = await this.initializeCollection(containerId);
			const embedder = await this.getEmbeddingModel(settings);

			console.log('Generating query embedding for:', query);
			const queryEmbedding = await embedder.embedQuery(query);

			// Get maximum number of results (default 50)
			const maxResults = settings?.similarity?.maxResults || 50;
			console.log('Querying with maxResults:', maxResults);

			// Perform similarity search with more lenient filtering
			const results = await collection.query({
				queryEmbeddings: [queryEmbedding],
				nResults: maxResults,
				where: { includeInRAG: true }
			});

			console.log('Raw ChromaDB results:', {
				documentsLength: results.documents?.[0]?.length || 0,
				distancesLength: results.distances?.[0]?.length || 0,
				metadataLength: results.metadatas?.[0]?.length || 0
			});

			if (!results.documents?.[0]?.length) {
				console.log('No documents found in results');
				return { results: [] };
			}

			// Process results with adjusted similarity handling
			// ChromaDB uses L2 distance by default, so higher scores mean less similar
			// Setting a higher threshold based on observed scores
			const threshold = settings?.similarity?.threshold || 500.0; // Adjusted threshold based on actual scores
			console.log('Using similarity threshold:', threshold);

			// Sort by score (lower is better) and take top results
			const processedResults = results.documents[0]
				.map((doc, index) => ({
					content: doc,
					score: results.distances[0][index],
					metadata: results.metadatas[0][index]
				}))
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
			const collection = await this.initializeCollection(containerId);
			const embedder = await this.getEmbeddingModel(settings);

			// Process document into chunks
			const docs = await this.processDocument(document, settings);

			// Generate embeddings and add to collection
			for (const doc of docs) {
				const embedding = await embedder.embedDocuments([doc.pageContent]);

				await collection.add({
					ids: [`${document._id}_${docs.indexOf(doc)}`],
					embeddings: embedding,
					documents: [doc.pageContent],
					metadatas: [{
						documentId: document._id,
						chunkIndex: docs.indexOf(doc),
						includeInRAG: true,
						...doc.metadata
					}]
				});
			}
		} catch (error) {
			console.error('Error adding document to RAG:', error);
			throw new Error('Failed to add document to RAG system');
		}
	}


	async removeDocument(containerId, documentId) {
		try {
			const collection = await this.initializeCollection(containerId);

			// Find all chunks for this document
			const chunks = await collection.get({
				where: { documentId }
			});

			// Remove chunks
			if (chunks.ids.length > 0) {
				await collection.delete({
					ids: chunks.ids
				});
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
				await this.addDocument(containerId, document, settings);
			} else {
				// Remove document from RAG
				await this.removeDocument(containerId, documentId);
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