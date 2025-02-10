// server/routes/project.routes.js
// server/routes/project.routes.js
import express from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/project.model.js';

const router = express.Router();

// Get all projects with populated chat data
router.get('/', async (req, res) => {
	try {
		const { status, tags, category } = req.query;
		const query = {};

		if (status) query.status = status;
		if (tags) query['metadata.tags'] = { $in: tags.split(',') };
		if (category) query['metadata.category'] = category;

		const projects = await Project.find(query)
			.populate({
				path: 'chats.chatId',
				model: 'Chat',
				select: 'title settings type projectInfo createdAt lastModified'
			})
			.sort({ lastModified: -1 });

		// Transform the populated data to match the expected format
		const transformedProjects = projects.map(project => {
			const projectObj = project.toObject();
			projectObj.chats = projectObj.chats.map(chat => ({
				chatId: chat.chatId._id,
				addedAt: chat.addedAt,
				includeInRAG: chat.includeInRAG,
				chat: chat.chatId // This contains the populated chat data
			}));
			return projectObj;
		});

		res.json({
			success: true,
			data: transformedProjects
		});
	} catch (error) {
		console.error('Error listing projects:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Get a specific project with populated chat data
router.get('/:id', async (req, res) => {
	try {
		const project = await Project.findById(req.params.id)
			.populate({
				path: 'chats.chatId',
				model: 'Chat',
				select: 'title settings type projectInfo createdAt lastModified'
			});

		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		// Transform the populated data to match the expected format
		const transformedProject = project.toObject();
		transformedProject.chats = transformedProject.chats.map(chat => ({
			chatId: chat.chatId._id,
			addedAt: chat.addedAt,
			includeInRAG: chat.includeInRAG,
			chat: chat.chatId // This contains the populated chat data
		}));

		res.json({
			success: true,
			data: transformedProject
		});
	} catch (error) {
		console.error('Error getting project:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Add chat to project
router.post('/:id/chats/:chatId', async (req, res) => {
	try {
		const project = await Project.findById(req.params.id);
		if (!project) {
			return res.status(404).json({
				success: false,
				error: 'Project not found'
			});
		}

		// Convert chatId to ObjectId
		const chatId = new mongoose.Types.ObjectId(req.params.chatId);

		// Check if chat already exists in project
		const existingChat = project.chats.find(chat =>
			chat.chatId.toString() === chatId.toString()
		);

		if (existingChat) {
			return res.status(400).json({
				success: false,
				error: 'Chat already exists in project'
			});
		}

		// Add new chat reference
		project.chats.push({
			chatId: chatId,
			addedAt: new Date(),
			includeInRAG: req.body.includeInRAG ?? true
		});

		await project.save();

		// Fetch the updated project with populated chat data
		const updatedProject = await Project.findById(project._id)
			.populate({
				path: 'chats.chatId',
				model: 'Chat',
				select: 'title settings type projectInfo createdAt lastModified'
			});

		// Transform the populated data
		const transformedProject = updatedProject.toObject();
		transformedProject.chats = transformedProject.chats.map(chat => ({
			chatId: chat.chatId._id,
			addedAt: chat.addedAt,
			includeInRAG: chat.includeInRAG,
			chat: chat.chatId
		}));

		res.status(201).json({
			success: true,
			data: transformedProject
		});
	} catch (error) {
		console.error('Error adding chat:', error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});