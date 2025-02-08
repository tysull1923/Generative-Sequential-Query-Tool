// src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx

import React, { useState } from 'react';
import {
	Plus,
	Search,
	FileText,
	Trash2,
	ExternalLink,
	RefreshCw,
	ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Progress } from '@/components/ui/progress';
import { KnowledgeDocument, RAGSettings } from '@/utils/types/project.types';

interface KnowledgeBasePanelProps {
	documents: KnowledgeDocument[];
	onAddDocument: (doc: KnowledgeDocument) => Promise<void>;
	onRemoveDocument?: (docId: string) => Promise<void>;
	onUpdateDocument?: (docId: string, updates: Partial<KnowledgeDocument>) => Promise<void>;
	onReindexDocument?: (docId: string) => Promise<void>;
	settings: RAGSettings;
	className?: string;
}

const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
	documents,
	onAddDocument,
	onRemoveDocument,
	onUpdateDocument,
	onReindexDocument,
	settings,
	className = ''
}) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Filter documents based on search query
	const filteredDocuments = documents.filter(doc =>
		doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		doc.source.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files?.length) return;

		setIsUploading(true);
		setUploadProgress(0);

		try {
			// Simulate upload progress
			const interval = setInterval(() => {
				setUploadProgress(prev => {
					if (prev >= 90) {
						clearInterval(interval);
						return 90;
					}
					return prev + 10;
				});
			}, 500);

			// Process each file
			for (const file of files) {
				const reader = new FileReader();
				reader.onload = async (e) => {
					const content = e.target?.result as string;

					const newDoc: KnowledgeDocument = {
						id: crypto.randomUUID(),
						title: file.name,
						content,
						source: 'upload',
						addedAt: new Date(),
						lastUpdated: new Date()
					};

					await onAddDocument(newDoc);
				};
				reader.readAsText(file);
			}

			// Complete upload
			setUploadProgress(100);
			setTimeout(() => {
				setIsUploading(false);
				setUploadProgress(0);
			}, 500);

		} catch (error) {
			console.error('Error uploading files:', error);
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const handleDeleteDocument = async () => {
		if (selectedDoc && onRemoveDocument) {
			try {
				await onRemoveDocument(selectedDoc.id);
				setShowDeleteDialog(false);
				setSelectedDoc(null);
			} catch (error) {
				console.error('Error deleting document:', error);
			}
		}
	};

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header Actions */}
			<div className="flex items-center justify-between">
				<div className="flex-1 mr-4">
					<Input
						placeholder="Search documents..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="max-w-md"
						prefix={<Search className="h-4 w-4 text-gray-400" />}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => document.getElementById('file-upload')?.click()}
						disabled={isUploading}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Add Documents
					</Button>
					<input
						id="file-upload"
						type="file"
						multiple
						accept=".txt,.md,.pdf"
						onChange={handleFileUpload}
						className="hidden"
					/>
				</div>
			</div>

			{/* Upload Progress */}
			{isUploading && (
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Uploading documents...</span>
						<span>{uploadProgress}%</span>
					</div>
					<Progress value={uploadProgress} />
				</div>
			)}

			{/* Documents Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredDocuments.map((doc) => (
					<Card key={doc.id} className="flex flex-col">
						<CardHeader>
							<div className="flex justify-between items-start">
								<div className="space-y-1">
									<CardTitle className="text-lg flex items-center gap-2">
										<FileText className="h-4 w-4" />
										{doc.title}
									</CardTitle>
									<CardDescription>
										Added {format(new Date(doc.addedAt), 'MMM d, yyyy')}
									</CardDescription>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<ChevronDown className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => window.open(`/documents/${doc.id}`)}>
											<ExternalLink className="h-4 w-4 mr-2" />
											View Document
										</DropdownMenuItem>
										{onReindexDocument && (
											<DropdownMenuItem onClick={() => onReindexDocument(doc.id)}>
												<RefreshCw className="h-4 w-4 mr-2" />
												Reindex
											</DropdownMenuItem>
										)}
										<DropdownMenuItem
											className="text-red-600"
											onClick={() => {
												setSelectedDoc(doc);
												setShowDeleteDialog(true);
											}}
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
									{doc.chunks?.length || 0} chunks
								</Badge>
								<Badge variant="secondary">
									{doc.source}
								</Badge>
							</div>
						</CardContent>
						<CardFooter className="text-sm text-gray-500 mt-auto">
							Last updated {format(new Date(doc.lastUpdated), 'MMM d, yyyy')}
						</CardFooter>
					</Card>
				))}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={() => {
					setShowDeleteDialog(false);
					setSelectedDoc(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Document</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{selectedDoc?.title}"? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteDocument}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default KnowledgeBasePanel;