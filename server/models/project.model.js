// server/models/project.model.js
import mongoose from 'mongoose';

const ChunkMetadataSchema = new mongoose.Schema({
	start: Number,
	end: Number,
	source: String
}, { _id: false });

const DocumentChunkSchema = new mongoose.Schema({
	content: { type: String, required: true },
	embedding: [Number],
	metadata: ChunkMetadataSchema
}, { _id: false });

const KnowledgeDocumentSchema = new mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	source: { type: String, required: true },
	embedding: [Number],
	chunks: [DocumentChunkSchema],
	addedAt: { type: Date, default: Date.now },
	lastUpdated: { type: Date, default: Date.now }
});

const RAGSettingsSchema = new mongoose.Schema({
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

const ProjectChatSchema = new mongoose.Schema({
	chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
	addedAt: { type: Date, default: Date.now },
	includeInRAG: { type: Boolean, default: true }
});

const ProjectSchema = new mongoose.Schema({
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
		enum: ['active', 'archived', 'completed'],
		default: 'active',
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

export const Project = mongoose.model('Project', ProjectSchema);
export default Project;