// server/routes/rag.routes.js
import express from 'express';
import { RAGService } from '../service/rag.service.js';
import { KnowledgeDocument } from '../models/knowledgeDocument.model.js';
import { Project } from '../models/project.model.js';
import { Chat } from '../models/chat.model.js';

const router = express.Router();
const ragService = RAGService.getInstance();

// Query the RAG system
// Helper to get container settings
const getContainerSettings = async (containerId, type) => {
	if (type === 'project') {
		const project = await Project.findById(containerId);
		return project?.knowledgeBase?.settings;
	} else if (type === 'chat') {
		const chat = await Chat.findById(containerId);
		return chat?.settings?.ragSettings;
	}
	return null;
};

router.post('/:containerId/query', async (req, res) => {
	try {
		const { query, settings } = req.body;
		const results = await ragService.query(req.params.containerId, query, settings);

		res.json({
			success: true,
			data: results
		});
	} catch (error) {
		console.error('Error querying RAG system:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Add/Update document in RAG system
router.post('/:containerId/documents', async (req, res) => {
	try {
		const { document, settings } = req.body;

		// First verify the document exists in MongoDB
		const mongoDoc = await KnowledgeDocument.findById(document._id);
		if (!mongoDoc) {
			return res.status(404).json({
				success: false,
				error: 'Document not found in database'
			});
		}

		// Add to RAG system
		await ragService.addDocument(req.params.containerId, mongoDoc, settings);

		// Update MongoDB document with new status
		mongoDoc.includeInRAG = true;
		await mongoDoc.save();

		res.json({
			success: true,
			data: mongoDoc
		});
	} catch (error) {
		console.error('Error adding document to RAG:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Remove document from RAG system
router.delete('/:containerId/documents/:documentId', async (req, res) => {
	try {
		// Remove from RAG system
		await ragService.removeDocument(req.params.containerId, req.params.documentId);

		// Update MongoDB document
		const mongoDoc = await KnowledgeDocument.findById(req.params.documentId);
		if (mongoDoc) {
			mongoDoc.includeInRAG = false;
			await mongoDoc.save();
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error removing document from RAG:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Update RAG settings
router.put('/:containerId/settings', async (req, res) => {
	try {
		const settings = req.body;

		// Update RAG settings
		await ragService.updateSettings(req.params.containerId, settings);

		// If this is a project, update its settings in MongoDB
		if (req.query.type === 'project') {
			const project = await Project.findById(req.params.containerId);
			if (project) {
				project.knowledgeBase.settings = settings;
				await project.save();
			}
		}

		res.json({
			success: true,
			data: settings
		});
	} catch (error) {
		console.error('Error updating RAG settings:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Reindex a document
router.post('/:containerId/documents/:documentId/reindex', async (req, res) => {
	try {
		// Get document from MongoDB
		const mongoDoc = await KnowledgeDocument.findById(req.params.documentId);
		if (!mongoDoc) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		// Get settings
		let settings;
		if (mongoDoc.projectId) {
			const project = await Project.findById(mongoDoc.projectId);
			settings = project?.knowledgeBase?.settings;
		}

		if (!settings) {
			settings = {
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
			};
		}

		// Reindex in RAG system
		await ragService.reindexDocument(req.params.containerId, mongoDoc, settings);

		res.json({
			success: true,
			data: mongoDoc
		});
	} catch (error) {
		console.error('Error reindexing document:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

export default router;