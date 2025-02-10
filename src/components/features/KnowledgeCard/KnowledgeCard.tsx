// src/components/Project/KnowledgeBase/KnowledgeCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, ExternalLink, RefreshCw, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KnowledgeDocument } from '@/utils/types/project.types';

interface KnowledgeCardProps {
	document: KnowledgeDocument;
	onDelete: (docId: string) => void;
	onReindex?: (docId: string) => void;
	className?: string;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
	document,
	onDelete,
	onReindex,
	className = ''
}) => {
	const navigate = useNavigate();

	const handleCardClick = () => {
		navigate(`/knowledge/${document.id}`, {
			state: { document }
		});
	};

	const handleAction = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation();
		action();
	};

	return (
		<Card
			className={`flex flex-col hover:shadow-lg transition-shadow cursor-pointer ${className}`}
			onClick={handleCardClick}
		>
			<CardHeader>
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<CardTitle className="text-lg flex items-center gap-2">
							<FileText className="h-4 w-4" />
							{document.title}
						</CardTitle>
						<p className="text-sm text-gray-500">
							Added {format(new Date(document.addedAt), 'MMM d, yyyy')}
						</p>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
							<Button variant="ghost" size="sm">
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={(e) => handleAction(e, () => navigate(`/knowledge/${document.id}`))}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Edit Content
							</DropdownMenuItem>
							{onReindex && (
								<DropdownMenuItem
									onClick={(e) => handleAction(e, () => onReindex(document.id))}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Reindex
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								className="text-red-600"
								onClick={(e) => handleAction(e, () => onDelete(document.id))}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">
						{document.chunks?.length || 0} chunks
					</Badge>
					<Badge variant="secondary">
						{document.source}
					</Badge>
				</div>
			</CardContent>
			<CardFooter className="text-sm text-gray-500 mt-auto">
				Last updated {format(new Date(document.lastUpdated), 'MMM d, yyyy')}
			</CardFooter>
		</Card>
	);
};

export default KnowledgeCard;