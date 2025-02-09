// src/components/Project/ProjectChats/ProjectChats.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	MessageSquarePlus,
	Search,
	Filter,
	MoreVertical,
	Link2,
	Copy,
	Trash2,
	AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
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
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { ProjectChat } from '@/utils/types/project.types';
import { ChatType } from '@/utils/types/chat.types';
interface ProjectChatsProps {
	chats: ProjectChat[];
	onAddChat: (chatId: string, includeInRAG?: boolean) => Promise<void>;
	onRemoveChat?: (chatId: string) => Promise<void>;
	onUpdateChat?: (chatId: string, updates: Partial<ProjectChat>) => Promise<void>;
	className?: string;
}

const ProjectChats: React.FC<ProjectChatsProps> = ({
	chats,
	onAddChat,
	onRemoveChat,
	onUpdateChat,
	className = ''
}) => {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState<ChatType | 'all'>('all');
	const [selectedChat, setSelectedChat] = useState<ProjectChat | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Filter chats based on search and type
	const filteredChats = chats.filter(chat => {
		const matchesSearch = chat.chat?.title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = filterType === 'all' || chat.chat?.type === filterType;
		return matchesSearch && matchesType;
	});

	const handleNewChat = async (type: ChatType) => {
		try {
			// Navigate to new chat page with project context
			navigate('/chat', {
				state: {
					selectedChatType: type,
					projectId: chat.projectId // You'll need to pass this from parent
				}
			});
		} catch (error) {
			console.error('Error creating new chat:', error);
		}
	};

	const handleDeleteChat = async () => {
		if (selectedChat && onRemoveChat) {
			try {
				await onRemoveChat(selectedChat.chatId);
				setShowDeleteDialog(false);
				setSelectedChat(null);
			} catch (error) {
				console.error('Error deleting chat:', error);
			}
		}
	};

	const getChatTypeLabel = (type: ChatType) => {
		switch (type) {
			case ChatType.BASE:
				return 'Base Chat';
			case ChatType.SEQUENTIAL:
				return 'Sequential Chat';
			case ChatType.REQUIREMENTS:
				return 'Requirements Chat';
			default:
				return 'Unknown';
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
						<DropdownMenuItem onClick={() => handleNewChat(ChatType.BASE)}>
							Base Chat
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleNewChat(ChatType.SEQUENTIAL)}>
							Sequential Chat
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleNewChat(ChatType.REQUIREMENTS)}>
							Requirements Chat
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Chats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredChats.map((projectChat) => (
					<Card key={projectChat.chatId} className="flex flex-col">
						<CardHeader>
							<div className="flex justify-between items-start">
								<div className="space-y-1">
									<CardTitle className="text-lg">
										{projectChat.chat?.title || 'Untitled Chat'}
									</CardTitle>
									<CardDescription>
										Added {format(new Date(projectChat.addedAt), 'MMM d, yyyy')}
									</CardDescription>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => navigate(`/chat/${projectChat.chatId}`)}>
											<Link2 className="h-4 w-4 mr-2" />
											Open Chat
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => {
											if (onUpdateChat) {
												onUpdateChat(projectChat.chatId, {
													includeInRAG: !projectChat.includeInRAG
												});
											}
										}}>
											<Copy className="h-4 w-4 mr-2" />
											{projectChat.includeInRAG ? 'Remove from RAG' : 'Add to RAG'}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-red-600"
											onClick={() => {
												setSelectedChat(projectChat);
												setShowDeleteDialog(true);
											}}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Remove from Project
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								<Badge>
									{getChatTypeLabel(projectChat.chat?.type || ChatType.BASE)}
								</Badge>
								{projectChat.includeInRAG && (
									<Badge variant="secondary">
										RAG Enabled
									</Badge>
								)}
							</div>
						</CardContent>
						<CardFooter className="text-sm text-gray-500 mt-auto">
							{projectChat.chat?.lastModified && (
								<>Last updated {format(new Date(projectChat.chat.lastModified), 'MMM d, yyyy')}</>
							)}
						</CardFooter>
					</Card>
				))}
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
							Are you sure you want to remove "{selectedChat?.chat?.title || 'this chat'}" from the project?
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