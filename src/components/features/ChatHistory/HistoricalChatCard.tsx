// // src/components/chat/ChatCard/ChatCard.tsx

// src/components/chat/ChatCard/ChatCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ChatHistoryCardProps {
	chat: {
		_id: string;
		title: string;
		settings?: {
			chatType?: string;
			selectedApi?: string;
			savingParams?: {
				summary?: string;
			};
		};
		createdAt: string;
		projectInfo?: {
			projectId: string;
			projectTitle: string;
			includeInRAG?: boolean;
		};
	};
	onDelete: (chatId: string) => void;
	onCopy: (chatId: string) => void;
	onToggleRAG?: (chatId: string, includeInRAG: boolean) => void;
}

const ChatHistoryCard: React.FC<ChatHistoryCardProps> = ({
	chat,
	onDelete,
	onCopy,
	onToggleRAG
}) => {
	const navigate = useNavigate();

	const handleCardClick = () => {
		navigate(`/chat/${chat._id}`, {
			state: {
				existingChat: true,
				chatId: chat._id,
				projectInfo: chat.projectInfo
			}
		});
	};

	const handleAction = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation();
		action();
	};

	return (
		<Card className="hover:shadow-lg transition-shadow cursor-pointer">
			<div onClick={handleCardClick}>
				<CardHeader>
					<CardTitle className="text-lg">{chat.title || 'Untitled Chat'}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<p className="text-sm text-gray-600">
							{chat.settings?.savingParams?.summary || 'No summary available'}
						</p>
						<div className="flex gap-2 flex-wrap">
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
								{chat.settings?.chatType || 'Base Chat'}
							</span>
							{chat.settings?.selectedApi && (
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									{chat.settings.selectedApi}
								</span>
							)}
							{chat.projectInfo && (
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
									{chat.projectInfo.projectTitle}
								</span>
							)}
							{chat.projectInfo?.includeInRAG && (
								<Badge variant="secondary" className="bg-blue-100 text-blue-800">
									RAG Enabled
								</Badge>
							)}
						</div>
					</div>
				</CardContent>
			</div>
			<CardFooter className="flex justify-between items-center">
				<span className="text-sm text-gray-500">
					{new Date(chat.createdAt).toLocaleDateString()}
				</span>
				<div className="flex gap-2">
					{onToggleRAG && chat.projectInfo && (
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => handleAction(e, () =>
								onToggleRAG(chat._id, !chat.projectInfo?.includeInRAG)
							)}
							title={chat.projectInfo?.includeInRAG ? "Remove from RAG" : "Add to RAG"}
						>
							<Database
								className={`h-4 w-4 ${chat.projectInfo?.includeInRAG
										? 'text-blue-500 hover:text-blue-700'
										: 'text-gray-500 hover:text-gray-700'
									}`}
							/>
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => handleAction(e, () => onCopy(chat._id))}
						title="Copy chat"
					>
						<Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => handleAction(e, () => onDelete(chat._id))}
						title="Delete chat"
					>
						<Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};

export default ChatHistoryCard;
















// // src/components/chat/ChatCard/ChatCard.tsx
// import React from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Trash2, Copy } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// interface ChatHistoryCardProps {
// 	chat: {
// 		_id: string;
// 		title: string;
// 		settings?: {
// 			chatType?: string;
// 			selectedApi?: string;
// 			savingParams?: {
// 				summary?: string;
// 			};
// 		};
// 		createdAt: string;
// 		projectInfo?: {
// 			projectId: string;
// 			projectTitle: string;
// 		};
// 	};
// 	onDelete: (chatId: string) => void;
// 	onCopy: (chatId: string) => void;
// }

// const ChatHistoryCard: React.FC<ChatHistoryCardProps> = ({ chat, onDelete, onCopy }) => {
// 	const navigate = useNavigate();

// 	const handleCardClick = () => {
// 		// Navigate with chatId in state AND include it in the URL
// 		navigate(`/chat/${chat._id}`, {
// 			state: {
// 				existingChat: true,
// 				chatId: chat._id,
// 				projectInfo: chat.projectInfo // Pass project info if it exists
// 			}
// 		});
// 	};

