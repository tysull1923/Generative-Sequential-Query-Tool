// server/index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import chatRoutes from './routes/chat.routes.js';
import projectRoutes from './routes/project.routes.js';
import knowledgeDocumentRoutes from './routes/knowledgeDocument.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with increased limits
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

// Debug middleware
app.use((req, res, next) => {
	console.log(`${req.method} ${req.path}`);
	next();
});

// MongoDB Connection
console.log('Attempting to connect to MongoDB...');

mongoose.connect('mongodb://127.0.0.1:27017/gsqt_db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
	family: 4
})
	.then(() => {
		console.log('Successfully connected to MongoDB.');
	})
	.catch((error) => {
		console.error('MongoDB connection error:', error);
		process.exit(1);
	});

// Routes
app.use('/api/chats', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/knowledge', knowledgeDocumentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	res.status(500).json({
		success: false,
		error: err.message || 'Internal Server Error',
		details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		error: 'Not Found',
		message: `Cannot ${req.method} ${req.path}`
	});
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`API endpoint: http://localhost:${PORT}/api`);
	console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handlers
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