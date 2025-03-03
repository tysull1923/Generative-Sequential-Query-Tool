// server/models/project.model.js
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		required: true
	},
	status: {
		type: String,
		enum: ['active', 'archived', 'completed'],
		default: 'active'
	},
	knowledgeBase: {
		documents: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'KnowledgeDocument'
		}],
		settings: {
			chunkSize: { type: Number, default: 1000 },
			chunkOverlap: { type: Number, default: 200 },
			embedding: {
				model: { type: String, default: 'default' },
				dimensions: { type: Number, default: 1536 }
			},
			similarity: {
				threshold: { type: Number, default: .7 },
				maxResults: { type: Number, default: 5 }
			}
		}
	},
	metadata: {
		type: Map,
		of: mongoose.Schema.Types.Mixed,
		default: () => new Map()
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	lastModified: {
		type: Date,
		default: Date.now
	}
});

projectSchema.pre('save', function (next) {
	this.lastModified = new Date();
	next();
});

export const Project = mongoose.model('Project', projectSchema);