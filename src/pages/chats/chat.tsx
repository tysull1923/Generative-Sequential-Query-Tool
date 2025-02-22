// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect } from 'react';
import { useAPI } from '@/context/APIContext';
import { useLangChainService } from '@/services/api/langchain/langChainApiService';
import { useRAG } from '@/services/api/hooks/useRAG';
import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
import RequirementsChat from '@/components/Chat/RequirementsChat/RequirementsChatMainPage';
import SystemContextModal from '@/components/features/SystemsContext/SystemContextModal';
import DocumentsModal from '@/components/features/DocumentModal/DocumentModal';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
import { ChatApiService } from '@/services/database/chatDatabaseApiService';
import { ProjectApiService } from '@/services/database/projectDatabaseApiService';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	ChatType,
	ChatSettings,
	ChatRequest,
	Role,
	ExecutionStatus,
	ChatCardState,
	SequentialStepType,
	ChatDocument
} from '@/utils/types/chat.types';
import { RAGSettings } from '@/utils/types/project.types';

const DEFAULT_SETTINGS: ChatSettings = {
	temperature: 0.7,
	chatType: ChatType.BASE,
	savingParams: {
		saveToApplication: true,
		saveToFile: false,
		summary: ''
	},
	ragSettings: {
		enabled: false,
		chunkSize: 512,
		chunkOverlap: 50,
		embedding: {
			model: 'nomic-embed-text',
			dimensions: 768
		},
		similarity: {
			threshold: 500,
			maxResults: 50
		}
	}
};

const ChatPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [chatIder, setChatId] = useState<string | null>(null);
	const [chat, setChat] = useState<ChatDocument | null>(null);
	const documentService = KnowledgeDocumentApiService.getInstance();
	const [title, setTitle] = useState("New Chat");
	const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
	const [requests, setRequests] = useState<ChatRequest[]>([]);
	const [systemContext, setSystemContext] = useState<string>('');
	const [isSystemContextModalOpen, setIsSystemContextModalOpen] = useState(false);
	const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
	const [activeDocuments, setActiveDocuments] = useState<KnowledgeDocument[]>([]);

	const { selectedAPI } = useAPI();
	const chatService = ChatApiService.getInstance();
	const projectService = ProjectApiService.getInstance();
	const rag = useRAG(chatIder, 'chat');

	// Initialize LangChain service
	const {
		processRequests,
		isProcessing,
		initializeHistory,
	} = useLangChainService(
		chatIder,
		systemContext,
		{ baseUrl: 'http://localhost:11434' }
	);

	// Initialize chat and load documents
	useEffect(() => {
		const initializeChat = async () => {
			setIsLoading(true);
			try {
				const state = location.state;
				if (state?.existingChat && state?.chatId) {
					// Load existing chat
					const chatData = await chatService.getChat(state.chatId);
					setTitle(chatData.title);
					setSettings(chatData.settings);
					setSystemContext(chatData.settings.systemContext || '');
					setRequests(chatData.messages || []);
					setChatId(state.chatId);
					initializeHistory(chatData.messages || [], chatData.settings.systemContext);
					console.log(chatData.settings.ragSettings);
					// Load RAG documents
					if (chatData.settings.ragSettings?.enabled) {
						console.log('Loading documents for RAG...');
						const docs = await rag.loadDocuments();
						setActiveDocuments(docs);
					}
				} else {
					// Initialize new chat
					const chatType = state?.selectedChatType || ChatType.BASE;
					const projectInfo = state?.projectContext;

					setSettings(prev => ({
						...prev,
						chatType,
						savingParams: {
							...prev.savingParams,
							summary: projectInfo ? `Chat created for project: ${projectInfo.projectTitle}` : ''
						}
					}));

					const newRequest: ChatRequest = {
						id: Date.now().toString(),
						role: Role.USER,
						type: chatType,
						step: SequentialStepType.MESSAGE,
						content: '',
						status: ChatCardState.READY,
						number: 1
					};

					setRequests([newRequest]);
				}
			} catch (err) {
				console.error('Error initializing chat:', err);
				setError('Failed to initialize chat');
			} finally {
				setIsLoading(false);
			}
		};

		initializeChat();
	}, [location.state]);
	useEffect(() => {
		const loadDocuments = async () => {
			if (!chatIder) return;

			try {
				setIsLoading(true);
				const docs = await documentService.getChatDocuments(chatIder);

				// Ensure RAG status is set correctly
				const docsWithRAGStatus = docs.map(doc => ({
					...doc,
					includeInRAG: doc.includeInRAG ?? false
				}));

				setActiveDocuments(docsWithRAGStatus);
			} catch (error) {
				console.error('Error loading documents:', error);
				setError('Failed to load documents');
			} finally {
				setIsLoading(false);
			}
		};

		loadDocuments();
	}, [chatIder]);
	// Handle document management
	// const handleAddDocument = async (document: KnowledgeDocument) => {
	// 	try {
	// 		setError(null);

	// 		// Create document in MongoDB
	// 		console.log('Creating document:', document);
	// 		const createdDoc = await documentService.createChatDocument(chatIder, {
	// 			title: document.title,
	// 			content: document.content,
	// 			projectId: location.state?.projectContext?.projectId,
	// 			source: document.source,
	// 			metadata: document.metadata
	// 		});
	// 		console.log(settings.ragSettings?.enabled, chatIder);
	// 		// Add to RAG if enabled
	// 		if (settings.ragSettings?.enabled && chatIder) {
	// 			console.log('Adding document to RAG:', createdDoc);
	// 			await rag.addDocument(createdDoc, settings.ragSettings);
	// 		}

	// 		setActiveDocuments(prev => [...prev, createdDoc]);
	// 		return createdDoc;
	// 	} catch (err) {
	// 		console.error('Error adding document:', err);
	// 		setError('Failed to add document');
	// 		throw err;
	// 	}
	// };

	// In chat.tsx, modify the handleAddDocument function:

	// const handleAddDocument = async (document: KnowledgeDocument) => {
	// 	try {
	// 		setError(null);

	// 		// Enable RAG settings if not already enabled
	// 		if (!settings.ragSettings?.enabled) {
	// 			const updatedSettings = {
	// 				...settings,
	// 				ragSettings: {
	// 					...settings.ragSettings,
	// 					enabled: true,
	// 					chunkSize: 512,  // default chunk size
	// 					chunkOverlap: 50,  // default overlap
	// 					embedding: {
	// 						model: 'nomic-embed-text',
	// 						dimensions: 768
	// 					},
	// 					similarity: {
	// 						threshold: 500,
	// 						maxResults: 50
	// 					}
	// 				}
	// 			};
	// 			setSettings(updatedSettings);

	// 			// If we have a chatId, update the settings in the database
	// 			if (chatIder) {
	// 				await chatService.updateChat(chatIder, {
	// 					settings: updatedSettings
	// 				});
	// 			}
	// 		}

	// 		// Create document in MongoDB
	// 		console.log('Creating document:', document);
	// 		const createdDoc = await documentService.createChatDocument(chatIder, {
	// 			title: document.title,
	// 			content: document.content,
	// 			projectId: location.state?.projectContext?.projectId,
	// 			source: document.source,
	// 			metadata: document.metadata
	// 		});

	// 		// Add to RAG
	// 		console.log('Adding document to RAG:', createdDoc);
	// 		await rag.addDocument(createdDoc, settings.ragSettings);

	// 		setActiveDocuments(prev => [...prev, createdDoc]);
	// 		return createdDoc;
	// 	} catch (err) {
	// 		console.error('Error adding document:', err);
	// 		setError('Failed to add document');
	// 		throw err;
	// 	}
	// };
	const handleAddDocument = async (document: KnowledgeDocument) => {
		try {
			setError(null);

			// Enable RAG settings if not already enabled
			if (!settings.ragSettings?.enabled) {
				const updatedSettings = {
					...settings,
					ragSettings: {
						...settings.ragSettings,
						enabled: true,
						chunkSize: 512,
						chunkOverlap: 50,
						embedding: {
							model: 'nomic-embed-text',
							dimensions: 768
						},
						similarity: {
							threshold: 500,
							maxResults: 50
						}
					}
				};
				setSettings(updatedSettings);

				if (chatIder) {
					await chatService.updateChat(chatIder, {
						settings: updatedSettings
					});
				}
			}

			console.log('Creating document:', document);
			const createdDoc = await documentService.createChatDocument(chatIder, {
				title: document.title,
				content: document.content,
				projectId: location.state?.projectContext?.projectId,
				source: document.source,
				metadata: document.metadata
			});

			// Add to RAG and update document with chunks
			console.log('Adding document to RAG:', createdDoc);
			await rag.addDocument(createdDoc, settings.ragSettings);

			// Fetch the updated document to get chunks and RAG status
			const updatedDoc = await documentService.getDocument(createdDoc._id);
			setActiveDocuments(prev => [...prev, updatedDoc]);

			return updatedDoc;
		} catch (err) {
			console.error('Error adding document:', err);
			setError('Failed to add document');
			throw err;
		}
	};

	// Process requests with RAG
	const handleProcessRequests = async (requestP?: string | ChatRequest[]) => {
		setError(null);
		try {
			//setIsProcessing(true);
			setExecutionStatus(ExecutionStatus.RUNNING);

			const requestsToProcess = typeof requestP === "string"
				? [requests.find(r => r.id === requestP)!]
				: Array.isArray(requestP)
					? requestP
					: requests;

			const processedRequests = await processRequests(
				requestsToProcess,
				selectedAPI,
				0,
				systemContext,
				settings.ragSettings?.enabled
			);

			setRequests(prev => {
				return prev.map(req => {
					const processed = processedRequests.find(p => p.id === req.id);
					return processed || req;
				});
			});

			setExecutionStatus(ExecutionStatus.COMPLETED);
		} catch (error) {
			console.error('Request failed:', error);
			setError(error.message || 'Failed to process request');
			setExecutionStatus(ExecutionStatus.ERROR);
		} finally {
			//setIsProcessing(false);
		}
	};

	// Handle settings changes
	const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
		setSettings(prev => {
			const updated = { ...prev, ...newSettings };
			if (newSettings.ragSettings?.enabled !== undefined) {
				// Handle RAG toggle
				if (newSettings.ragSettings.enabled) {
					rag.loadDocuments().then(docs => setActiveDocuments(docs));
				}
			}
			return updated;
		});
	};

	// Save chat
	const handleSave = async () => {
		if (!settings.savingParams?.saveToApplication) return;

		try {
			setIsSaving(true);

			const formattedRequests = requests.map(req => ({
				id: req.id,
				role: req.role,
				type: req.type,
				content: req.content || '',
				status: req.status,
				response: req.response ? {
					provider: req.response.provider || Role.ASSISTANT,
					content: req.response.content || '',
					metadata: req.response.metadata
				} : undefined,
				number: req.number
			}));

			const chatData = {
				title: title || 'Untitled Chat',
				type: settings.chatType,
				settings: {
					...settings,
					systemContext: systemContext || ''
				},
				messages: formattedRequests,
				executionStatus: executionStatus,
				lastModified: new Date(),
				createdAt: location.state?.chatId ? undefined : new Date(),
				projectInfo: location.state?.projectContext,
				knowledgeBase: {
					documents: activeDocuments.map(doc => doc._id),
					settings: settings.ragSettings
				}
			};

			if (location.state?.chatId) {
				await chatService.updateChat(location.state.chatId, chatData);
				setChatId(location.state.chatId);
			} else {
				const chatId = await chatService.createChat(chatData);
				setChatId(chatId);

				// Handle project association
				if (location.state?.projectContext?.projectId) {
					await projectService.addChat(location.state.projectContext.projectId, {
						chatId,
						includeInRAG: true
					});
				}

				navigate(location.pathname, {
					state: {
						chatId,
						existingChat: true,
						projectContext: location.state?.projectContext
					},
					replace: true
				});
			}
		} catch (error) {
			console.error('Error saving chat:', error);
			setError('Failed to save chat');
		} finally {
			setIsSaving(false);
		}
	};
	const handleUpdateChatRAG = async (enabled: boolean) => {
		try {
			// Update the chat settings with the new RAG state
			const updatedSettings = {
				...settings,
				ragSettings: {
					...settings.ragSettings,
					enabled
				}
			};

			// Update the settings state
			setSettings(updatedSettings);

			// If you need to persist this to the database
			if (chatIder) {
				await chatService.updateChat(chatIder, {
					settings: updatedSettings
				});
			}
		} catch (error) {
			console.error('Error updating RAG settings:', error);
			throw error;
		}
	};
	const handleToggleRAG = async (documentId: string, include: boolean) => {
		// Find the document in our current state
		const documentIndex = documents.findIndex(doc => doc._id === documentId);
		if (documentIndex === -1) {
			console.error('Document not found:', documentId);
			return;
		}

		// Create a copy of the current documents array
		const updatedDocuments = [...documents];

		try {
			// Optimistically update the UI
			updatedDocuments[documentIndex] = {
				...updatedDocuments[documentIndex],
				includeInRAG: include
			};
			setActiveDocuments(updatedDocuments);

			// Update the document in the database
			await documentService.updateDocument(documentId, {
				includeInRAG: include
			});

			if (include) {
				// Add document to RAG system
				await rag.addDocument(updatedDocuments[documentIndex], settings.ragSettings);
			} else {
				// Remove document from RAG system
				await rag.removeDocument(documentId);
			}

			// Optionally, refresh the documents list to ensure we have the latest state
			const refreshedDocs = await documentService.getChatDocuments(chatIder);
			setActiveDocuments(refreshedDocs);

		} catch (error) {
			console.error('Error toggling RAG status:', error);

			// Revert the optimistic update on error
			const originalDocuments = [...documents];
			setActiveDocuments(originalDocuments);

			// Show error to user
			setError('Failed to update document RAG status');

			// Rethrow the error to be handled by the calling component if needed
			throw error;
		}
	};


	// Auto-save on request changes
	useEffect(() => {
		if (requests.length > 0 && settings.savingParams?.saveToApplication) {
			handleSave();
		}
	}, [requests]);

	const renderChatComponent = () => {
		const commonProps = {
			requests,
			setRequests,
			systemContext,
			setSystemContext,
			onAddDocument: handleAddDocument,
			onProcessRequests: handleProcessRequests,
			isProcessing,
			onSave: handleSave,
			title,
			executionStatus,
			error
		};

		switch (settings.chatType) {
			case ChatType.SEQUENTIAL:
				return <SequentialChat {...commonProps} />;
			case ChatType.REQUIREMENTS:
				return <RequirementsChat {...commonProps} />;
			case ChatType.BASE:
			default:
				return <BaseChat {...commonProps} />;
		}
	};

	if (isLoading) {
		return <div className="flex items-center justify-center h-screen">Loading chat...</div>;
	}

	return (
		<>
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
					<strong className="font-bold">Error: </strong>
					<span className="block sm:inline">{error}</span>
				</div>
			)}

			{isSaving && (
				<div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded">
					Saving...
				</div>
			)}

			<SystemContextModal
				isOpen={isSystemContextModalOpen}
				onClose={() => setIsSystemContextModalOpen(false)}
				content={systemContext}
				onSave={(content) => {
					setSystemContext(content);
					setIsSystemContextModalOpen(false);
				}}
				onDelete={() => {
					setSystemContext('');
					setIsSystemContextModalOpen(false);
				}}
			/>

			<DocumentsModal
				isOpen={isDocumentsModalOpen}
				onClose={() => setIsDocumentsModalOpen(false)}
				chatId={chatIder}
				documents={activeDocuments}
				ragEnabled={settings.ragSettings?.enabled ?? false}
				onToggleRAG={handleToggleRAG}
				onUpdateChatRAG={handleUpdateChatRAG}
			/>

			<ChatBanner
				chatType={settings.chatType}
				title={title}
				settings={settings}
				onSettingsChange={handleSettingsChange}
				onDocumentsClick={() => setIsDocumentsModalOpen(true)}
				onTitleChange={setTitle}
				onSystemContextClick={() => setIsSystemContextModalOpen(true)}
				hasSystemContext={!!systemContext}
				chatId={chatIder}
				documentCount={activeDocuments.length}

			/>

			<main className="flex-1 flex overflow-hidden">
				{renderChatComponent()}
			</main>
		</>
	);
};

export default ChatPage;



// ragEnabled={settings.ragSettings?.enabled ?? false}
// 				onToggleRAG={async (documentId: string, include: boolean) => {
// 					try {
// 						await rag.toggleDocument(documentId, include);
// 						setActiveDocuments(prev =>
// 							prev.map(doc =>
// 								doc._id === documentId
// 									? { ...doc, includeInRAG: include }
// 									: doc
// 							)
// 						);
// 					} catch (error) {
// 						console.error('Error toggling RAG:', error);
// 						setError('Failed to toggle document RAG status');
// 					}
// 				}}