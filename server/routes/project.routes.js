// server/routes/project.routes.js
import express from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/project.model.js';
import { KnowledgeDocument } from '../models/knowledgeDocument.model.js';

const router = express.Router();

// Create a new project
router.post('/', async (req, res) => {
	try {
		const project = await Project.create({
			...req.body,
			knowledgeBase: {
				documents: [],
				settings: {
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
			}
		});

		res.status(201).json({
			success: true,
			data: project
		});
	} catch (error) {
		console.error('Error creating project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Get all projects
router.get('/', async (req, res) => {
	try {
		const projects = await Project.find({})
			.sort({ lastModified: -1 });

		res.json({
			success: true,
			data: projects
		});
	} catch (error) {
		console.error('Error listing projects:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Get a specific project
router.get('/:id', async (req, res) => {
	try {
		const project = await Project.findById(req.params.id)
			.populate('knowledgeBase.documents');

		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		res.json({
			success: true,
			data: project
		});
	} catch (error) {
		console.error('Error getting project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Update a project
router.put('/:id', async (req, res) => {
	try {
		const project = await Project.findByIdAndUpdate(
			req.params.id,
			{
				...req.body,
				lastModified: new Date()
			},
			{ new: true, runValidators: true }
		);

		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		res.json({
			success: true,
			data: project
		});
	} catch (error) {
		console.error('Error updating project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Delete a project
router.delete('/:id', async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const project = await Project.findById(req.params.id).session(session);
		if (!project) {
			await session.abortTransaction();
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		// Delete associated knowledge documents
		await KnowledgeDocument.deleteMany(
			{ projectId: project._id },
			{ session }
		);

		// Delete the project
		await project.deleteOne({ session });

		await session.commitTransaction();
		res.status(204).send();
	} catch (error) {
		await session.abortTransaction();
		console.error('Error deleting project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	} finally {
		session.endSession();
	}
});

// Add document reference to project
router.post('/:id/documents/:documentId', async (req, res) => {
	try {
		const project = await Project.findById(req.params.id);
		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		project.knowledgeBase.documents.push(req.params.documentId);
		await project.save();

		res.json({
			success: true,
			data: project
		});
	} catch (error) {
		console.error('Error adding document to project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Remove document reference from project
router.delete('/:id/documents/:documentId', async (req, res) => {
	try {
		const project = await Project.findById(req.params.id);
		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		project.knowledgeBase.documents = project.knowledgeBase.documents
			.filter(id => id.toString() !== req.params.documentId);
		await project.save();

		res.status(204).send();
	} catch (error) {
		console.error('Error removing document from project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Update RAG settings
router.put('/:id/rag-settings', async (req, res) => {
	try {
		const project = await Project.findById(req.params.id);
		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		project.knowledgeBase.settings = {
			...project.knowledgeBase.settings,
			...req.body
		};
		await project.save();

		res.json({
			success: true,
			data: project
		});
	} catch (error) {
		console.error('Error updating RAG settings:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

export default router;



// import express from 'express';
// import { Project } from '../models/project.model.js';

// const router = express.Router();

// // Get all projects
// router.get('/', async (req, res) => {
// 	try {
// 		const { status, tags, category } = req.query;
// 		const query = {};

// 		if (status) query.status = status;
// 		if (tags) query['metadata.tags'] = { $in: tags.split(',') };
// 		if (category) query['metadata.category'] = category;

// 		const projects = await Project.find(query).sort({ lastModified: -1 });
// 		res.json({
// 			success: true,
// 			data: projects
// 		});
// 	} catch (error) {
// 		console.error('Error listing projects:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Get a specific project
// router.get('/:id', async (req, res) => {
// 	try {
// 		const project = await Project.findById(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}
// 		res.json({
// 			success: true,
// 			data: project
// 		});
// 	} catch (error) {
// 		console.error('Error getting project:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Create a new project
// router.post('/', async (req, res) => {
// 	try {
// 		const project = await Project.create(req.body);
// 		res.status(201).json({
// 			success: true,
// 			data: project
// 		});
// 	} catch (error) {
// 		console.error('Error creating project:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Update a project
// router.put('/:id', async (req, res) => {
// 	try {
// 		const project = await Project.findByIdAndUpdate(
// 			req.params.id,
// 			req.body,
// 			{ new: true, runValidators: true }
// 		);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}
// 		res.json({
// 			success: true,
// 			data: project
// 		});
// 	} catch (error) {
// 		console.error('Error updating project:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Delete a project
// router.delete('/:id', async (req, res) => {
// 	try {
// 		const project = await Project.findByIdAndDelete(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}
// 		res.status(204).json({
// 			success: true
// 		});
// 	} catch (error) {
// 		console.error('Error deleting project:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Add document to project
// router.post('/:id/documents', async (req, res) => {
// 	try {
// 		const project = await Project.findById(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}

// 		project.knowledgeBase.documents.push(req.body);
// 		await project.save();

// 		res.status(201).json({
// 			success: true,
// 			data: project
// 		});
// 	} catch (error) {
// 		console.error('Error adding document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Remove document from project
// router.delete('/:id/documents/:documentId', async (req, res) => {
// 	try {
// 		const project = await Project.findById(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}

// 		project.knowledgeBase.documents = project.knowledgeBase.documents
// 			.filter(doc => doc._id.toString() !== req.params.documentId);

// 		await project.save();
// 		res.status(204).json({
// 			success: true
// 		});
// 	} catch (error) {
// 		console.error('Error removing document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Update RAG settings
// router.put('/:id/rag-settings', async (req, res) => {
// 	try {
// 		const project = await Project.findById(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}

// 		project.knowledgeBase.settings = {
// 			...project.knowledgeBase.settings,
// 			...req.body
// 		};

// 		await project.save();
// 		res.json({
// 			success: true,
// 			data: project
// 		});
// 	} catch (error) {
// 		console.error('Error updating RAG settings:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Add chat to project
// router.post('/:id/chats/:chatId', async (req, res) => {
// 	try {
// 		const project = await Project.findById(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}

// 		project.chats.push({
// 			chatId: req.params.chatId,
// 			addedAt: new Date(),
// 			includeInRAG: req.body.includeInRAG ?? true
// 		});

// 		await project.save();
// 		res.status(201).json({
// 			success: true,
// 			data: project
// 		});
// 	} catch (error) {
// 		console.error('Error adding chat:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// // Remove chat from project
// router.delete('/:id/chats/:chatId', async (req, res) => {
// 	try {
// 		const project = await Project.findById(req.params.id);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}

// 		project.chats = project.chats
// 			.filter(chat => chat.chatId.toString() !== req.params.chatId);

// 		await project.save();
// 		res.status(204).json({
// 			success: true
// 		});
// 	} catch (error) {
// 		console.error('Error removing chat:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message
// 		});
// 	}
// });

// export default router;