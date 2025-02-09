// src/pages/home/components/views/ChatView/ChatView.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { ChatApiService } from '@/services/database/chatDatabaseApiService';
import ChatHistoryCard from '@/components/features/ChatHistory/HistoricalChatCard';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/Alert-dialog";
import { ChatViewProps, ChatViewState } from './ChatView.types';
import { cn } from '@/lib/utils';

export const ChatView: React.FC<ChatViewProps> = ({ className }) => {
	const navigate = useNavigate();
	const [state, setState] = useState<ChatViewState>({
		chats: [],
		loading: true,
		error: '',
	});

	const chatService = ChatApiService.getInstance();

	// Fetch chats on component mount
	useEffect(() => {
		fetchChats();
	}, []);

	const fetchChats = async () => {
		try {
			setState(prev => ({ ...prev, loading: true, error: '' }));
			const chatData = await chatService.listChats();
			setState(prev => ({ ...prev, chats: chatData, loading: false }));
		} catch (err) {
			setState(prev => ({
				...prev,
				loading: false,
				error: 'Failed to load chats. Please try again.'
			}));
			console.error('Error fetching chats:', err);
		}
	};

	const handleDeleteChat = async (chatId: string) => {
		try {
			setState(prev => ({ ...prev, error: '' }));
			await chatService.deleteChat(chatId);

			setState(prev => ({
				...prev,
				chats: prev.chats.filter(chat => chat._id !== chatId),
				deleteChat: undefined
			}));
		} catch (err) {
			console.error('Error deleting chat:', err);
			setState(prev => ({
				...prev,
				error: err instanceof Error ? err.message : 'Failed to delete chat. Please try again.'
			}));
		}
	};

	const handleCopyChat = async (chatId: string) => {
		try {
			await chatService.copyChat(chatId);
			await fetchChats();
		} catch (err) {
			console.error('Error copying chat:', err);
			setState(prev => ({
				...prev,
				error: 'Failed to copy chat. Please try again.'
			}));
		}
	};

	if (state.loading) {
		return (
			<div className={cn("flex items-center justify-center h-64", className)}>
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	return (
		<div className={cn("space-y-6", className)}>
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Your Chats</h1>
				<Button onClick={() => navigate('/chat')} className="flex items-center" size="lg">
					<MessageSquarePlus className="mr-2 h-4 w-4" />
					New Chat
				</Button>
			</div>

			{state.error && (
				<Alert variant="destructive">
					<AlertDescription>{state.error}</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{state.chats.map((chat) => (
					<ChatHistoryCard
						key={chat._id}
						chat={chat}
						onDelete={(chatId) => setState(prev => ({ ...prev, deleteChat: chat }))}
						onCopy={handleCopyChat}
					/>
				))}
			</div>

			<AlertDialog
				open={!!state.deleteChat}
				onOpenChange={() => setState(prev => ({ ...prev, deleteChat: undefined }))}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Chat</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this chat? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => state.deleteChat && handleDeleteChat(state.deleteChat._id)}
							className="bg-red-500 hover:bg-red-600"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};