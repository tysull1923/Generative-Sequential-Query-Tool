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

		const document = new KnowledgeDocument({
			...req.body,
			projectId: req.params.projectId,
		});

		await document.save();

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
		const document = await KnowledgeDocument.findByIdAndDelete(req.params.id);
		if (!document) {
			return res.status(404).json({
				success: false,
				error: 'Document not found'
			});
		}

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