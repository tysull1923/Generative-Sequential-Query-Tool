// server/models/project.model.ts
import mongoose, { Schema } from 'mongoose';
import { ProjectDocument, ProjectStatus } from '../../src/utils/types/project.types';

const ChunkMetadataSchema = new Schema({
	start: Number,
	end: Number,
	source: String
}, { _id: false });

const DocumentChunkSchema = new Schema({
	content: { type: String, required: true },
	embedding: [Number],
	metadata: ChunkMetadataSchema
}, { _id: false });

const KnowledgeDocumentSchema = new Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	source: { type: String, required: true },
	embedding: [Number],
	chunks: [DocumentChunkSchema],
	addedAt: { type: Date, default: Date.now },
	lastUpdated: { type: Date, default: Date.now }
});

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
}, { _id: false });

const ProjectChatSchema = new Schema({
	chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
	addedAt: { type: Date, default: Date.now },
	includeInRAG: { type: Boolean, default: true }
});

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

// Add compound indexes
ProjectSchema.index({ 'knowledgeBase.documents.title': 1 });
ProjectSchema.index({ 'knowledgeBase.documents.lastUpdated': 1 });
ProjectSchema.index({ 'chats.chatId': 1 });
ProjectSchema.index({ 'metadata.tags': 1 });

// Virtual populate for chat references
ProjectSchema.virtual('chatDetails', {
	ref: 'Chat',
	localField: 'chats.chatId',
	foreignField: '_id'
});

export const Project = mongoose.model<ProjectDocument>('Project', ProjectSchema);
export default Project;