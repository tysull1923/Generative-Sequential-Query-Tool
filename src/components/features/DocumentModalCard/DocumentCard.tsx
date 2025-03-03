// src/components/features/DocumentCard/DocumentCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { FileText, Trash2, ExternalLink } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';

interface DocumentCardProps {
	document: KnowledgeDocument;
	onEdit: (docId: string) => void;
	onDelete: (docId: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onEdit, onDelete }) => {
	const getFileIcon = (fileType?: string) => {
		if (!fileType) return <FileText className="h-4 w-4" />;

		switch (fileType.toLowerCase()) {
			case 'text/plain':
				return <FileText className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	return (
		<Card className="group">
			<CardHeader className="flex flex-row items-start justify-between">
				<div className="flex items-start gap-4">
					{getFileIcon(document.metadata?.fileType)}
					<div>
						<CardTitle className="text-base">{document.title}</CardTitle>
						<CardDescription>
							Added {format(new Date(document.addedAt), 'PPP')}
						</CardDescription>
					</div>
				</div>
				<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.open(`/knowledge/${document._id}`, '_blank')}
						className="flex items-center gap-1"
					>
						<ExternalLink className="h-4 w-4" />
						Edit
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => onDelete(document._id)}
						className="flex items-center gap-1"
					>
						<Trash2 className="h-4 w-4" />
						Delete
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2 text-sm text-gray-500">
					<Badge variant="secondary" className="capitalize">
						{document.metadata?.fileType?.split('/')[1] || 'unknown'}
					</Badge>
					{document.metadata?.fileSize && (
						<span>{Math.round(document.metadata.fileSize / 1024)} KB</span>
					)}
				</div>
			</CardContent>
			<CardFooter>
				<p className="text-sm text-gray-500">
					Last updated: {format(new Date(document.lastUpdated), 'PPP')}
				</p>
			</CardFooter>
		</Card>
	);
};

export default DocumentCard;