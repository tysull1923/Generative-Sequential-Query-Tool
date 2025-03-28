// server/models/knowledgeDocument.model.js
import mongoose from 'mongoose';
import { type } from 'os';

const chunkSchema = new mongoose.Schema({
	content: { 
		type: String, 
		required: true 
	},
	embedding: [Number],
	metadata: {
		start: Number,
		end: Number,
		source: String,
	},
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
		required: false
	},
	chatId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Chat',
		required: false
	},
	metadata: {
		type: mongoose.Schema.Types.Mixed,
		default: {}
	},
	// Track if document is included in RAG
	includeInRAG: {
		type: Boolean,
		default: false
	},
	// Store collection ID this document belongs to
	ragCollectionId: {
		type: String,
		default: null
	},
	// Store chunked content
	chunks: [chunkSchema],
	addedAt: {
		type: Date,
		default: Date.now
	},
	lastUpdated: {
		type: Date,
		default: Date.now
	}
});

// Update lastUpdated timestamp on save
knowledgeDocumentSchema.pre('save', function (next) {
	this.lastUpdated = new Date();
	next();
});

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);

// // server/models/knowledgeDocument.model.js
// // server/models/knowledgeDocument.model.js
// import mongoose from "mongoose"

// const chunkSchema = new mongoose.Schema({
// 	content: { type: String, required: true },
// 	embedding: [Number],
// 	metadata: {
// 		start: Number,
// 		end: Number,
// 		source: String,
// 	},
// })

// const knowledgeDocumentSchema = new mongoose.Schema({
// 	title: {
// 		type: String,
// 		required: true,
// 		trim: true,
// 	},
// 	content: {
// 		type: String,
// 		required: function () {
// 			return !this.contentUrl
// 		},
// 	},
// 	contentUrl: {
// 		type: String,
// 		required: function () {
// 			return !this.content
// 		},
// 	},
// 	source: {
// 		type: String,
// 		required: true,
// 	},
// 	projectId: {
// 		type: mongoose.Schema.Types.ObjectId,
// 		ref: "Project",
// 		required: true,
// 	},
// 	includeInRAG: {
// 		type: Boolean,
// 		default: true,
// 	},
// 	chunks: [chunkSchema],
// 	metadata: {
// 		type: Map,
// 		of: mongoose.Schema.Types.Mixed,
// 		default: () => new Map(),
// 	},
// 	addedAt: {
// 		type: Date,
// 		default: Date.now,
// 	},
// 	lastUpdated: {
// 		type: Date,
// 		default: Date.now,
// 	},
// })

// knowledgeDocumentSchema.pre("save", function (next) {
// 	this.lastUpdated = new Date()
// 	next()
// })

// export const KnowledgeDocument = mongoose.model("KnowledgeDocument", knowledgeDocumentSchema)














// // server/models/knowledgeDocument.model.js
// // server/models/knowledgeDocument.model.js
// import mongoose from 'mongoose';

// const chunkSchema = new mongoose.Schema({
// 	content: { type: String, required: true },
// 	embedding: [Number],
// 	metadata: {
// 		start: Number,
// 		end: Number,
// 		source: String
// 	}
// });

// const knowledgeDocumentSchema = new mongoose.Schema({
// 	title: {
// 		type: String,
// 		required: true,
// 		trim: true
// 	},
// 	content: {
// 		type: String,
// 		required: true
// 	},
// 	source: {
// 		type: String,
// 		required: true
// 	},
// 	projectId: {
// 		type: mongoose.Schema.Types.ObjectId,
// 		ref: 'Project',
// 		required: true
// 	},
// 	includeInRAG: {
// 		type: Boolean,
// 		default: true
// 	},
// 	chunks: [chunkSchema],
// 	metadata: {
// 		type: Map,
// 		of: mongoose.Schema.Types.Mixed,
// 		default: () => new Map()
// 	},
// 	addedAt: {
// 		type: Date,
// 		default: Date.now
// 	},
// 	lastUpdated: {
// 		type: Date,
// 		default: Date.now
// 	}
// });

// knowledgeDocumentSchema.pre('save', function (next) {
// 	this.lastUpdated = new Date();
// 	next();
// });

// export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);