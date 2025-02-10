// src/components/Project/ProjectChats/ProjectChats.tsx
// src/components/Project/ProjectChats/ProjectChats.tsx
import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/Alert-dialog';

import { ChatApiService } from '@/services/database/chatDatabaseApiService';
import { ProjectApiService } from '@/services/database/projectDatabaseApiService';
import ChatHistoryCard from '@/components/features/ChatHistory/HistoricalChatCard';
import { ChatType } from '@/utils/types/chat.types';

interface ProjectChatsProps {
	projectId: string;
	className?: string;
	onNewChat: (type: ChatType) => void;
}

const ProjectChats: React.FC<ProjectChatsProps> = ({
	projectId,
	className = '',
	onNewChat
}) => {
	const [chats, setChats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState<ChatType | 'all'>('all');
	const [selectedChat, setSelectedChat] = useState<any | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const chatService = ChatApiService.getInstance();
	const projectService = ProjectApiService.getInstance();

	useEffect(() => {
		fetchProjectChats();
	}, [projectId]);

	const fetchProjectChats = async () => {
		try {
			// Get the project to access its chat list
			const project = await projectService.getProject(projectId);

			// Ensure project has chats array
			const projectChats = project?.chats || [];
			const projectChatIds = new Set(projectChats.map(chat => chat.chatId));

			// Get all chats
			const allChats = await chatService.listChats();

			// Find chats that either:
			// 1. Have this project's ID in their projectInfo
			// 2. Are listed in the project's chats array
			const projectRelatedChats = allChats.filter(chat =>
				chat.projectInfo?.projectId === projectId ||
				projectChatIds.has(chat._id)
			);

			// Add RAG status from project's chat list
			const chatsWithRAGStatus = projectRelatedChats.map(chat => {
				const projectChat = projectChats.find(pc => pc.chatId === chat._id);
				return {
					...chat,
					projectInfo: {
						...chat.projectInfo,
						projectId,
						projectTitle: project.title,
						includeInRAG: projectChat?.includeInRAG ?? false
					}
				};
			});

			setChats(chatsWithRAGStatus);
		} catch (error) {
			console.error('Error fetching chats:', error);
			// Set empty array on error to prevent undefined errors
			setChats([]);
		} finally {
			setLoading(false);
		}
	};

	// Filter chats based on search and type
	const filteredChats = chats.filter(chat => {
		const matchesSearch = chat?.title?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false;
		const matchesType = filterType === 'all' || chat?.type === filterType;
		return matchesSearch && matchesType;
	});

	const handleDeleteChat = async () => {
		if (!selectedChat) return;

		try {
			// Remove chat from project
			await projectService.removeChat(projectId, selectedChat._id);

			// Update the chat to remove project association
			await chatService.updateChat(selectedChat._id, {
				projectInfo: null
			});

			setChats(prevChats => prevChats.filter(chat => chat._id !== selectedChat._id));
			setShowDeleteDialog(false);
			setSelectedChat(null);
		} catch (error) {
			console.error('Error removing chat from project:', error);
		}
	};

	const handleCopyChat = async (chatId: string) => {
		try {
			// Copy the chat
			const copiedChatId = await chatService.copyChat(chatId);

			// Add the new chat to the project
			await projectService.addChat(projectId, {
				chatId: copiedChatId,
				includeInRAG: false // Default to not included in RAG
			});

			// Refresh the chat list
			fetchProjectChats();
		} catch (error) {
			console.error('Error copying chat:', error);
		}
	};

	const handleToggleRAG = async (chatId: string, includeInRAG: boolean) => {
		try {
			await projectService.updateChat(projectId, chatId, { includeInRAG });

			// Update local state
			setChats(prevChats => prevChats.map(chat => {
				if (chat._id === chatId) {
					return {
						...chat,
						projectInfo: {
							...chat.projectInfo,
							includeInRAG
						}
					};
				}
				return chat;
			}));
		} catch (error) {
			console.error('Error updating RAG status:', error);
		}
	};

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header Actions */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex-1 flex items-center gap-2">
					<Input
						placeholder="Search chats..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="max-w-md"
						prefix={<Search className="h-4 w-4 text-gray-400" />}
					/>
					<Select
						value={filterType}
						onValueChange={(value) => setFilterType(value as ChatType | 'all')}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value={ChatType.BASE}>Base Chat</SelectItem>
							<SelectItem value={ChatType.SEQUENTIAL}>Sequential Chat</SelectItem>
							<SelectItem value={ChatType.REQUIREMENTS}>Requirements Chat</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="flex items-center gap-2">
							<MessageSquarePlus className="h-4 w-4" />
							New Chat
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onNewChat(ChatType.BASE)}>
							Base Chat
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onNewChat(ChatType.SEQUENTIAL)}>
							Sequential Chat
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onNewChat(ChatType.REQUIREMENTS)}>
							Requirements Chat
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Chats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredChats.map((chat) => (
					<ChatHistoryCard
						key={chat._id}
						chat={chat}
						onDelete={() => {
							setSelectedChat(chat);
							setShowDeleteDialog(true);
						}}
						onCopy={() => handleCopyChat(chat._id)}
						onToggleRAG={handleToggleRAG}
					/>
				))}
				{filteredChats.length === 0 && !loading && (
					<div className="col-span-full text-center py-8">
						<p className="text-gray-500">No chats found. Create a new chat to get started!</p>
					</div>
				)}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={() => {
					setShowDeleteDialog(false);
					setSelectedChat(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Chat from Project</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove "{selectedChat?.title || 'this chat'}" from the project?
							The chat will still be available in your chat history.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteChat}
							className="bg-red-600 hover:bg-red-700"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default ProjectChats;




















// // src/components/Project/ProjectChats/ProjectChats.tsx
// import React, { useState } from 'react';
// import { MessageSquarePlus, Search } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/Input';
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// } from '@/components/ui/Alert-dialog';

// import ChatHistoryCard from '@/components/features/ChatHistory/HistoricalChatCard';
// import { ProjectChat } from '@/utils/types/project.types';
// import { ChatType } from '@/utils/types/chat.types';

// interface ProjectChatsProps {
// 	chats: ProjectChat[];
// 	onAddChat: (chatId: string, includeInRAG?: boolean) => Promise<void>;
// 	onRemoveChat?: (chatId: string) => Promise<void>;
// 	onUpdateChat?: (chatId: string, updates: Partial<ProjectChat>) => Promise<void>;
// 	onNewChat: (type: ChatType) => void;
// 	projectId: string;
// 	className?: string;
// }

// const ProjectChats: React.FC<ProjectChatsProps> = ({
// 	chats,
// 	onAddChat,
// 	onRemoveChat,
// 	onUpdateChat,
// 	onNewChat,
// 	projectId,
// 	className = ''
// }) => {
// 	const [searchQuery, setSearchQuery] = useState('');
// 	const [filterType, setFilterType] = useState<ChatType | 'all'>('all');
// 	const [selectedChat, setSelectedChat] = useState<ProjectChat | null>(null);
// 	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

// 	// Filter chats based on search and type
// 	const filteredChats = chats.filter(chat => {
// 		const matchesSearch = chat.chat?.title.toLowerCase().includes(searchQuery.toLowerCase());
// 		const matchesType = filterType === 'all' || chat.chat?.type === filterType;
// 		return matchesSearch && matchesType;
// 	});

// 	const handleDeleteChat = async () => {
// 		if (selectedChat && onRemoveChat) {
// 			try {
// 				await onRemoveChat(selectedChat.chatId);
// 				setShowDeleteDialog(false);
// 				setSelectedChat(null);
// 			} catch (error) {
// 				console.error('Error deleting chat:', error);
// 			}
// 		}
// 	};

// 	const handleCopyChat = async (chatId: string) => {
// 		// Implement copy functionality if needed
// 		console.log('Copy chat:', chatId);
// 	};

// 	return (
// 		<div className={`space-y-6 ${className}`}>
// 			{/* Header Actions */}
// 			<div className="flex items-center justify-between gap-4">
// 				<div className="flex-1 flex items-center gap-2">
// 					<Input
// 						placeholder="Search chats..."
// 						value={searchQuery}
// 						onChange={(e) => setSearchQuery(e.target.value)}
// 						className="max-w-md"
// 						prefix={<Search className="h-4 w-4 text-gray-400" />}
// 					/>
// 					<Select
// 						value={filterType}
// 						onValueChange={(value) => setFilterType(value as ChatType | 'all')}
// 					>
// 						<SelectTrigger className="w-[180px]">
// 							<SelectValue placeholder="Filter by type" />
// 						</SelectTrigger>
// 						<SelectContent>
// 							<SelectItem value="all">All Types</SelectItem>
// 							<SelectItem value={ChatType.BASE}>Base Chat</SelectItem>
// 							<SelectItem value={ChatType.SEQUENTIAL}>Sequential Chat</SelectItem>
// 							<SelectItem value={ChatType.REQUIREMENTS}>Requirements Chat</SelectItem>
// 						</SelectContent>
// 					</Select>
// 				</div>
// 				<DropdownMenu>
// 					<DropdownMenuTrigger asChild>
// 						<Button className="flex items-center gap-2">
// 							<MessageSquarePlus className="h-4 w-4" />
// 							New Chat
// 						</Button>
// 					</DropdownMenuTrigger>
// 					<DropdownMenuContent align="end">
// 						<DropdownMenuItem onClick={() => onNewChat(ChatType.BASE)}>
// 							Base Chat
// 						</DropdownMenuItem>
// 						<DropdownMenuItem onClick={() => onNewChat(ChatType.SEQUENTIAL)}>
// 							Sequential Chat
// 						</DropdownMenuItem>
// 						<DropdownMenuItem onClick={() => onNewChat(ChatType.REQUIREMENTS)}>
// 							Requirements Chat
// 						</DropdownMenuItem>
// 					</DropdownMenuContent>
// 				</DropdownMenu>
// 			</div>

// 			{/* Chats Grid */}
// 			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 				{filteredChats.map((projectChat) => (
// 					projectChat.chat && (  // Only render if chat data exists
// 						<ChatHistoryCard
// 							key={projectChat.chatId}
// 							chat={{
// 								...projectChat.chat,
// 								_id: projectChat.chatId,
// 								projectInfo: {
// 									projectId: projectId,
// 									projectTitle: projectChat.chat.projectInfo?.projectTitle || ''
// 								}
// 							}}
// 							onDelete={() => {
// 								setSelectedChat(projectChat);
// 								setShowDeleteDialog(true);
// 							}}
// 							onCopy={handleCopyChat}
// 						/>
// 					)
// 				))}
// 				{filteredChats.length === 0 && (
// 					<div className="col-span-full text-center py-8">
// 						<p className="text-gray-500">No chats found. Create a new chat to get started!</p>
// 					</div>
// 				)}
// 			</div>

// 			{/* Delete Confirmation Dialog */}
// 			<AlertDialog
// 				open={showDeleteDialog}
// 				onOpenChange={() => {
// 					setShowDeleteDialog(false);
// 					setSelectedChat(null);
// 				}}
// 			>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Remove Chat from Project</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to remove "{selectedChat?.chat?.title || 'this chat'}" from the project?
// 							The chat will still be available in your chat history.
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction
// 							onClick={handleDeleteChat}
// 							className="bg-red-600 hover:bg-red-700"
// 						>
// 							Remove
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</div>
// 	);
// };

// export default ProjectChats;