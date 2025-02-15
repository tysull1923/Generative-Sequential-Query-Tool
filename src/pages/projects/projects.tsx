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
	RAGSettings,
	ProjectChat
} from '@/utils/types/project.types';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
import {
	ChatType,
	Role,
	SequentialStepType,
	ChatCardState
} from '@/utils/types/chat.types';

import ProjectHeader from '@/components/Banner/ProjectBanner/ProjectHeader';
import KnowledgeBasePanel from '@/components/Project/knowledgebasepanel/KnowledgeBasePanel';
import ProjectChats from '@/components/Project/projectchats/ProjectChats';
import RAGSettingsModal from '@/components/Project/RagSettings/RagSettingsModal';
import { ProjectApiService } from '@/services/database/projectDatabaseApiService';
import { ChatApiService } from '@/services/database/chatDatabaseApiService';
import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';

const ProjectPage: React.FC = () => {
	const { projectId } = useParams();
	const navigate = useNavigate();
	const [project, setProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	const projectService = ProjectApiService.getInstance();
	const chatService = ChatApiService.getInstance();
	const documentService = KnowledgeDocumentApiService.getInstance();

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

			// Check if projectData has chats before mapping
			if (projectData && projectData.chats) {
				// Fetch full chat details for each chat in the project
				const updatedChats = await Promise.all(
					projectData.chats.map(async (projectChat) => {
						try {
							const chatDetails = await chatService.getChat(projectChat.chatId);
							return {
								...projectChat,
								chat: chatDetails
							};
						} catch (err) {
							console.error(`Error fetching chat ${projectChat.chatId}:`, err);
							return projectChat;
						}
					})
				);

				setProject({
					...projectData,
					chats: updatedChats
				});
			} else {
				// If no chats exist, set project with empty chats array
				setProject({
					...projectData,
					chats: []
				});
			}
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
			console.log("Uploading Document");
			// Create the document first
			const createdDoc = await documentService.createDocument(projectId, {
				title: document.title,
				content: document.content,
				source: document.source,
				metadata: document.metadata
			});

			// Update local state with the new document
			setProject(prev => {
				if (!prev) return null;
				return {
					...prev,
					knowledgeBase: {
						...prev.knowledgeBase,
						documents: [...prev.knowledgeBase.documents, createdDoc]
					}
				};
			});

			return createdDoc;
		} catch (err) {
			console.error('Error adding document:', err);
			setError('Failed to add document');
			throw err; // Re-throw to handle in the calling component
		}
	}
	const handleRemoveDocument = async (documentId: string) => {
		if (!projectId || !project) return;

		try {
			setError(null);

			// First, remove the document reference from the project
			await projectService.removeDocument(projectId, documentId);

			// Then delete the actual document
			await documentService.deleteDocument(documentId);

			// Update local state
			setProject(prev => {
				if (!prev) return null;
				return {
					...prev,
					knowledgeBase: {
						...prev.knowledgeBase,
						documents: prev.knowledgeBase.documents.filter(doc => doc.id !== documentId)
					}
				};
			});
		} catch (err) {
			setError('Failed to remove document');
			console.error('Error removing document:', err);
		}
	};

	const handleReindexDocument = async (documentId: string) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			await documentService.reindexDocument(projectId, documentId);
			await fetchProject(); // Refresh project to get updated embeddings
		} catch (err) {
			setError('Failed to reindex document');
			console.error('Error reindexing document:', err);
		}
	};

	const handleAddChat = async (chatId: string, includeInRAG: boolean = true) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			// Add chat to project using the project service
			const updatedProject = await projectService.addChat(projectId, {
				chatId,
				includeInRAG,
				addedAt: new Date()
			});

			// Fetch the chat details to ensure we have the latest data
			const chatDetails = await chatService.getChat(chatId);

			// Update local project state with the full chat details
			setProject(prev => {
				if (!prev) return null;
				const updatedChats = prev.chats.map(chat =>
					chat.chatId === chatId
						? { ...chat, chat: chatDetails }
						: chat
				);
				return {
					...prev,
					chats: updatedChats
				};
			});
		} catch (err) {
			setError('Failed to add chat to project');
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

	const handleNewChat = async (type: ChatType) => {
		if (!project) return;

		const initialRequest = {
			id: Date.now().toString(),
			role: Role.USER,
			type: type,
			step: SequentialStepType.MESSAGE,
			content: '',
			status: ChatCardState.READY,
			number: 1
		};

		// Navigate to chat page with project context
		navigate('/chat', {
			state: {
				existingChat: false,
				selectedChatType: type,
				initialTitle: 'New Chat',
				initialRequests: [initialRequest],
				settings: {
					temperature: 0.7,
					chatType: type,
					savingParams: {
						saveToApplication: true,
						saveToFile: false,
						summary: ''
					}
				},
				projectContext: {
					projectId: project._id,
					projectTitle: project.title
				}
			}
		});
	};

	const handleUpdateRAGSettings = async (settings: RAGSettings) => {
		if (!projectId || !project) return;

		try {
			setError(null);
			const updatedProject = await projectService.updateRAGSettings(projectId, settings);
			setProject(updatedProject);
			setShowSettings(false);
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
							projectId={project._id}
							documents={project.knowledgeBase.documents}
							onAddDocument={handleAddDocument}
							onRemoveDocument={handleRemoveDocument}
							onReindexDocument={handleReindexDocument}
							settings={project.knowledgeBase.settings}
						/>
					</TabsContent>

					<TabsContent value="chats">
						<ProjectChats
							chats={project.chats}
							onAddChat={handleAddChat}
							onRemoveChat={handleRemoveChat}
							onNewChat={handleNewChat}
							projectId={project._id}
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






















// src/pages/project/Project.tsx
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Book, MessageSquare, Loader2 } from 'lucide-react';

// import {
// 	Project,
// 	ProjectStatus,
// 	KnowledgeDocument,
// 	RAGSettings,
// 	ProjectChat
// } from '@/utils/types/project.types';
// import { ChatType } from '@/utils/types/chat.types';

// import ProjectHeader from '@/components/Banner/ProjectBanner/ProjectHeader';
// import KnowledgeBasePanel from '@/components/Project/knowledgebasepanel/KnowledgeBasePanel';
// import ProjectChats from '@/components/Project/projectchats/ProjectChats';
// import RAGSettingsModal from '@/components/Project/RagSettings/RagSettingsModal';
// import { ProjectApiService } from '@/services/database/projectDatabaseApiService';

// const ProjectPage: React.FC = () => {
// 	const { projectId } = useParams();
// 	const navigate = useNavigate();
// 	const [project, setProject] = useState<Project | null>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [error, setError] = useState<string | null>(null);
// 	const [showSettings, setShowSettings] = useState(false);

// 	const projectService = ProjectApiService.getInstance();

// 	useEffect(() => {
// 		if (projectId) {
// 			fetchProject();
// 		}
// 	}, [projectId]);

// 	const fetchProject = async () => {
// 		try {
// 			setLoading(true);
// 			setError(null);
// 			const projectData = await projectService.getProject(projectId);
// 			setProject(projectData);
// 		} catch (err) {
// 			setError('Failed to load project');
// 			console.error('Error fetching project:', err);
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const handleUpdateProject = async (updates: Partial<Project>) => {
// 		if (!projectId || !project) return;

// 		try {
// 			setError(null);
// 			const updatedProject = await projectService.updateProject(projectId, updates);
// 			setProject(updatedProject);
// 		} catch (err) {
// 			setError('Failed to update project');
// 			console.error('Error updating project:', err);
// 		}
// 	};

// 	const handleAddDocument = async (document: KnowledgeDocument) => {
// 		if (!projectId || !project) return;

// 		try {
// 			setError(null);
// 			const updatedProject = await projectService.addDocument(projectId, document);
// 			setProject(updatedProject);
// 		} catch (err) {
// 			setError('Failed to add document');
// 			console.error('Error adding document:', err);
// 		}
// 	};

// 	const handleRemoveDocument = async (documentId: string) => {
// 		if (!projectId || !project) return;

// 		try {
// 			setError(null);
// 			await projectService.removeDocument(projectId, documentId);
// 			setProject(prev => {
// 				if (!prev) return null;
// 				return {
// 					...prev,
// 					knowledgeBase: {
// 						...prev.knowledgeBase,
// 						documents: prev.knowledgeBase.documents.filter(doc => doc._id !== documentId)
// 					}
// 				};
// 			});
// 		} catch (err) {
// 			setError('Failed to remove document');
// 			console.error('Error removing document:', err);
// 		}
// 	};

// 	const handleAddChat = async (chatId: string, includeInRAG: boolean = true) => {
// 		if (!projectId || !project) return;

// 		try {
// 			setError(null);
// 			const updatedProject = await projectService.addChat(projectId, { chatId, includeInRAG });
// 			setProject(updatedProject);
// 		} catch (err) {
// 			setError('Failed to add chat');
// 			console.error('Error adding chat:', err);
// 		}
// 	};

// 	const handleRemoveChat = async (chatId: string) => {
// 		if (!projectId || !project) return;

// 		try {
// 			setError(null);
// 			await projectService.removeChat(projectId, chatId);
// 			setProject(prev => {
// 				if (!prev) return null;
// 				return {
// 					...prev,
// 					chats: prev.chats.filter(chat => chat.chatId !== chatId)
// 				};
// 			});
// 		} catch (err) {
// 			setError('Failed to remove chat');
// 			console.error('Error removing chat:', err);
// 		}
// 	};

// 	const handleNewChat = async (type: ChatType) => {
// 		if (!project) return;

// 		// Navigate to chat page with project context and chat type
// 		navigate('/chat', {
// 			state: {
// 				selectedChatType: type,
// 				projectContext: {
// 					projectId: project._id,
// 					projectTitle: project.title
// 				}
// 			}
// 		});
// 	};

// 	const handleUpdateRAGSettings = async (settings: RAGSettings) => {
// 		if (!projectId || !project) return;

// 		try {
// 			setError(null);
// 			const updatedProject = await projectService.updateRAGSettings(projectId, settings);
// 			setProject(updatedProject);
// 		} catch (err) {
// 			setError('Failed to update RAG settings');
// 			console.error('Error updating RAG settings:', err);
// 		}
// 	};

// 	if (loading) {
// 		return (
// 			<div className="flex items-center justify-center min-h-screen">
// 				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
// 			</div>
// 		);
// 	}

// 	if (error) {
// 		return (
// 			<div className="container mx-auto px-4 py-8">
// 				<Alert variant="destructive">
// 					<AlertDescription>{error}</AlertDescription>
// 				</Alert>
// 			</div>
// 		);
// 	}

// 	if (!project) {
// 		return (
// 			<div className="container mx-auto px-4 py-8">
// 				<Alert>
// 					<AlertDescription>Project not found</AlertDescription>
// 				</Alert>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="min-h-screen bg-gray-50">
// 			<ProjectHeader
// 				title={project.title}
// 				status={project.status}
// 				onUpdateProject={handleUpdateProject}
// 				onOpenSettings={() => setShowSettings(true)}
// 			/>

// 			<main className="container mx-auto px-4 py-6">
// 				<Tabs defaultValue="knowledge" className="space-y-6">
// 					<TabsList>
// 						<TabsTrigger value="knowledge" className="flex items-center gap-2">
// 							<Book className="h-4 w-4" />
// 							Knowledge Base
// 						</TabsTrigger>
// 						<TabsTrigger value="chats" className="flex items-center gap-2">
// 							<MessageSquare className="h-4 w-4" />
// 							Project Chats
// 						</TabsTrigger>
// 					</TabsList>

// 					<TabsContent value="knowledge">
// 						<KnowledgeBasePanel
// 							documents={project.knowledgeBase.documents}
// 							onAddDocument={handleAddDocument}
// 							onRemoveDocument={handleRemoveDocument}
// 							settings={project.knowledgeBase.settings}
// 						/>
// 					</TabsContent>

// 					<TabsContent value="chats">
// 						<ProjectChats
// 							chats={project.chats}
// 							onAddChat={handleAddChat}
// 							onRemoveChat={handleRemoveChat}
// 							onNewChat={handleNewChat}
// 							projectId={project._id}
// 						/>
// 					</TabsContent>
// 				</Tabs>
// 			</main>

// 			{showSettings && (
// 				<RAGSettingsModal
// 					isOpen={showSettings}
// 					onClose={() => setShowSettings(false)}
// 					settings={project.knowledgeBase.settings}
// 					onUpdateSettings={handleUpdateRAGSettings}
// 				/>
// 			)}
// 		</div>
// 	);
// };

// export default ProjectPage;