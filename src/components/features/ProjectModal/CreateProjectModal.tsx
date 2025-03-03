// src/components/features/ProjectModal/CreateProjectModal.tsx
import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateProjectInput, ProjectStatus } from '@/utils/types/project.types';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface CreateProjectModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: CreateProjectInput) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
	open,
	onOpenChange,
	onSubmit,
}) => {
	const [formData, setFormData] = useState<CreateProjectInput>({
		title: '',
		description: '',
		status: ProjectStatus.ACTIVE,
		metadata: {
			tags: [],
		}
	});

	const [tags, setTags] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsSubmitting(true);

		try {
			// Process tags
			const processedData = {
				...formData,
				metadata: {
					...formData.metadata,
					tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
				}
			};

			await onSubmit(processedData);
			setFormData({
				title: '',
				description: '',
				status: ProjectStatus.ACTIVE,
				metadata: { tags: [] }
			});
			setTags('');
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create project');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create New Project</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="title">Project Title</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => setFormData(prev => ({
									...prev,
									title: e.target.value
								}))}
								placeholder="Enter project title"
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => setFormData(prev => ({
									...prev,
									description: e.target.value
								}))}
								placeholder="Enter project description"
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={formData.status}
								onValueChange={(value: ProjectStatus) => setFormData(prev => ({
									...prev,
									status: value
								}))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
									<SelectItem value={ProjectStatus.ARCHIVED}>Archived</SelectItem>
									<SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="tags">Tags (comma-separated)</Label>
							<Input
								id="tags"
								value={tags}
								onChange={(e) => setTags(e.target.value)}
								placeholder="technology, research, ai"
							/>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !formData.title || !formData.description}
						>
							{isSubmitting ? 'Creating...' : 'Create Project'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};