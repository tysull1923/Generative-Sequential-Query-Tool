// src/pages/knowledge/KnowledgeEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	Save,
	RefreshCw,
	FileText,
	Calendar,
	Hash,
	Database
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

import { KnowledgeDocument } from '@/utils/types/project.types';
import { ProjectApiService } from '@/services/database/projectDatabaseApiService';

interface KnowledgeEditPageState {
	document?: KnowledgeDocument;
	projectId?: string;
}

const KnowledgeEditPage: React.FC = () => {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const state = location.state as KnowledgeEditPageState;

	const [document, setDocument] = useState<KnowledgeDocument | null>(state?.document || null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isReindexing, setIsReindexing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const projectService = ProjectApiService.getInstance();

	useEffect(() => {
		if (!document && id) {
			fetchDocument();
		}
	}, [id]);

	const fetchDocument = async () => {
		try {
			// You'll need to implement this endpoint
			const docData = await projectService.getDocument(state.projectId!, id!);
			setDocument(docData);
		} catch (err) {
			setError('Failed to load document');
			console.error('Error fetching document:', err);
		}
	};

	const handleSave = async () => {
		if (!document || !state.projectId) return;

		try {
			setIsSaving(true);
			setError(null);

			// Update the document
			await projectService.updateDocument(state.projectId, document.id, {
				...document,
				lastUpdated: new Date()
			});

			setIsEditing(false);
		} catch (err) {
			setError('Failed to save document');
			console.error('Error saving document:', err);
		} finally {
			setIsSaving(false);
		}
	};

	const handleReindex = async () => {
		if (!document || !state.projectId) return;

		try {
			setIsReindexing(true);
			setError(null);

			// Trigger reindexing
			await projectService.reindexDocument(state.projectId, document.id);

			// Refresh document data
			await fetchDocument();
		} catch (err) {
			setError('Failed to reindex document');
			console.error('Error reindexing document:', err);
		} finally {
			setIsReindexing(false);
		}
	};

	if (!document) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6 max-w-5xl">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<Button
					variant="ghost"
					onClick={() => navigate(-1)}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</Button>
				<div className="flex items-center gap-2">
					{isEditing ? (
						<>
							<Button
								variant="outline"
								onClick={() => setIsEditing(false)}
								disabled={isSaving}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSaving}
								className="flex items-center gap-2"
							>
								{isSaving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Save className="h-4 w-4" />
								)}
								Save Changes
							</Button>
						</>
					) : (
						<>
							<Button
								variant="outline"
								onClick={handleReindex}
								disabled={isReindexing}
								className="flex items-center gap-2"
							>
								{isReindexing ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="h-4 w-4" />
								)}
								Reindex
							</Button>
							<Button
								onClick={() => setIsEditing(true)}
								className="flex items-center gap-2"
							>
								<FileText className="h-4 w-4" />
								Edit
							</Button>
						</>
					)}
				</div>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>
								{isEditing ? (
									<Input
										value={document.title}
										onChange={(e) => setDocument(prev =>
											prev ? { ...prev, title: e.target.value } : prev
										)}
										placeholder="Document Title"
										className="text-xl font-bold"
									/>
								) : (
									document.title
								)}
							</CardTitle>
							<CardDescription>
								Last updated {format(new Date(document.lastUpdated), 'MMM d, yyyy')}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[600px] w-full rounded-md border p-4">
								{isEditing ? (
									<Textarea
										value={document.content}
										onChange={(e) => setDocument(prev =>
											prev ? { ...prev, content: e.target.value } : prev
										)}
										placeholder="Document Content"
										className="min-h-[500px] resize-none"
									/>
								) : (
									<div className="prose max-w-none">
										{document.content}
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Document Info</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label className="flex items-center gap-2 mb-2">
									<Calendar className="h-4 w-4" />
									Added
								</Label>
								<p className="text-sm text-gray-500">
									{format(new Date(document.addedAt), 'MMM d, yyyy')}
								</p>
							</div>
							<Separator />
							<div>
								<Label className="flex items-center gap-2 mb-2">
									<Hash className="h-4 w-4" />
									Source
								</Label>
								<Badge variant="secondary">
									{document.source}
								</Badge>
							</div>
							<Separator />
							<div>
								<Label className="flex items-center gap-2 mb-2">
									<Database className="h-4 w-4" />
									Chunks
								</Label>
								<div className="space-y-2">
									<p className="text-sm text-gray-500">
										{document.chunks?.length || 0} chunks generated
									</p>
									{document.chunks?.map((chunk, index) => (
										<Card key={chunk.id} className="p-2 text-sm">
											<p className="font-mono text-xs text-gray-500 mb-1">
												Chunk {index + 1}
											</p>
											<p className="truncate">{chunk.content}</p>
										</Card>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default KnowledgeEditPage;