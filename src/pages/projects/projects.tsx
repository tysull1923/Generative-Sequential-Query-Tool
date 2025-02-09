// src/pages/project/Project.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Settings, Book, MessageSquare, Database } from 'lucide-react';

import {
	ProjectDocument,
	ProjectStatus,
	KnowledgeDocument,
	RAGSettings,
	ProjectChat
} from '@/utils/types/project.types';

// You'll need to create these components
import ProjectHeader from '@/components/Banner/ProjectBanner/ProjectHeader';
import KnowledgeBasePanel from '@/components/features/project/KnowledgeBasePanel';
import ProjectChats from '@/components/features/project/projectchats/ProjectChats';
import RAGSettingsModal from '@/components/features/project/RagSettings/RagSettingsModal';

interface ProjectProps {
	// Add any props if needed
}

const Project: React.FC<ProjectProps> = () => {
	const { projectId } = useParams();
	const navigate = useNavigate();
	const [project, setProject] = useState<ProjectDocument | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		const fetchProject = async () => {
			try {
				setLoading(true);
				// TODO: Implement project service to fetch project data
				// const projectData = await projectService.getProject(projectId);
				// setProject(projectData);
			} catch (err) {
				setError('Failed to load project');
				console.error('Error fetching project:', err);
			} finally {
				setLoading(false);
			}
		};

		if (projectId) {
			fetchProject();
		}
	}, [projectId]);

	const handleUpdateProject = async (updates: Partial<ProjectDocument>) => {
		try {
			// TODO: Implement project update logic
			// const updatedProject = await projectService.updateProject(projectId, updates);
			// setProject(updatedProject);
		} catch (err) {
			setError('Failed to update project');
			console.error('Error updating project:', err);
		}
	};

	const handleAddDocument = async (document: KnowledgeDocument) => {
		try {
			// TODO: Implement document addition logic
			// const response = await projectService.addDocument(projectId, document);
			// if (response.success) {
			//   setProject(prev => ({
			//     ...prev!,
			//     knowledgeBase: {
			//       ...prev!.knowledgeBase,
			//       documents: [...prev!.knowledgeBase.documents, document]
			//     }
			//   }));
			// }
		} catch (err) {
			setError('Failed to add document');
			console.error('Error adding document:', err);
		}
	};

	const handleAddChat = async (chatId: string) => {
		try {
			// TODO: Implement chat addition logic
			// const response = await projectService.addChat(projectId, chatId);
			// if (response.success) {
			//   const newChat: ProjectChat = {
			//     chatId,
			//     addedAt: new Date(),
			//     includeInRAG: true
			//   };
			//   setProject(prev => ({
			//     ...prev!,
			//     chats: [...prev!.chats, newChat]
			//   }));
			// }
		} catch (err) {
			setError('Failed to add chat');
			console.error('Error adding chat:', err);
		}
	};

	if (loading) {
		return <div>Loading project...</div>;
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	if (!project) {
		return <div>Project not found</div>;
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
				<Tabs defaultValue="knowledge">
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

					<TabsContent value="knowledge" className="mt-6">
						<KnowledgeBasePanel
							documents={project.knowledgeBase.documents}
							onAddDocument={handleAddDocument}
							settings={project.knowledgeBase.settings}
						/>
					</TabsContent>

					<TabsContent value="chats" className="mt-6">
						<ProjectChats
							chats={project.chats}
							onAddChat={handleAddChat}
						/>
					</TabsContent>
				</Tabs>
			</main>

			{showSettings && (
				<RAGSettingsModal
					settings={project.knowledgeBase.settings}
					onUpdateSettings={(settings) => {
						handleUpdateProject({
							knowledgeBase: {
								...project.knowledgeBase,
								settings
							}
						});
					}}
					onClose={() => setShowSettings(false)}
				/>
			)}
		</div>
	);
};

export default Project;