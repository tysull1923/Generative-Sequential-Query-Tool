// src/server/models/project.schema.ts

import mongoose, { Schema, Document } from 'mongoose';
import { ProjectStatus, RAGSettings } from '../../src/utils/types/project.types';


// Knowledge Document Schema
const KnowledgeDocumentSchema = new Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	source: { type: String, required: true },
	embedding: [Number],  // Vector embedding
	chunks: [{
		content: { type: String, required: true },
		embedding: [Number],
		metadata: {
			start: Number,
			end: Number,
			source: String
		}
	}],
	addedAt: { type: Date, default: Date.now },
	lastUpdated: { type: Date, default: Date.now }
});

// Project Chat Schema
const ProjectChatSchema = new Schema({
	chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
	addedAt: { type: Date, default: Date.now },
	includeInRAG: { type: Boolean, default: true }
});

// RAG Settings Schema
const RAGSettingsSchema = new Schema({
	chunkSize: { type: Number, default: 500 },
	chunkOverlap: { type: Number, default: 50 },
	embedding: {
		model: { type: String, default: 'openai-ada-002' },
		dimensions: { type: Number, default: 1536 }
	},
	similarity: {
		threshold: { type: Number, default: 0.7 },
		maxResults: { type: Number, default: 5 }
	}
});

// Main Project Schema
const ProjectSchema = new Schema({
	title: {
		type: String,
		required: true,
		trim: true,
		index: true
	},
	description: {
		type: String,
		trim: true
	},
	status: {
		type: String,
		enum: Object.values(ProjectStatus),
		default: ProjectStatus.ACTIVE,
		index: true
	},
	chats: [ProjectChatSchema],
	knowledgeBase: {
		documents: [KnowledgeDocumentSchema],
		settings: RAGSettingsSchema
	},
	metadata: {
		tags: [String],
		category: String
	},
	createdAt: {
		type: Date,
		default: Date.now,
		index: true
	},
	lastModified: {
		type: Date,
		default: Date.now,
		index: true
	}
}, {
	timestamps: {
		createdAt: 'createdAt',
		updatedAt: 'lastModified'
	}
});

// Indexes
ProjectSchema.index({ 'knowledgeBase.documents.title': 1 });
ProjectSchema.index({ 'knowledgeBase.documents.lastUpdated': 1 });
ProjectSchema.index({ 'chats.chatId': 1 });
ProjectSchema.index({ 'metadata.tags': 1 });

// Methods
ProjectSchema.methods.addDocument = async function (doc) {
	this.knowledgeBase.documents.push(doc);
	this.lastModified = new Date();
	return this.save();
};

ProjectSchema.methods.removeDocument = async function (docId) {
	this.knowledgeBase.documents = this.knowledgeBase.documents.filter(
		doc => doc._id.toString() !== docId
	);
	this.lastModified = new Date();
	return this.save();
};

ProjectSchema.methods.addChat = async function (chatId, includeInRAG = true) {
	this.chats.push({ chatId, includeInRAG });
	this.lastModified = new Date();
	return this.save();
};

ProjectSchema.methods.removeChat = async function (chatId) {
	this.chats = this.chats.filter(
		chat => chat.chatId.toString() !== chatId
	);
	this.lastModified = new Date();
	return this.save();
};

// Middleware
ProjectSchema.pre('save', function (next) {
	this.lastModified = new Date();
	next();
});

// Export the model and return type
export interface ProjectModel extends Document {
	title: string;
	description?: string;
	status: ProjectStatus;
	chats: {
		chatId: mongoose.Types.ObjectId;
		addedAt: Date;
		includeInRAG: boolean;
	}[];
	knowledgeBase: {
		documents: {
			title: string;
			content: string;
			source: string;
			embedding?: number[];
			chunks?: {
				content: string;
				embedding: number[];
				metadata: {
					start: number;
					end: number;
					source: string;
				};
			}[];
			addedAt: Date;
			lastUpdated: Date;
		}[];
		settings: RAGSettings;
	};
	metadata?: {
		tags?: string[];
		category?: string;
	};
	createdAt: Date;
	lastModified: Date;

	// Methods
	addDocument: (doc: any) => Promise<ProjectModel>;
	removeDocument: (docId: string) => Promise<ProjectModel>;
	addChat: (chatId: string, includeInRAG?: boolean) => Promise<ProjectModel>;
	removeChat: (chatId: string) => Promise<ProjectModel>;
}

export const Project = mongoose.model<ProjectModel>('Project', ProjectSchema);

export default Project;