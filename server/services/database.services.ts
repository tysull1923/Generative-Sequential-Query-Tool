// server/services/database.service.ts

import mongoose from 'mongoose';
import { dbConfig } from '../config/database.config';

export class DatabaseService {
	private static instance: DatabaseService;
	private isConnected: boolean = false;

	private constructor() { }

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	public async connect(): Promise<void> {
		if (this.isConnected) {
			console.log('Using existing database connection');
			return;
		}

		try {
			console.log('Attempting to connect to MongoDB...');
			await mongoose.connect(dbConfig.url, dbConfig.options);

			this.isConnected = true;
			console.log('Successfully connected to MongoDB.');

			// Handle connection events
			mongoose.connection.on('disconnected', () => {
				console.log('MongoDB disconnected');
				this.isConnected = false;
			});

			mongoose.connection.on('error', (error) => {
				console.error('MongoDB connection error:', error);
				this.isConnected = false;
			});

		} catch (error) {
			console.error('Error connecting to MongoDB:', error);
			throw error;
		}
	}

	public async disconnect(): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		try {
			await mongoose.connection.close(false);
			this.isConnected = false;
			console.log('MongoDB connection closed.');
		} catch (error) {
			console.error('Error disconnecting from MongoDB:', error);
			throw error;
		}
	}

	public getConnectionStatus(): boolean {
		return this.isConnected;
	}

	public async clearDatabase(): Promise<void> {
		if (process.env.NODE_ENV === 'test') {
			await mongoose.connection.dropDatabase();
		}
	}
}