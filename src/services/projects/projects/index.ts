// src/server/index.ts

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import projectRoutes from './project.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Database connection
mongoose.connect('mongodb://127.0.0.1:27017/gsqt_db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
	family: 4 // Use IPv4, skip trying IPv6
})
	.then(() => {
		console.log('Successfully connected to MongoDB.');
	})
	.catch((error) => {
		console.error('MongoDB connection error:', error);
		process.exit(1);
	});

// Routes
app.use('/api', projectRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error('Unhandled error:', err);
	res.status(500).json({
		error: err.message || 'Internal Server Error',
		details: process.env.NODE_ENV === 'development' ? err.stack : undefined
	});
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
	});
});

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
	res.json({
		version: '1.0.0',
		endpoints: {
			projects: {
				base: '/api/projects',
				methods: {
					GET: 'List all projects',
					POST: 'Create a new project'
				},
				withId: {
					GET: 'Get project by ID',
					PUT: 'Update project',
					DELETE: 'Delete project'
				}
			},
			documents: {
				base: '/api/projects/:id/documents',
				methods: {
					POST: 'Add document to project',
					DELETE: '/:documentId - Remove document from project'
				}
			},
			chats: {
				base: '/api/projects/:id/chats',
				methods: {
					POST: 'Add chat to project',
					DELETE: '/:chatId - Remove chat from project'
				}
			},
			rag: {
				base: '/api/projects/:id',
				methods: {
					PUT: '/rag-settings - Update RAG settings',
					POST: '/query - Query knowledge base'
				}
			}
		}
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Cannot ${req.method} ${req.path}`
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`API endpoint: http://localhost:${PORT}/api`);
	console.log(`Health check: http://localhost:${PORT}/health`);
	console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received. Shutting down gracefully...');
	mongoose.connection.close(false).then(() => {
		console.log('MongoDB connection closed.');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received. Shutting down gracefully...');
	mongoose.connection.close(false).then(() => {
		console.log('MongoDB connection closed.');
		process.exit(0);
	});
});