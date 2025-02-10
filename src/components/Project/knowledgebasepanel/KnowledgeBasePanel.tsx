// src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
// src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
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
import { Progress } from '@/components/ui/progress';
import KnowledgeCard from '@/components/features/KnowledgeCard/KnowledgeCard';
import { KnowledgeDocument, RAGSettings } from '@/utils/types/project.types';
import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';

interface KnowledgeBasePanelProps {
	projectId: string;
	documents: KnowledgeDocument[];
	onAddDocument: (doc: KnowledgeDocument) => Promise<void>;
	onRemoveDocument?: (docId: string) => Promise<void>;
	onReindexDocument?: (docId: string) => Promise<void>;
	settings: RAGSettings;
	className?: string;
}

const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
	projectId,
	documents,
	onAddDocument,
	onRemoveDocument,
	onReindexDocument,
	settings,
	className = ''
}) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
		setError(null);

		try {
			// Simulate initial upload progress
			const interval = setInterval(() => {
				setUploadProgress(prev => {
					if (prev >= 90) {
						clearInterval(interval);
						return 90;
					}
					return prev + 10;
				});
			}, 500);

			const documentService = KnowledgeDocumentApiService.getInstance();

			// Upload all files at once
			const uploadedDocs = await documentService.uploadDocuments(projectId, Array.from(files));

			// Add each document to the project
			for (const doc of uploadedDocs) {
				await onAddDocument(doc);
			}

			// Complete upload
			clearInterval(interval);
			setUploadProgress(100);
			setTimeout(() => {
				setIsUploading(false);
				setUploadProgress(0);
			}, 500);

		} catch (error) {
			console.error('Error uploading files:', error);
			setError('Failed to upload documents');
			setIsUploading(false);
			setUploadProgress(0);
		}
	};
	const handleDeleteDocument = async (docId: string) => {
		if (onRemoveDocument) {
			try {
				await onRemoveDocument(docId);
				setShowDeleteDialog(false);
				setSelectedDoc(null);
			} catch (error) {
				console.error('Error deleting document:', error);
				setError('Failed to delete document');
			}
		}
	};

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header Actions */}
			<div className="flex items-center justify-between">
				<div className="flex-1 mr-4">
					<Input
						placeholder="Search knowledge base..."
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

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

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

			{/* Knowledge Documents Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredDocuments.map((doc) => (
					<KnowledgeCard
						key={doc.id}
						document={doc}
						onDelete={() => {
							setSelectedDoc(doc);
							setShowDeleteDialog(true);
						}}
						onReindex={onReindexDocument ? () => onReindexDocument(doc.id) : undefined}
					/>
				))}
				{filteredDocuments.length === 0 && !isUploading && (
					<div className="col-span-full text-center py-8">
						<p className="text-gray-500">No documents found. Add documents to get started!</p>
					</div>
				)}
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
							onClick={() => selectedDoc && handleDeleteDocument(selectedDoc.id)}
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