// 	const handleAction = (e: React.MouseEvent, action: () => void) => {
// 		e.stopPropagation();
// 		action();
// 	};

// 	return (
// 		<Card className="hover:shadow-lg transition-shadow cursor-pointer">
// 			<div onClick={handleCardClick}>
// 				<CardHeader>
// 					<CardTitle className="text-lg">{chat.title || 'Untitled Chat'}</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					<div className="space-y-2">
// 						<p className="text-sm text-gray-600">
// 							{chat.settings?.savingParams?.summary || 'No summary available'}
// 						</p>
// 						<div className="flex gap-2">
// 							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
// 								{chat.settings?.chatType || 'Base Chat'}
// 							</span>
// 							{chat.settings?.selectedApi && (
// 								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
// 									{chat.settings.selectedApi}
// 								</span>
// 							)}
// 							{chat.projectInfo && (
// 								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
// 									{chat.projectInfo.projectTitle}
// 								</span>
// 							)}
// 						</div>
// 					</div>
// 				</CardContent>
// 			</div>
// 			<CardFooter className="flex justify-between items-center">
// 				<span className="text-sm text-gray-500">
// 					{new Date(chat.createdAt).toLocaleDateString()}
// 				</span>
// 				<div className="flex gap-2">
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={(e) => handleAction(e, () => onCopy(chat._id))}
// 						title="Copy chat"
// 					>
// 						<Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
// 					</Button>
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={(e) => handleAction(e, () => onDelete(chat._id))}
// 						title="Delete chat"
// 					>
// 						<Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
// 					</Button>
// 				</div>
// 			</CardFooter>
// 		</Card>
// 	);
// };

// export default ChatHistoryCard;

// import React from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Trash2, Copy } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// interface ChatHistoryCardProps {
// 	chat: {
// 		_id: string;
// 		title: string;
// 		settings?: {
// 			chatType?: string;
// 			selectedApi?: string;
// 			savingParams?: {
// 				summary?: string;
// 			};
// 		};
// 		createdAt: string;
// 	};
// 	onDelete: (chatId: string) => void;
// 	onCopy: (chatId: string) => void;
// }

// const ChatHistoryCard: React.FC<ChatHistoryCardProps> = ({ chat, onDelete, onCopy }) => {
// 	const navigate = useNavigate();

// 	const handleCardClick = () => {
// 		navigate('/chat', { state: { chatId: chat._id } });
// 	};

// 	const handleAction = (e: React.MouseEvent, action: () => void) => {
// 		e.stopPropagation();
// 		action();
// 	};

// 	return (
// 		<Card className="hover:shadow-lg transition-shadow cursor-pointer">
// 			<div onClick={handleCardClick}>
// 				<CardHeader>
// 					<CardTitle className="text-lg">{chat.title || 'Untitled Chat'}</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					<div className="space-y-2">
// 						<p className="text-sm text-gray-600">
// 							{chat.settings?.savingParams?.summary || 'No summary available'}
// 						</p>
// 						<div className="flex gap-2">
// 							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
// 								{chat.settings?.chatType || 'Base Chat'}
// 							</span>
// 							{chat.settings?.selectedApi && (
// 								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
// 									{chat.settings.selectedApi}
// 								</span>
// 							)}
// 						</div>
// 					</div>
// 				</CardContent>
// 			</div>
// 			<CardFooter className="flex justify-between items-center">
// 				<span className="text-sm text-gray-500">
// 					{new Date(chat.createdAt).toLocaleDateString()}
// 				</span>
// 				<div className="flex gap-2">
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={(e) => handleAction(e, () => onCopy(chat._id))}
// 						title="Copy chat"
// 					>
// 						<Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
// 					</Button>
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={(e) => handleAction(e, () => onDelete(chat._id))}
// 						title="Delete chat"
// 					>
// 						<Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
// 					</Button>
// 				</div>
// 			</CardFooter>
// 		</Card>
// 	);
// };

// export default ChatHistoryCard;