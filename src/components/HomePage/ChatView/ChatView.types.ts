// src/pages/home/components/views/ChatView/ChatView.types.ts
import { ChatDocument } from '@/utils/types/chat.types';

export interface ChatViewProps {
	className?: string;
}

export interface ChatViewState {
	chats: ChatDocument[];
	loading: boolean;
	error: string;
	deleteChat?: ChatDocument;
}