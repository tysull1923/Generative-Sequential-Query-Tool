// src/server/routes/project.routes.ts

import express from 'express';
import { ProjectService } from './project.service';

const router = express.Router();
const projectService = ProjectService.getInstance();

// Create a new project
router.post('/projects', async (req, res) => {
	try {
		const project = await projectService.createProject(req.body);
		res.status(201).json(project);
	} catch (error) {
		console.error('Error creating project:', error);
		res.status(500).json({ error: 'Failed to create project' });
	}
});

// Get all projects with optional filters
router.get('/projects', async (req, res) => {
	try {
		const { status, tags, category } = req.query;
		const filters = {
			status: status as string,
			tags: tags ? (tags as string).split(',') : undefined,
			category: category as string
		};
		const projects = await projectService.listProjects(filters);
		res.json(projects);
	} catch (error) {
		console.error('Error listing projects:', error);
		res.status(500).json({ error: 'Failed to list projects' });
	}
});

// Get a specific project
router.get('/projects/:id', async (req, res) => {
	try {
		const project = await projectService.getProject(req.params.id);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.json(project);
	} catch (error) {
		console.error('Error getting project:', error);
		res.status(500).json({ error: 'Failed to get project' });
	}
});

// Update a project
router.put('/projects/:id', async (req, res) => {
	try {
		const project = await projectService.updateProject(req.params.id, req.body);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.json(project);
	} catch (error) {
		console.error('Error updating project:', error);
		res.status(500).json({ error: 'Failed to update project' });
	}
});

// Delete a project
router.delete('/projects/:id', async (req, res) => {
	try {
		const success = await projectService.deleteProject(req.params.id);
		if (!success) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting project:', error);
		res.status(500).json({ error: 'Failed to delete project' });
	}
});

// Knowledge Base Routes

// Add document to project
router.post('/projects/:id/documents', async (req, res) => {
	try {
		const project = await projectService.addDocument(req.params.id, req.body);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.status(201).json(project);
	} catch (error) {
		console.error('Error adding document:', error);
		res.status(500).json({ error: 'Failed to add document' });
	}
});

// Remove document from project
router.delete('/projects/:id/documents/:documentId', async (req, res) => {
	try {
		const project = await projectService.removeDocument(
			req.params.id,
			req.params.documentId
		);
		if (!project) {
			return res.status(404).json({ error: 'Project or document not found' });
		}
		res.status(204).send();
	} catch (error) {
		console.error('Error removing document:', error);
		res.status(500).json({ error: 'Failed to remove document' });
	}
});

// Reindex document
router.post('/projects/:id/documents/:documentId/reindex', async (req, res) => {
	try {
		const project = await projectService.reindexDocument(
			req.params.id,
			req.params.documentId
		);
		if (!project) {
			return res.status(404).json({ error: 'Project or document not found' });
		}
		res.json(project);
	} catch (error) {
		console.error('Error reindexing document:', error);
		res.status(500).json({ error: 'Failed to reindex document' });
	}
});

// Chat Routes

// Add chat to project
router.post('/projects/:id/chats', async (req, res) => {
	try {
		const { chatId, includeInRAG } = req.body;
		const project = await projectService.addChat(
			req.params.id,
			chatId,
			includeInRAG
		);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.status(201).json(project);
	} catch (error) {
		console.error('Error adding chat:', error);
		res.status(500).json({ error: 'Failed to add chat' });
	}
});

// Remove chat from project
router.delete('/projects/:id/chats/:chatId', async (req, res) => {
	try {
		const project = await projectService.removeChat(
			req.params.id,
			req.params.chatId
		);
		if (!project) {
			return res.status(404).json({ error: 'Project or chat not found' });
		}
		res.status(204).send();
	} catch (error) {
		console.error('Error removing chat:', error);
		res.status(500).json({ error: 'Failed to remove chat' });
	}
});

// RAG Settings Routes

// Update RAG settings
router.put('/projects/:id/rag-settings', async (req, res) => {
	try {
		const project = await projectService.updateRAGSettings(
			req.params.id,
			req.body
		);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.json(project);
	} catch (error) {
		console.error('Error updating RAG settings:', error);
		res.status(500).json({ error: 'Failed to update RAG settings' });
	}
});

// Query knowledge base
router.post('/projects/:id/query', async (req, res) => {
	try {
		const { query } = req.body;
		const results = await projectService.queryKnowledgeBase(
			req.params.id,
			query
		);
		res.json(results);
	} catch (error) {
		console.error('Error querying knowledge base:', error);
		res.status(500).json({ error: 'Failed to query knowledge base' });
	}
});

export default router;