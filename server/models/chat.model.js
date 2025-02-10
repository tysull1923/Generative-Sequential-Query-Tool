// server/models/chat.model.js
// server/models/chat.model.js
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
	title: String,
	type: String,
	settings: {
		temperature: Number,
		chatType: String,
		systemContext: String,
		modelConfig: {
			provider: String,
			modelName: String,
			maxTokens: Number,
			streaming: Boolean
		},
		savingParams: {
			saveToApplication: Boolean,
			saveToFile: Boolean,
			summary: String,
			fileName: String
		}
	},
	messages: [{
		id: { type: String, required: true },
		role: { type: String, required: true },
		type: { type: String, required: true },
		content: { type: String, default: '' },
		status: { type: String, required: true },
		response: {
			provider: { type: String },
			content: { type: String, default: '' },
			responseType: {
				type: { type: String },
				content: String,
				language: String,
				width: Number,
				height: Number,
				message: String,
				code: String
			}
		},
		number: { type: Number, required: true }
	}],
	messageHistory: [{
		type: { type: String },
		data: mongoose.Schema.Types.Mixed
	}],
	executionStatus: String,
	steps: [{
		id: String,
		type: String,
		position: Number,
		content: String,
		duration: Number,
		message: mongoose.Schema.Types.Mixed
	}],
	// Add project info
	projectInfo: {
		projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
		projectTitle: String
	},
	lastModified: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
});

// Add indexes
chatSchema.index({ createdAt: -1 });
chatSchema.index({ lastModified: -1 });
chatSchema.index({ type: 1 });
chatSchema.index({ 'settings.chatType': 1 });
chatSchema.index({ 'projectInfo.projectId': 1 }); // Add index for project lookups

export const Chat = mongoose.model('Chat', chatSchema);
export default Chat;