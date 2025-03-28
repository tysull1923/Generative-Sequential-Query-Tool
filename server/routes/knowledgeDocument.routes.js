// server/routes/knowledgeDocument.routes.js
import express from 'express';
import multer from 'multer';
import { KnowledgeDocument } from '../models/knowledgeDocument.model.js';
import { Project } from '../models/project.model.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 100 * 1024 * 1024 // 100MB limit
	}
});

// Get all documents for a project
router.get('/project/:projectId', async (req, res) => {
	try {
		const documents = await KnowledgeDocument.find({
			projectId: req.params.projectId
		}).sort({ lastUpdated: -1 });

		res.json({
			success: true,
			data: documents
		});
	} catch (error) {
		console.error('Error listing documents:', error);
		res.status(500).json({
			success: false,
			error: 'Error fetching documents'
		});
	}
});

// Get a specific document
router.get('/:id', async (req, res) => {
	try {
		const document = await KnowledgeDocument.findById(req.params.id);
		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		res.json({
			success: true,
			data: document
		});
	} catch (error) {
		console.error('Error getting document:', error);
		res.status(500).json({
			success: false,
			error: 'Error fetching document'
		});
	}
});

// Create a new document
router.post('/project/:projectId', async (req, res) => {
	try {
		const project = await Project.findById(req.params.projectId);
		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		// Use project title for better metadata
		const projectTitle = project.title || `Project ${req.params.projectId}`;

		const document = new KnowledgeDocument({
			...req.body,
			projectId: req.params.projectId,
			metadata: {
				...(req.body.metadata || {}),
				projectId: req.params.projectId,
				projectTitle: projectTitle,
				addedFromProject: true,
				containerType: 'project',
				containerId: req.params.projectId,
				containerName: projectTitle
			}
		});

		await document.save();
		console.log(`Created document '${document.title}' for project '${projectTitle}' (${req.params.projectId})`);

		res.status(201).json({
			success: true,
			data: document
		});
	} catch (error) {
		console.error('Error creating document:', error);
		res.status(500).json({
			success: false,
			error: 'Error creating document'
		});
	}
});

// Handle file uploads
router.post('/project/:projectId/upload', upload.array('documents', 10), async (req, res) => {
	try {
		const project = await Project.findById(req.params.projectId);
		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		const uploadedDocuments = [];

		// Process each uploaded file
		for (const file of req.files) {
			// Convert file buffer to string
			const content = file.buffer.toString('utf8');

			// Get file extension
			const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

			// Create document with formatted content
			const document = new KnowledgeDocument({
				title: file.originalname,
				content: content,
				source: 'upload',
				projectId: req.params.projectId,
				metadata: {
					fileType: file.mimetype,
					fileSize: file.size,
					extension: fileExtension
				}
			});

			await document.save();
			uploadedDocuments.push(document);
		}

		res.status(201).json({
			success: true,
			data: uploadedDocuments
		});
	} catch (error) {
		console.error('Error uploading documents:', error);
		res.status(500).json({
			success: false,
			error: 'Error uploading documents'
		});
	}
});

// Update a document
router.put('/:id', async (req, res) => {
	try {
		const document = await KnowledgeDocument.findByIdAndUpdate(
			req.params.id,
			{
				...req.body,
				lastUpdated: new Date()
			},
			{ new: true }
		);

		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		res.json({
			success: true,
			data: document
		});
	} catch (error) {
		console.error('Error updating document:', error);
		res.status(500).json({
			success: false,
			error: 'Error updating document'
		});
	}
});

// Delete a document
router.delete('/:id', async (req, res) => {
	try {
		// Find the document first
		const document = await KnowledgeDocument.findById(req.params.id);
		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		// Get the containerId (either projectId or chatId)
		const containerId = document.projectId || document.chatId || document._id;

		// If document was in RAG, remove from RAG first
		if (document.includeInRAG) {
			try {
				// Import the rag service
				const RAGService = (await import('../service/rag.service.js')).default;
				const ragService = RAGService.getInstance();
				
				// Remove document from RAG
				await ragService.removeDocument(containerId.toString(), document._id.toString());
				console.log(`Document ${document._id} removed from RAG`);
			} catch (ragError) {
				console.error('Error removing document from RAG:', ragError);
				// Continue with deletion even if RAG removal fails
			}
		}

		// Now delete the document
		await KnowledgeDocument.findByIdAndDelete(req.params.id);

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting document:', error);
		res.status(500).json({
			success: false,
			error: 'Error deleting document'
		});
	}
});

// Reindex a document
router.post('/:id/reindex', async (req, res) => {
	try {
		const document = await KnowledgeDocument.findById(req.params.id);
		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

		// Update lastUpdated timestamp
		document.lastUpdated = new Date();
		await document.save();

		res.json({
			success: true,
			data: document
		});
	} catch (error) {
		console.error('Error reindexing document:', error);
		res.status(500).json({
			success: false,
			error: 'Error reindexing document'
		});
	}
});

