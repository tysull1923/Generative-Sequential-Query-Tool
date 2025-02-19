// server/routes/rag.routes.js
// server/routes/rag.routes.js
import express from 'express';
import { RAGService } from '../service/rag.service.js';
import { KnowledgeDocument } from '../models/knowledgeDocument.model.js';
import { Project } from '../models/project.model.js';
import { Chat } from '../models/chat.model.js';

const router = express.Router();
const ragService = RAGService.getInstance();

// Query the RAG system
router.post('/:containerId/query', async (req, res) => {
	try {
		const { query, settings } = req.body;
		const containerId = req.params.containerId;

		if (!query) {
			return res.status(400).json({
				success: false,
				error: 'Query is required'
			});
		}

		const results = await ragService.query(containerId, query, settings);
		console.log('RAG query results:', results);
		res.json({
			success: true,
			data: results
		});
	} catch (error) {
		console.error('Error querying RAG system:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Error querying RAG system'
		});
	}
});

// Add document to RAG
router.post('/:containerId/documents', async (req, res) => {
	try {
		const { document, settings } = req.body;
		const containerId = req.params.containerId;
		console.log('Adding document to RAG in server:', document);
		if (!document || !document.content) {
			return res.status(400).json({
				success: false,
				error: 'Document with content is required'
			});
		}

		// Add to RAG system
		await ragService.addDocument(containerId, document, settings);

		// Update MongoDB document with RAG status
		if (document._id) {
			const mongoDoc = await KnowledgeDocument.findById(document._id);
			if (mongoDoc) {
				mongoDoc.includeInRAG = true;
				await mongoDoc.save();
			}
		}

		res.json({
			success: true,
			data: { message: 'Document added to RAG system' }
		});
	} catch (error) {
		console.error('Error adding document to RAG:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Error adding document to RAG'
		});
	}
});

// Remove document from RAG
router.delete('/:containerId/documents/:documentId', async (req, res) => {
	try {
		const { containerId, documentId } = req.params;

		// Remove from RAG system
		await ragService.removeDocument(containerId, documentId);

		// Update MongoDB document
		const mongoDoc = await KnowledgeDocument.findById(documentId);
		if (mongoDoc) {
			mongoDoc.includeInRAG = false;
			await mongoDoc.save();
		}

		res.status(200).json({
			success: true,
			data: { message: 'Document removed from RAG system' }
		});
	} catch (error) {
		console.error('Error removing document from RAG:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Error removing document from RAG'
		});
	}
});

// Toggle document inclusion
router.patch('/:containerId/documents/:documentId/toggle', async (req, res) => {
	try {
		const { containerId, documentId } = req.params;
		const { include } = req.body;

		// Get document and settings
		const document = await KnowledgeDocument.findById(documentId);
		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		let settings;
		if (document.projectId) {
			const project = await Project.findById(document.projectId);
			settings = project?.knowledgeBase?.settings;
		}

		// Toggle in RAG
		await ragService.toggleDocumentInclusion(containerId, documentId, include, document, settings);

		// Update MongoDB
		document.includeInRAG = include;
		await document.save();

		res.json({
			success: true,
			data: { message: `Document ${include ? 'added to' : 'removed from'} RAG system` }
		});
	} catch (error) {
		console.error('Error toggling document inclusion:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Error toggling document inclusion'
		});
	}
});

// Reindex document
router.post('/:containerId/documents/:documentId/reindex', async (req, res) => {
	try {
		const { containerId, documentId } = req.params;

		const document = await KnowledgeDocument.findById(documentId);
		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		let settings;
		if (document.projectId) {
			const project = await Project.findById(document.projectId);
			settings = project?.knowledgeBase?.settings;
		}

		await ragService.reindexDocument(containerId, document, settings);

		res.json({
			success: true,
			data: { message: 'Document reindexed successfully' }
		});
	} catch (error) {
		console.error('Error reindexing document:', error);
		res.status(500).json({
			success: false,
			error: error.message || 'Error reindexing document'
		});
	}
});

export default router;