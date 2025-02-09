// server/models/chat.model.ts
import mongoose, { Schema } from 'mongoose';
import { ChatDocument, ChatType, Role, ChatCardState, ExecutionStatus } from '../../src/utils/types/chat.types';

const chatSchema = new Schema({
	title: String,
	type: {
		type: String,
		enum: Object.values(ChatType),
		default: ChatType.BASE
	},
	settings: {
		temperature: Number,
		chatType: {
			type: String,
			enum: Object.values(ChatType),
		},
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
		role: {
			type: String,
			enum: Object.values(Role),
			required: true
		},
		type: {
			type: String,
			enum: Object.values(ChatType),
			required: true
		},
		content: { type: Schema.Types.Mixed, default: '' }, // Using Mixed for MessageContent
		status: {
			type: String,
			enum: Object.values(ChatCardState),
			required: true
		},
		response: {
			provider: {
				type: String,
				enum: Object.values(Role)
			},
			content: Schema.Types.Mixed, // Using Mixed for MessageContent
			responseType: {
				type: { type: String },
				content: Schema.Types.Mixed,
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
		data: Schema.Types.Mixed // Store LangChain BaseMessage data
	}],
	executionStatus: {
		type: String,
		enum: Object.values(ExecutionStatus),
		default: ExecutionStatus.IDLE
	},
	steps: [{
		id: String,
		type: String,
		position: Number,
		content: Schema.Types.Mixed,
		duration: Number,
		message: Schema.Types.Mixed
	}],
	lastModified: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
});

// Add indexes
chatSchema.index({ createdAt: -1 });
chatSchema.index({ lastModified: -1 });
chatSchema.index({ type: 1 });
chatSchema.index({ 'settings.chatType': 1 });

export const Chat = mongoose.model<ChatDocument>('Chat', chatSchema);
export default Chat;