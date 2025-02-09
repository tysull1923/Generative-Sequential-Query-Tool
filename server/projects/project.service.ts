// src/server/services/project.service.ts

import mongoose from 'mongoose';
import { Project, ProjectModel } from './project.schema';
import {
	ProjectDocument,
	KnowledgeDocument,
	ProjectStatus,
	RAGSettings,
	RAGQueryResult
} from '../../src/utils/types/project.types';
import { EmbeddingService } from '../../src/services/api/rag/embedding/embedding.service';

export class ProjectService {
	private static instance: ProjectService;
	private embeddingService: EmbeddingService;

	private constructor() {
		this.embeddingService = new EmbeddingService();
	}

	public static getInstance(): ProjectService {
		if (!ProjectService.instance) {
			ProjectService.instance = new ProjectService();
		}
		return ProjectService.instance;
	}

	/**
	 * Create a new project
	 */
	async createProject(projectData: Partial<ProjectDocument>): Promise<ProjectModel> {
		try {
			const project = new Project({
				...projectData,
				createdAt: new Date(),
				lastModified: new Date()
			});
			return await project.save();
		} catch (error) {
			console.error('Error creating project:', error);
			throw error;
		}
	}

	/**
	 * Get a project by ID
	 */
	async getProject(projectId: string): Promise<ProjectModel | null> {
		try {
			return await Project.findById(projectId);
		} catch (error) {
			console.error('Error getting project:', error);
			throw error;
		}
	}

	/**
	 * List all projects with optional filters
	 */
	async listProjects(filters: {
		status?: ProjectStatus;
		tags?: string[];
		category?: string;
	} = {}): Promise<ProjectModel[]> {
		try {
			const query: any = {};

			if (filters.status) {
				query.status = filters.status;
			}
			if (filters.tags?.length) {
				query['metadata.tags'] = { $all: filters.tags };
			}
			if (filters.category) {
				query['metadata.category'] = filters.category;
			}

			return await Project.find(query).sort({ lastModified: -1 });
		} catch (error) {
			console.error('Error listing projects:', error);
			throw error;
		}
	}

	/**
	 * Update a project
	 */
	async updateProject(
		projectId: string,
		updates: Partial<ProjectDocument>
	): Promise<ProjectModel | null> {
		try {
			return await Project.findByIdAndUpdate(
				projectId,
				{
					...updates,
					lastModified: new Date()
				},
				{ new: true }
			);
		} catch (error) {
			console.error('Error updating project:', error);
			throw error;
		}
	}

	/**
	 * Delete a project
	 */
	async deleteProject(projectId: string): Promise<boolean> {
		try {
			const result = await Project.findByIdAndDelete(projectId);
			return !!result;
		} catch (error) {
			console.error('Error deleting project:', error);
			throw error;
		}
	}

	/**
	 * Add a document to project's knowledge base
	 */
	async addDocument(
		projectId: string,
		document: KnowledgeDocument
	): Promise<ProjectModel | null> {
		try {
			const project = await Project.findById(projectId);
			if (!project) return null;

			// Generate embeddings for document chunks
			const processedDoc = await this.embeddingService.processDocument(
				document,
				project.knowledgeBase.settings
			);

			await project.addDocument(processedDoc);
			return project;
		} catch (error) {
			console.error('Error adding document:', error);
			throw error;
		}
	}

	/**
	 * Remove a document from project's knowledge base
	 */
	async removeDocument(
		projectId: string,
		documentId: string
	): Promise<ProjectModel | null> {
		try {
			const project = await Project.findById(projectId);
			if (!project) return null;

			await project.removeDocument(documentId);
			return project;
		} catch (error) {
			console.error('Error removing document:', error);
			throw error;
		}
	}

	/**
	 * Add a chat to the project
	 */
	async addChat(
		projectId: string,
		chatId: string,
		includeInRAG: boolean = true
	): Promise<ProjectModel | null> {
		try {
			const project = await Project.findById(projectId);
			if (!project) return null;

			await project.addChat(chatId, includeInRAG);
			return project;
		} catch (error) {
			console.error('Error adding chat:', error);
			throw error;
		}
	}

	/**
	 * Remove a chat from the project
	 */
	async removeChat(
		projectId: string,
		chatId: string
	): Promise<ProjectModel | null> {
		try {
			const project = await Project.findById(projectId);
			if (!project) return null;

			await project.removeChat(chatId);
			return project;
		} catch (error) {
			console.error('Error removing chat:', error);
			throw error;
		}
	}

	/**
	 * Update RAG settings
	 */
	async updateRAGSettings(
		projectId: string,
		settings: RAGSettings
	): Promise<ProjectModel | null> {
		try {
			return await Project.findByIdAndUpdate(
				projectId,
				{
					'knowledgeBase.settings': settings,
					lastModified: new Date()
				},
				{ new: true }
			);
		} catch (error) {
			console.error('Error updating RAG settings:', error);
			throw error;
		}
	}

	/**
	 * Query the project's RAG knowledge base
	 */
	async queryKnowledgeBase(
		projectId: string,
		query: string
	): Promise<RAGQueryResult> {
		try {
			const project = await Project.findById(projectId);
			if (!project) {
				throw new Error('Project not found');
			}

			return await this.embeddingService.queryDocuments(
				query,
				project.knowledgeBase.documents,
				project.knowledgeBase.settings
			);
		} catch (error) {
			console.error('Error querying knowledge base:', error);
			throw error;
		}
	}

	/**
	 * Reindex a specific document
	 */
	async reindexDocument(
		projectId: string,
		documentId: string
	): Promise<ProjectModel | null> {
		try {
			const project = await Project.findById(projectId);
			if (!project) return null;

			const document = project.knowledgeBase.documents.find(
				doc => doc._id.toString() === documentId
			);

			if (!document) return project;

			// Regenerate embeddings
			const processedDoc = await this.embeddingService.processDocument(
				document,
				project.knowledgeBase.settings
			);

			// Update document
			const docIndex = project.knowledgeBase.documents.findIndex(
				doc => doc._id.toString() === documentId
			);
			project.knowledgeBase.documents[docIndex] = processedDoc;
			project.markModified('knowledgeBase.documents');

			return await project.save();
		} catch (error) {
			console.error('Error reindexing document:', error);
			throw error;
		}
	}
}

export default ProjectService;