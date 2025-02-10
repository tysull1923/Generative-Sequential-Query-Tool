// server/models/knowledgeDocument.model.js
// server/models/knowledgeDocument.model.js
import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
	content: { type: String, required: true },
	embedding: [Number],
	metadata: {
		start: Number,
		end: Number,
		source: String
	}
});

const knowledgeDocumentSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true
	},
	content: {
		type: String,
		required: true
	},
	source: {
		type: String,
		required: true
	},
	projectId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Project',
		required: true
	},
	includeInRAG: {
		type: Boolean,
		default: true
	},
	chunks: [chunkSchema],
	metadata: {
		type: Map,
		of: mongoose.Schema.Types.Mixed,
		default: () => new Map()
	},
	addedAt: {
		type: Date,
		default: Date.now
	},
	lastUpdated: {
		type: Date,
		default: Date.now
	}
});

knowledgeDocumentSchema.pre('save', function (next) {
	this.lastUpdated = new Date();
	next();
});

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);