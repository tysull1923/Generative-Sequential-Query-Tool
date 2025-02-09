// server/routes/chat.routes.ts
import express, { Request, Response } from 'express';
import { Chat } from '../models/chat.model';
import { ChatDocument } from '../../src/utils/types/chat.types';
import { ApiResponse, RequestWithFilter } from '../types/dbAPI.types';

const router = express.Router();

// Create a new chat
router.post('/chats', async (
	req: RequestWithFilter<Partial<ChatDocument>>,
	res: Response<ApiResponse<ChatDocument>>
) => {
	try {
		console.log('Creating new chat...');
		const chatData = req.body;
		console.log('Received data:', JSON.stringify(chatData, null, 2));

		const newChat = new Chat(chatData);
		const savedChat = await newChat.save();

		console.log('Chat saved successfully with ID:', savedChat._id);
		res.status(201).json({
			success: true,
			data: savedChat
		});
	} catch (error) {
		console.error('Error saving chat:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Get all chats
router.get('/chats', async (
	req: RequestWithFilter,
	res: Response<ApiResponse<ChatDocument[]>>
) => {
	try {
		const chats = await Chat.find().sort({ createdAt: -1 });
		res.json({
			success: true,
			data: chats
		});
	} catch (error) {
		console.error('Error fetching chats:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Get a specific chat
router.get('/chats/:id', async (
	req: Request<{ id: string }>,
	res: Response<ApiResponse<ChatDocument>>
) => {
	try {
		const chat = await Chat.findById(req.params.id);
		if (!chat) {
			return res.status(404).json({
				success: false,
				error: 'Chat not found'
			});
		}
		res.json({
			success: true,
			data: chat
		});
	} catch (error) {
		console.error('Error fetching chat:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Update a chat
router.put('/chats/:id', async (
	req: Request<{ id: string }, any, Partial<ChatDocument>>,
	res: Response<ApiResponse<ChatDocument>>
) => {
	try {
		const updatedChat = await Chat.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!updatedChat) {
			return res.status(404).json({
				success: false,
				error: 'Chat not found'
			});
		}
		res.json({
			success: true,
			data: updatedChat
		});
	} catch (error) {
		console.error('Error updating chat:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Copy a chat
router.post('/chats/:id/copy', async (
	req: Request<{ id: string }>,
	res: Response<ApiResponse<ChatDocument>>
) => {
	try {
		console.log('Copying chat:', req.params.id);
		const originalChat = await Chat.findById(req.params.id);
		if (!originalChat) {
			return res.status(404).json({
				success: false,
				error: 'Chat not found'
			});
		}

		const chatData = originalChat.toObject();
		delete chatData._id;

		chatData.title = `${chatData.title || 'Untitled Chat'} (Copy)`;
		chatData.createdAt = new Date();
		chatData.lastModified = new Date();

		const newChat = new Chat(chatData);
		const savedChat = await newChat.save();

		console.log('Chat copied successfully with ID:', savedChat._id);
		res.status(201).json({
			success: true,
			data: savedChat
		});
	} catch (error) {
		console.error('Error copying chat:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Delete a chat
router.delete('/chats/:id', async (
	req: Request<{ id: string }>,
	res: Response<ApiResponse<void>>
) => {
	try {
		const deletedChat = await Chat.findByIdAndDelete(req.params.id);
		if (!deletedChat) {
			return res.status(404).json({
				success: false,
				error: 'Chat not found'
			});
		}
		res.status(204).json({
			success: true
		});
	} catch (error) {
		console.error('Error deleting chat:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

export default router;