router.get('/chat/:chatId', async (req, res) => {
	try {
		// Build query based on whether projectId is provided
		const query = { source: `chat-${req.params.chatId}` };
		if (req.query.projectId) {
			query.projectId = req.query.projectId;
		}

		const documents = await KnowledgeDocument.find(query)
			.sort({ lastUpdated: -1 });

		res.json({
			success: true,
			data: documents
		});
	} catch (error) {
		console.error('Error fetching chat documents:', error);
		res.status(500).json({
			success: false,
			error: 'Error fetching chat documents'
		});
	}
});

router.post('/chat/:chatId', async (req, res) => {
	try {
		const { projectId, ...documentData } = req.body;
		console.log(`Creating document for chat ${req.params.chatId}`);
		
		// Only verify project if projectId is provided
		if (projectId) {
			const project = await Project.findById(projectId);
			if (!project) {
				return res.status(404).json({
					success: false,
					error: 'Project not found'
				});
			}
		}

		// Get chat document to include chat title in metadata
		let chatTitle = `Chat ${req.params.chatId}`;
		try {
			const chat = await (await import('../models/chat.model.js')).Chat.findById(req.params.chatId);
			if (chat) {
				chatTitle = chat.title || chatTitle;
			}
		} catch (chatError) {
			console.warn(`Could not retrieve chat title: ${chatError.message}`);
		}

		const document = new KnowledgeDocument({
			...documentData,
			projectId, // Will be undefined if not provided
			chatId: req.params.chatId, // Store chatId directly on the document
			source: `chat-${req.params.chatId}`,
			metadata: {
				...documentData.metadata,
				chatId: req.params.chatId,
				chatTitle: chatTitle,
				addedFromChat: true,
				containerType: 'chat',
				containerId: req.params.chatId,
				containerName: chatTitle
			}
		});

		await document.save();
		console.log(`Created document '${document.title}' for chat '${chatTitle}' (${req.params.chatId})`);

		res.status(201).json({
			success: true,
			data: document
		});
	} catch (error) {
		console.error('Error creating chat document:', error);
		res.status(500).json({
			success: false,
			error: 'Error creating chat document'
		});
	}
});


export default router;










// server/routes/knowledgeDocument.routes.js
// import express from 'express';
// import mongoose from 'mongoose';
// import multer from 'multer';
// import { KnowledgeDocument } from '../models/knowledgeDocument.model.js';
// import { Project } from '../models/project.model.js';

// const router = express.Router();

// // Configure multer for file uploads with 100MB limit
// const storage = multer.memoryStorage();
// const upload = multer({
// 	storage: storage,
// 	limits: {
// 		fileSize: 100 * 1024 * 1024 // 100MB limit
// 	}
// });

// // Get all documents for a project
// router.get('/project/:projectId', async (req, res) => {
// 	try {
// 		const documents = await KnowledgeDocument.find({
// 			projectId: req.params.projectId
// 		}).sort({ lastUpdated: -1 });

// 		res.json({
// 			success: true,
// 			data: documents
// 		});
// 	} catch (error) {
// 		console.error('Error listing documents:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error fetching documents'
// 		});
// 	}
// });

// // Get a specific document
// router.get('/:id', async (req, res) => {
// 	try {
// 		const document = await KnowledgeDocument.findById(req.params.id);
// 		if (!document) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Document not found'
// 			});
// 		}

// 		res.json({
// 			success: true,
// 			data: document
// 		});
// 	} catch (error) {
// 		console.error('Error getting document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error fetching document'
// 		});
// 	}
// });

// // Create a new document
// router.post('/project/:projectId', async (req, res) => {
// 	try {
// 		// Verify project exists
// 		const project = await Project.findById(req.params.projectId);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found'
// 			});
// 		}

// 		// Create the document
// 		const document = await KnowledgeDocument.create({
// 			...req.body,
// 			projectId: req.params.projectId,
// 			includeInRAG: true,
// 			chunks: [],
// 			metadata: {}
// 		});

// 		// Add document reference to project
// 		project.knowledgeBase.documents.push(document._id);
// 		await project.save();

// 		res.status(201).json({
// 			success: true,
// 			data: document
// 		});
// 	} catch (error) {
// 		console.error('Error creating document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error creating document'
// 		});
// 	}
// });

// // Handle file uploads
// // router.post('/project/:projectId/upload', upload.array('documents', 10), async (req, res) => {
// // 	const session = await mongoose.startSession();
// // 	session.startTransaction();

// // 	try {
// // 		// Verify project exists
// // 		const project = await Project.findById(req.params.projectId).session(session);
// // 		if (!project) {
// // 			await session.abortTransaction();
// // 			return res.status(404).json({
// // 				success: false,
// // 				error: 'Project not found'
// // 			});
// // 		}

// // 		const uploadedDocuments = [];

// // 		// Process each uploaded file
// // 		for (const file of req.files) {
// // 			const content = file.buffer.toString('utf-8');

// // 			// Create document with proper metadata structure
// // 			const documentData = {
// // 				title: file.originalname,
// // 				content: content,
// // 				source: 'upload',
// // 				projectId: req.params.projectId,
// // 				includeInRAG: true,
// // 				chunks: [],
// // 				metadata: {
// // 					fileType: file.mimetype,
// // 					fileSize: file.size,
// // 					uploadDate: new Date(),
// // 					contentType: file.mimetype
// // 				}
// // 			};

