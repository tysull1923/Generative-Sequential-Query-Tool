// src/components/Project/ProjectChats/ProjectChats.types.ts

import { ProjectChat } from '@/utils/types/project.types';
import { ChatType } from '@/utils/types/chat.types';

export interface ProjectChatsProps {
	/**
	 * Array of project chats to display
	 */
	chats: ProjectChat[];

	/**
	 * Callback to add a new chat to the project
	 * @param chatId ID of the chat to add
	 * @param includeInRAG Whether to include chat in RAG system
	 */
	onAddChat: (chatId: string, includeInRAG?: boolean) => Promise<void>;

	/**
	 * Optional callback to remove a chat from the project
	 */
	onRemoveChat?: (chatId: string) => Promise<void>;

	/**
	 * Optional callback to update a project chat
	 */
	onUpdateChat?: (chatId: string, updates: Partial<ProjectChat>) => Promise<void>;

	/**
	 * Optional CSS class name
	 */
	className?: string;
}

export interface ChatCardProps {
	/**
	 * The project chat to display
	 */
	projectChat: ProjectChat;

	/**
	 * Callback when chat is removed from project
	 */
	onRemove?: () => Promise<void>;

	/**
	 * Callback when RAG status is toggled
	 */
	onToggleRAG?: (enabled: boolean) => Promise<void>;

	/**
	 * Optional CSS class name
	 */
	className?: string;
}

export interface ChatFilterState {
	/**
	 * Search query string
	 */
	query: string;

	/**
	 * Selected chat type filter
	 */
	type: ChatType | 'all';
}

export interface NewChatOptions {
	/**
	 * Type of chat to create
	 */
	type: ChatType;

	/**
	 * Whether to enable RAG for the new chat
	 */
	enableRAG?: boolean;

	/**
	 * Project ID to associate the chat with
	 */
	projectId: string;
}