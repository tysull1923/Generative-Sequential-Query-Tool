// server/routes/chat.routes.js
import express from 'express';
import { Chat } from '../models/chat.model.js';

const router = express.Router();

// Helper function for consistent error handling
const handleRouteError = (res, error, message = 'An error occurred') => {
	console.error(`${message}:`, error);
	res.status(500).json({
		success: false,
		error: error.message || message
	});
};

// Create a new chat
router.post('/', async (req, res) => {
	try {
		console.log('Creating new chat...');
		const chatData = req.body;
		const newChat = new Chat(chatData);
		const savedChat = await newChat.save();

		console.log('Chat saved successfully with ID:', savedChat._id);
		res.status(201).json({
			success: true,
			data: savedChat
		});
	} catch (error) {
		handleRouteError(res, error, 'Error saving chat');
	}
});

// Get all chats
router.get('/', async (req, res) => {
	try {
		const chats = await Chat.find().sort({ createdAt: -1 });
		res.json({
			success: true,
			data: chats
		});
	} catch (error) {
		handleRouteError(res, error, 'Error fetching chats');
	}
});

// Get a specific chat
router.get('/:id', async (req, res) => {
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
		handleRouteError(res, error, 'Error fetching chat');
	}
});

// Update a chat
router.put('/:id', async (req, res) => {
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
		handleRouteError(res, error, 'Error updating chat');
	}
});

// Copy a chat
router.post('/:id/copy', async (req, res) => {
	try {
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

		res.status(201).json({
			success: true,
			data: savedChat
		});
	} catch (error) {
		handleRouteError(res, error, 'Error copying chat');
	}
});

// Delete a chat
router.delete('/:id', async (req, res) => {
	try {
		const deletedChat = await Chat.findByIdAndDelete(req.params.id);
		if (!deletedChat) {
			return res.status(404).json({
				success: false,
				error: 'Chat not found'
			});
		}
		res.status(200).json({
			success: true,
			data: { id: req.params.id }
		});
	} catch (error) {
		handleRouteError(res, error, 'Error deleting chat');
	}
});


export default router;