// // 			// Validate metadata before saving
// // 			const document = new KnowledgeDocument(documentData);
// // 			const validationError = document.validateSync();
// // 			if (validationError) {
// // 				throw new Error(`Document validation failed: ${validationError.message}`);
// // 			}

// // 			const savedDocument = await document.save({ session });

// // 			// Add document reference to project
// // 			project.knowledgeBase.documents.push(savedDocument._id);
// // 			uploadedDocuments.push(savedDocument);
// // 		}

// // 		// Save project with new document references
// // 		await project.save({ session });

// // 		// Commit transaction
// // 		await session.commitTransaction();

// // 		res.status(201).json({
// // 			success: true,
// // 			data: uploadedDocuments
// // 		});
// // 	} catch (error) {
// // 		await session.abortTransaction();
// // 		console.error('Error uploading documents:', error);
// // 		res.status(500).json({
// // 			success: false,
// // 			error: error.message
// // 		});
// // 	} finally {
// // 		session.endSession();
// // 	}
// // });
// router.post('/project/:projectId/upload', upload.array('documents', 10), async (req, res) => {
// 	try {
// 		// Verify if project exists
// 		const project = await Project.findById(req.params.projectId);
// 		if (!project) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Project not found',
// 			});
// 		}

// 		const uploadedDocuments = [];

// 		// Process each uploaded file
// 		for (const file of req.files) {
// 			const content = file.buffer.toString('utf-8'); // Extract file content

// 			// Create a new document entry
// 			const document = new KnowledgeDocument({
// 				title: file.originalname,
// 				content: content, // Store extracted content
// 				source: 'upload',
// 				projectId: req.params.projectId,
// 				includeInRAG: true,
// 				chunks: [],
// 				metadata: {
// 					fileType: file.mimetype,
// 					fileSize: file.size,
// 					uploadDate: new Date(),
// 					contentType: file.mimetype
// 				}
// 			});

// 			// Validate and save document
// 			const validationError = document.validateSync();
// 			if (validationError) {
// 				throw new Error(`Document validation failed: ${validationError.message}`);
// 			}

// 			const savedDocument = await document.save();

// 			// Add document reference to project
// 			project.knowledgeBase.documents.push(savedDocument._id);
// 			await project.save();

// 			uploadedDocuments.push(savedDocument);
// 		}

// 		res.status(201).json({
// 			success: true,
// 			data: uploadedDocuments,
// 		});
// 	} catch (error) {
// 		console.error('Error uploading documents:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message,
// 		});
// 	}
// });

// // Update a document
// router.put('/:id', async (req, res) => {
// 	try {
// 		const document = await KnowledgeDocument.findByIdAndUpdate(
// 			req.params.id,
// 			{
// 				...req.body,
// 				lastUpdated: new Date()
// 			},
// 			{ new: true, runValidators: true }
// 		);

// 		if (!document) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Document not found'
// 			});
// 		}

// 		res.json({
// 			success: true,
// 			data: document
// 		});
// 	} catch (error) {
// 		console.error('Error updating document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error updating document'
// 		});
// 	}
// });

// // Delete a document
// router.delete('/:id', async (req, res) => {
// 	try {
// 		const document = await KnowledgeDocument.findById(req.params.id);
// 		if (!document) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Document not found'
// 			});
// 		}

// 		// Remove document reference from project
// 		await Project.findByIdAndUpdate(
// 			document.projectId,
// 			{ $pull: { 'knowledgeBase.documents': document._id } }
// 		);

// 		// Delete the document
// 		await document.deleteOne();

// 		res.status(204).send();
// 	} catch (error) {
// 		console.error('Error deleting document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error deleting document'
// 		});
// 	}
// });

// // Toggle RAG inclusion
// router.patch('/:id/toggle-rag', async (req, res) => {
// 	try {
// 		const document = await KnowledgeDocument.findById(req.params.id);
// 		if (!document) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Document not found'
// 			});
// 		}

// 		document.includeInRAG = !document.includeInRAG;
// 		await document.save();

// 		res.json({
// 			success: true,
// 			data: document
// 		});
// 	} catch (error) {
// 		console.error('Error toggling RAG inclusion:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error toggling RAG inclusion'
// 		});
// 	}
// });

// // Reindex a document
// router.post('/:id/reindex', async (req, res) => {
// 	try {
// 		const document = await KnowledgeDocument.findById(req.params.id);
// 		if (!document) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'Document not found'
// 			});
// 		}

// 		// Here you would implement your chunking and embedding logic
// 		document.lastUpdated = new Date();
// 		await document.save();

// 		res.json({
// 			success: true,
// 			data: document
// 		});
// 	} catch (error) {
// 		console.error('Error reindexing document:', error);
// 		res.status(500).json({
// 			success: false,
// 			error: error.message || 'Error reindexing document'
// 		});
// 	}
// });

// export default router;