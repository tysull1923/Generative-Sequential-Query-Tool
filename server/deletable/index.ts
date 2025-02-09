// server/index.ts

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { DatabaseService } from '../services/database.services';
import chatRoutes from '../routes/chat.routes';
import projectRoutes from '../routes/project.routes';

class Server {
	private app: express.Application;
	private port: number | string;
	private dbService: DatabaseService;

	constructor() {
		this.app = express();
		this.port = process.env.PORT || 5000;
		this.dbService = DatabaseService.getInstance();
		this.configure();
	}

	private configure(): void {
		// Middleware
		this.app.use(cors());
		this.app.use(bodyParser.json({ limit: '50mb' }));
		this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

		// Request logging
		this.app.use((req: Request, res: Response, next: NextFunction) => {
			console.log(`${req.method} ${req.path}`);
			next();
		});

		// Routes
		this.app.use('/api', chatRoutes);
		this.app.use('/api', projectRoutes);

		// Health check endpoint
		this.app.get('/health', (req: Request, res: Response) => {
			res.json({
				status: 'healthy',
				timestamp: new Date().toISOString(),
				database: this.dbService.getConnectionStatus() ? 'connected' : 'disconnected'
			});
		});

		// Error handling
		this.app.use(this.errorHandler);

		// 404 handler
		this.app.use(this.notFoundHandler);
	}

	private errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
		console.error('Unhandled error:', err);
		res.status(500).json({
			success: false,
			error: err.message,
			details: process.env.NODE_ENV === 'development' ? err.stack : undefined
		});
	}

	private notFoundHandler(req: Request, res: Response): void {
		res.status(404).json({
			success: false,
			error: 'Not Found',
			message: `Cannot ${req.method} ${req.path}`
		});
	}

	private setupGracefulShutdown(): void {
		const shutdown = async (signal: string) => {
			console.log(`\n${signal} received. Shutting down gracefully...`);
			try {
				await this.dbService.disconnect();
				process.exit(0);
			} catch (error) {
				console.error('Error during shutdown:', error);
				process.exit(1);
			}
		};

		process.on('SIGTERM', () => shutdown('SIGTERM'));
		process.on('SIGINT', () => shutdown('SIGINT'));
	}

	public async start(): Promise<void> {
		try {
			// Connect to database
			await this.dbService.connect();

			// Setup graceful shutdown
			this.setupGracefulShutdown();

			// Start server
			this.app.listen(this.port, () => {
				console.log(`Server running on port ${this.port}`);
				console.log(`API endpoint: http://localhost:${this.port}/api`);
				console.log(`Health check: http://localhost:${this.port}/health`);
			});
		} catch (error) {
			console.error('Error starting server:', error);
			process.exit(1);
		}
	}
}

// Initialize and start server
const server = new Server();
server.start().catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});