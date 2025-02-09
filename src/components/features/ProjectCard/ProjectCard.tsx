// src/components/features/ProjectCard/ProjectCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { Project, ProjectStatus } from '@/utils/types/project.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProjectCardProps {
	project: Project;
	onEdit: (project: Project) => void;
	onDelete: (projectId: string) => void;
	className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
	project,
	onEdit,
	onDelete,
	className
}) => {
	const getStatusColor = (status: ProjectStatus) => {
		switch (status) {
			case ProjectStatus.ACTIVE:
				return 'bg-green-100 text-green-800';
			case ProjectStatus.ARCHIVED:
				return 'bg-gray-100 text-gray-800';
			case ProjectStatus.COMPLETED:
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<Card className={cn("hover:shadow-lg transition-shadow", className)}>
			<CardHeader>
				<CardTitle className="text-lg flex justify-between items-center">
					<span className="truncate">{project.title}</span>
					<Badge variant="secondary" className={cn(getStatusColor(project.status))}>
						{project.status}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-gray-600 line-clamp-3">
					{project.description}
				</p>
				<div className="flex flex-wrap gap-2">
					{project.metadata?.tags?.map((tag) => (
						<Badge key={tag} variant="outline" className="text-xs">
							{tag}
						</Badge>
					))}
				</div>
				<div className="flex items-center gap-4 text-sm text-gray-500">
					<div className="flex items-center gap-1">
						<FileText className="h-4 w-4" />
						<span>{project.knowledgeBase.documents.length} documents</span>
					</div>
					<span>•</span>
					<div>
						{project.chats.length} chats
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between items-center">
				<span className="text-sm text-gray-500">
					Last modified: {new Date(project.lastModified).toLocaleDateString()}
				</span>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(project)}
					>
						<Pencil className="h-4 w-4 text-gray-500" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(project.id)}
					>
						<Trash2 className="h-4 w-4 text-red-500" />
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};