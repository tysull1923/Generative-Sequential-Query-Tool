// src/pages/project/Project.tsx

// src/pages/project/Project.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, MessageSquare, Loader2 } from 'lucide-react';

import {
	Project,
	ProjectStatus,
	KnowledgeDocument,
	RAGSettings,
	ProjectChat
} from '@/utils/types/project.types';

import ProjectHeader from '@/components/Banner/ProjectBanner/ProjectHeader';
import KnowledgeBasePanel from '@/components/Project/knowledgebasepanel/KnowledgeBasePanel';
import ProjectChats from '@/components/Project/projectchats/ProjectChats';
import RAGSettingsModal from '@/components/Project/RagSettings/RagSettingsModal';
import { ProjectApiService } from '@/services/database/projectDatabaseApiService';

const ProjectPage: React.FC = () => {
	const { projectId } = useParams();
	const navigate = useNavigate();
	const [project, setProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	const projectService = ProjectApiService.getInstance();

	useEffect(() => {
		if (projectId) {
			fetchProject();
		}
	}, [projectId]);

	const fetchProject = async () => {
		try {
			setLoading(true);
			setError(null);
			const projectData = await projectService.getProject(projectId);
			setProject(projectData);
		} catch (err) {
			setError('Failed to load project');
			console.error('Error fetching project:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateProject = async (updates: Partial<Project>) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			const updatedProject = await projectService.updateProject(projectId, updates);
			setProject(updatedProject);
		} catch (err) {
			setError('Failed to update project');
			console.error('Error updating project:', err);
		}
	};

	const handleAddDocument = async (document: KnowledgeDocument) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			const updatedProject = await projectService.addDocument(projectId, document);
			setProject(updatedProject);
		} catch (err) {
			setError('Failed to add document');
			console.error('Error adding document:', err);
		}
	};

	const handleRemoveDocument = async (documentId: string) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			await projectService.removeDocument(projectId, documentId);
			setProject(prev => {
				if (!prev) return null;
				return {
					...prev,
					knowledgeBase: {
						...prev.knowledgeBase,
						documents: prev.knowledgeBase.documents.filter(doc => doc._id !== documentId)
					}
				};
			});
		} catch (err) {
			setError('Failed to remove document');
			console.error('Error removing document:', err);
		}
	};

	const handleAddChat = async (chatId: string, includeInRAG: boolean = true) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			const updatedProject = await projectService.addChat(projectId, { chatId, includeInRAG });
			setProject(updatedProject);
		} catch (err) {
			setError('Failed to add chat');
			console.error('Error adding chat:', err);
		}
	};

	const handleRemoveChat = async (chatId: string) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			await projectService.removeChat(projectId, chatId);
			setProject(prev => {
				if (!prev) return null;
				return {
					...prev,
					chats: prev.chats.filter(chat => chat.chatId !== chatId)
				};
			});
		} catch (err) {
			setError('Failed to remove chat');
			console.error('Error removing chat:', err);
		}
	};

	const handleUpdateRAGSettings = async (settings: RAGSettings) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			const updatedProject = await projectService.updateRAGSettings(projectId, settings);
			setProject(updatedProject);
		} catch (err) {
			setError('Failed to update RAG settings');
			console.error('Error updating RAG settings:', err);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Alert>
					<AlertDescription>Project not found</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<ProjectHeader
				title={project.title}
				status={project.status}
				onUpdateProject={handleUpdateProject}
				onOpenSettings={() => setShowSettings(true)}
			/>

			<main className="container mx-auto px-4 py-6">
				<Tabs defaultValue="knowledge" className="space-y-6">
					<TabsList>
						<TabsTrigger value="knowledge" className="flex items-center gap-2">
							<Book className="h-4 w-4" />
							Knowledge Base
						</TabsTrigger>
						<TabsTrigger value="chats" className="flex items-center gap-2">
							<MessageSquare className="h-4 w-4" />
							Project Chats
						</TabsTrigger>
					</TabsList>

					<TabsContent value="knowledge">
						<KnowledgeBasePanel
							documents={project.knowledgeBase.documents}
							onAddDocument={handleAddDocument}
							onRemoveDocument={handleRemoveDocument}
							settings={project.knowledgeBase.settings}
						/>
					</TabsContent>

					<TabsContent value="chats">
						<ProjectChats
							chats={project.chats}
							onAddChat={handleAddChat}
							onRemoveChat={handleRemoveChat}
						/>
					</TabsContent>
				</Tabs>
			</main>

			{showSettings && (
				<RAGSettingsModal
					isOpen={showSettings}
					onClose={() => setShowSettings(false)}
					settings={project.knowledgeBase.settings}
					onUpdateSettings={handleUpdateRAGSettings}
				/>
			)}
		</div>
	);
};

export default ProjectPage;