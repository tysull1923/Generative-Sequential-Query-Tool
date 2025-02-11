// src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
import { useState, useCallback } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/Input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import KnowledgeCard from "@/components/features/KnowledgeCard/KnowledgeCard"
import type { KnowledgeBasePanelProps, UploadState } from "./KnowledgeBasePanel.types"
import { KnowledgeDocumentApiService } from "@/services/database/knowledgeDocumentApiService"
import { getDocument } from 'pdfjs-dist'

const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
	projectId,
	documents,
	onAddDocument,
	onRemoveDocument,
	onReindexDocument,
	settings,
	className = "",
}) => {
	const [searchQuery, setSearchQuery] = useState("")
	const [uploadState, setUploadState] = useState<UploadState>({
		isUploading: false,
		progress: 0,
		error: null
	})

	const processFile = async (file: File, reader: FileReader): Promise<string> => {
		return new Promise((resolve, reject) => {
			reader.onload = async (e) => {
				try {
					let content = e.target?.result as string
					const fileType = file.name.split(".").pop()?.toLowerCase() || ""

					// Handle PDF files
					if (fileType === "pdf") {
						const pdf = await getDocument({ data: new Uint8Array(e.target!.result as ArrayBuffer) }).promise
						let pdfText = ""

						for (let i = 1; i <= pdf.numPages; i++) {
							const page = await pdf.getPage(i)
							const textContent = await page.getTextContent()
							pdfText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
						}

						content = pdfText
					}

					// Wrap code files in a code block
					const codeFileExtensions = ["java", "ts", "js", "py", "cpp", "cs", "html", "css", "json"]
					if (codeFileExtensions.includes(fileType)) {
						content = `\`\`\`${fileType}\n${content}\n\`\`\``
					}

					resolve(content)
				} catch (error) {
					reject(error)
				}
			}

			reader.onerror = () => reject(reader.error)

			// Read file based on type
			if (file.name.endsWith(".pdf")) {
				reader.readAsArrayBuffer(file)
			} else {
				reader.readAsText(file)
			}
		})
	}

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files?.length) return;

		setUploadState({ isUploading: true, progress: 0, error: null });

		try {
			const fileProcessingPromises = Array.from(files).map(async (file) => {
				const reader = new FileReader();
				const content = await processFile(file, reader);

				// Create document object
				const documentData = {
					title: file.name,
					content: content,
					source: "upload",
					metadata: {
						fileType: file.type,
						fileSize: file.size,
						extension: file.name.split(".").pop()?.toLowerCase()
					}
				};

				// Send to parent component to handle creation
				const createdDoc = await onAddDocument(documentData);

				setUploadState(prev => ({
					...prev,
					progress: prev.progress + (100 / files.length)
				}));

				return createdDoc;
			});

			await Promise.all(fileProcessingPromises);

			setUploadState(prev => ({ ...prev, progress: 100 }));
			setTimeout(() => {
				setUploadState({ isUploading: false, progress: 0, error: null });
			}, 500);

		} catch (error) {
			console.error('Error uploading files:', error);
			setUploadState({
				isUploading: false,
				progress: 0,
				error: 'Failed to upload one or more documents'
			});
		}
	}

	// Filter documents based on search
	const filteredDocuments = documents.filter(doc =>
		doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		doc.source.toLowerCase().includes(searchQuery.toLowerCase())
	)

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
						disabled={uploadState.isUploading}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Add Documents
					</Button>
					<input
						id="file-upload"
						type="file"
						multiple
						accept=".txt,.md,.pdf,.java,.ts,.js,.py,.cpp,.cs,.html,.css,.json"
						onChange={handleFileUpload}
						className="hidden"
					/>
				</div>
			</div>

			{/* Error Alert */}
			{uploadState.error && (
				<Alert variant="destructive">
					<AlertDescription>{uploadState.error}</AlertDescription>
				</Alert>
			)}

			{/* Upload Progress */}
			{uploadState.isUploading && (
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Uploading documents...</span>
						<span>{Math.round(uploadState.progress)}%</span>
					</div>
					<Progress value={uploadState.progress} />
				</div>
			)}

			{/* Documents Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredDocuments.map((doc) => (
					<KnowledgeCard
						key={doc._id}
						document={doc}
						onDelete={onRemoveDocument ? () => onRemoveDocument(doc._id) : undefined}
						onReindex={onReindexDocument ? () => onReindexDocument(doc._id) : undefined}
					/>
				))}
				{filteredDocuments.length === 0 && !uploadState.isUploading && (
					<div className="col-span-full text-center py-8">
						<p className="text-gray-500">No documents found. Add documents to get started!</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default KnowledgeBasePanel

// "use client"

// // src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
// import type React from "react"
// import { useState } from "react"
// import { Plus, Search } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/Input"
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// } from "@/components/ui/Alert-dialog"
// import { Progress } from "@/components/ui/progress"
// import KnowledgeCard from "@/components/features/KnowledgeCard/KnowledgeCard"
// import type { KnowledgeBasePanelProps, UploadState } from "./KnowledgeBasePanel.types"
// import type { KnowledgeDocument } from "@/utils/types/project.types"
// import { KnowledgeDocumentApiService } from "@/services/database/knowledgeDocumentApiService"
// import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"

// const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
// 	projectId,
// 	documents,
// 	onAddDocument,
// 	onRemoveDocument,
// 	onUpdateDocument,
// 	onReindexDocument,
// 	settings,
// 	className = "",
// }) => {
// 	const [searchQuery, setSearchQuery] = useState("")
// 	const [uploadState, setUploadState] = useState<UploadState>({
// 		isUploading: false,
// 		progress: 0,
// 	})
// 	const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null)
// 	const [showDeleteDialog, setShowDeleteDialog] = useState(false)

// 	// Filter documents based on search query
// 	const filteredDocuments = documents.filter(
// 		(doc) =>
// 			doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// 			doc.source.toLowerCase().includes(searchQuery.toLowerCase()),
// 	)

// 	// Set PDF.js worker source for Vite compatibility
// 	GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString()

// 	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
// 		const files = event.target.files
// 		if (!files?.length) return

// 		setUploadState({ isUploading: true, progress: 0 })

// 		try {
// 			const documentService = KnowledgeDocumentApiService.getInstance()
// 			const uploadedDocs: KnowledgeDocument[] = []

// 			for (const file of files) {
// 				const reader = new FileReader()

// 				reader.onload = async (e) => {
// 					let content = e.target?.result as string
// 					const fileType = file.name.split(".").pop()?.toLowerCase() || ""

// 					// Handle PDF files using pdfjs-dist
// 					if (fileType === "pdf") {
// 						const pdf = await getDocument({ data: new Uint8Array(e.target!.result as ArrayBuffer) }).promise
// 						let pdfText = ""

// 						for (let i = 1; i <= pdf.numPages; i++) {
// 							const page = await pdf.getPage(i)
// 							const textContent = await page.getTextContent()
// 							pdfText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
// 						}

// 						content = pdfText
// 					}

// 					// Wrap code files in a code block
// 					const codeFileExtensions = ["java", "ts", "js", "py", "cpp", "cs", "html", "css", "json"]
// 					if (codeFileExtensions.includes(fileType)) {
// 						content = `\`\`\`${fileType}\n${content}\n\`\`\``
// 					}

// 					try {
// 						// Send extracted content to backend
// 						const uploadedDoc = await documentService.createDocument(projectId, {
// 							title: file.name,
// 							content: content,
// 							source: "upload",
// 						})

// 						uploadedDocs.push(uploadedDoc)
// 						await onAddDocument(uploadedDoc)

// 						// Update progress
// 						setUploadState((prev) => ({ ...prev, progress: prev.progress + 100 / files.length }))
// 					} catch (error) {
// 						console.error("Error uploading file:", file.name, error)
// 						setUploadState((prev) => ({ ...prev, error: `Failed to upload ${file.name}` }))
// 					}
// 				}

// 				// Read files based on type
// 				if (file.name.endsWith(".pdf")) {
// 					reader.readAsArrayBuffer(file) // PDFs require ArrayBuffer for pdfjs
// 				} else {
// 					reader.readAsText(file) // Read as text for everything else
// 				}
// 			}

// 			// Wait for all files to be processed
// 			await Promise.all(Array.from(files).map(() => new Promise((resolve) => setTimeout(resolve, 1000))))

// 			setUploadState((prev) => ({ ...prev, progress: 100 }))
// 			setTimeout(() => {
// 				setUploadState({ isUploading: false, progress: 0 })
// 			}, 500)
// 		} catch (error) {
// 			console.error("Error uploading files:", error)
// 			setUploadState({ isUploading: false, progress: 0, error: "Failed to upload documents" })
// 		}
// 	}

// 	const handleDeleteDocument = async (docId: string) => {
// 		if (onRemoveDocument) {
// 			try {
// 				await onRemoveDocument(docId)
// 				setShowDeleteDialog(false)
// 				setSelectedDoc(null)
// 			} catch (error) {
// 				console.error("Error deleting document:", error)
// 				setUploadState((prev) => ({ ...prev, error: "Failed to delete document" }))
// 			}
// 		}
// 	}

// 	return (
// 		<div className={`space-y-6 ${className}`}>
// 			{/* Header Actions */}
// 			<div className="flex items-center justify-between">
// 				<div className="flex-1 mr-4">
// 					<Input
// 						placeholder="Search knowledge base..."
// 						value={searchQuery}
// 						onChange={(e) => setSearchQuery(e.target.value)}
// 						className="max-w-md"
// 						prefix={<Search className="h-4 w-4 text-gray-400" />}
// 					/>
// 				</div>
// 				<div className="flex items-center gap-2">
// 					<Button
// 						variant="outline"
// 						onClick={() => document.getElementById("file-upload")?.click()}
// 						disabled={uploadState.isUploading}
// 						className="flex items-center gap-2"
// 					>
// 						<Plus className="h-4 w-4" />
// 						Add Documents
// 					</Button>
// 					<input
// 						id="file-upload"
// 						type="file"
// 						multiple
// 						accept=".txt,.md,.pdf,.java,.ts,.js,.py,.cpp,.cs,.html,.css,.json"
// 						onChange={handleFileUpload}
// 						className="hidden"
// 					/>
// 				</div>
// 			</div>

// 			{/* Error Alert */}
// 			{uploadState.error && (
// 				<div className="p-4 bg-red-100 rounded-md text-red-700">
// 					<p>{uploadState.error}</p>
// 				</div>
// 			)}

// 			{/* Upload Progress */}
// 			{uploadState.isUploading && (
// 				<div className="space-y-2">
// 					<div className="flex justify-between text-sm">
// 						<span>Uploading documents...</span>
// 						<span>{uploadState.progress}%</span>
// 					</div>
// 					<Progress value={uploadState.progress} />
// 				</div>
// 			)}

// 			{/* Knowledge Documents Grid */}
// 			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 				{filteredDocuments.map((doc) => (
// 					<KnowledgeCard
// 						key={doc.id}
// 						document={doc}
// 						onDelete={() => {
// 							setSelectedDoc(doc)
// 							setShowDeleteDialog(true)
// 						}}
// 						onReindex={onReindexDocument ? () => onReindexDocument(doc.id) : undefined}
// 					/>
// 				))}
// 				{filteredDocuments.length === 0 && !uploadState.isUploading && (
// 					<div className="col-span-full text-center py-8">
// 						<p className="text-gray-500">No documents found. Add documents to get started!</p>
// 					</div>
// 				)}
// 			</div>

// 			{/* Delete Confirmation Dialog */}
// 			<AlertDialog
// 				open={showDeleteDialog}
// 				onOpenChange={() => {
// 					setShowDeleteDialog(false)
// 					setSelectedDoc(null)
// 				}}
// 			>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Delete Document</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to delete "{selectedDoc?.title}"? This action cannot be undone.
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction
// 							onClick={() => selectedDoc && handleDeleteDocument(selectedDoc.id)}
// 							className="bg-red-600 hover:bg-red-700"
// 						>
// 							Delete
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</div>
// 	)
// }

// export default KnowledgeBasePanel












// // src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
// // src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
// import React, { useState } from 'react';
// import { Plus, Search } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/Input';
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// } from "@/components/ui/Alert-dialog";
// import { Progress } from '@/components/ui/progress';
// import KnowledgeCard from '@/components/features/KnowledgeCard/KnowledgeCard';
// import { KnowledgeDocument, RAGSettings } from '@/utils/types/project.types';
// import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
// import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';


// interface KnowledgeBasePanelProps {
// 	projectId: string;
// 	documents: KnowledgeDocument[];
// 	onAddDocument: (doc: KnowledgeDocument) => Promise<void>;
// 	onRemoveDocument?: (docId: string) => Promise<void>;
// 	onReindexDocument?: (docId: string) => Promise<void>;
// 	settings: RAGSettings;
// 	className?: string;
// }

// const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
// 	projectId,
// 	documents,
// 	onAddDocument,
// 	onRemoveDocument,
// 	onReindexDocument,
// 	settings,
// 	className = ''
// }) => {
// 	const [searchQuery, setSearchQuery] = useState('');
// 	const [isUploading, setIsUploading] = useState(false);
// 	const [uploadProgress, setUploadProgress] = useState(0);
// 	const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
// 	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
// 	const [error, setError] = useState<string | null>(null);

// 	// Filter documents based on search query
// 	const filteredDocuments = documents.filter(doc =>
// 		doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// 		doc.source.toLowerCase().includes(searchQuery.toLowerCase())
// 	);

// 	// const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
// 	// 	const files = event.target.files;
// 	// 	if (!files?.length) return;

// 	// 	setIsUploading(true);
// 	// 	setUploadProgress(0);
// 	// 	setError(null);

// 	// 	try {
// 	// 		// Simulate initial upload progress
// 	// 		const interval = setInterval(() => {
// 	// 			setUploadProgress(prev => {
// 	// 				if (prev >= 90) {
// 	// 					clearInterval(interval);
// 	// 					return 90;
// 	// 				}
// 	// 				return prev + 10;
// 	// 			});
// 	// 		}, 500);

// 	// 		const documentService = KnowledgeDocumentApiService.getInstance();

// 	// 		// Upload all files at once
// 	// 		const uploadedDocs = await documentService.uploadDocuments(projectId, Array.from(files));

// 	// 		// Add each document to the project
// 	// 		for (const doc of uploadedDocs) {
// 	// 			await onAddDocument(doc);
// 	// 		}

// 	// 		// Complete upload
// 	// 		clearInterval(interval);
// 	// 		setUploadProgress(100);
// 	// 		setTimeout(() => {
// 	// 			setIsUploading(false);
// 	// 			setUploadProgress(0);
// 	// 		}, 500);

// 	// 	} catch (error) {
// 	// 		console.error('Error uploading files:', error);
// 	// 		setError('Failed to upload documents');
// 	// 		setIsUploading(false);
// 	// 		setUploadProgress(0);
// 	// 	}
// 	// };


// 	// Set PDF.js worker source for Vite compatibility
// 	GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

// 	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
// 		const files = event.target.files;
// 		if (!files?.length) return;

// 		setIsUploading(true);
// 		setUploadProgress(0);
// 		setError(null);

// 		try {
// 			const documentService = KnowledgeDocumentApiService.getInstance();
// 			const uploadedDocs: KnowledgeDocument[] = [];

// 			for (const file of files) {
// 				const reader = new FileReader();

// 				reader.onload = async (e) => {
// 					let content = e.target?.result as string;
// 					const fileType = file.name.split('.').pop()?.toLowerCase() || '';

// 					// Handle PDF files using pdfjs-dist
// 					if (fileType === 'pdf') {
// 						const pdf = await getDocument({ data: new Uint8Array(e.target!.result as ArrayBuffer) }).promise;
// 						let pdfText = '';

// 						for (let i = 1; i <= pdf.numPages; i++) {
// 							const page = await pdf.getPage(i);
// 							const textContent = await page.getTextContent();
// 							pdfText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
// 						}

// 						content = pdfText;
// 					}

// 					// Wrap code files in a code block
// 					const codeFileExtensions = ['java', 'ts', 'js', 'py', 'cpp', 'cs', 'html', 'css', 'json'];
// 					if (codeFileExtensions.includes(fileType)) {
// 						content = `\`\`\`${fileType}\n${content}\n\`\`\``;
// 					}

// 					// Send extracted content to backend
// 					const uploadedDoc = await documentService.createDocument(projectId, {
// 						title: file.name,
// 						content: content,
// 						source: 'upload',
// 					});

// 					uploadedDocs.push(uploadedDoc);
// 					await onAddDocument(uploadedDoc);
// 				};

// 				// Read files based on type
// 				if (file.name.endsWith('.pdf')) {
// 					reader.readAsArrayBuffer(file); // PDFs require ArrayBuffer for pdfjs
// 				} else {
// 					reader.readAsText(file); // Read as text for everything else
// 				}
// 			}

// 			setUploadProgress(100);
// 			setTimeout(() => {
// 				setIsUploading(false);
// 				setUploadProgress(0);
// 			}, 500);
// 		} catch (error) {
// 			console.error('Error uploading files:', error);
// 			setError('Failed to upload documents');
// 			setIsUploading(false);
// 			setUploadProgress(0);
// 		}
// 	};


// 	const handleDeleteDocument = async (docId: string) => {
// 		if (onRemoveDocument) {
// 			try {
// 				await onRemoveDocument(docId);
// 				setShowDeleteDialog(false);
// 				setSelectedDoc(null);
// 			} catch (error) {
// 				console.error('Error deleting document:', error);
// 				setError('Failed to delete document');
// 			}
// 		}
// 	};

// 	return (
// 		<div className={`space-y-6 ${className}`}>
// 			{/* Header Actions */}
// 			<div className="flex items-center justify-between">
// 				<div className="flex-1 mr-4">
// 					<Input
// 						placeholder="Search knowledge base..."
// 						value={searchQuery}
// 						onChange={(e) => setSearchQuery(e.target.value)}
// 						className="max-w-md"
// 						prefix={<Search className="h-4 w-4 text-gray-400" />}
// 					/>
// 				</div>
// 				<div className="flex items-center gap-2">
// 					<Button
// 						variant="outline"
// 						onClick={() => document.getElementById('file-upload')?.click()}
// 						disabled={isUploading}
// 						className="flex items-center gap-2"
// 					>
// 						<Plus className="h-4 w-4" />
// 						Add Documents
// 					</Button>
// 					<input
// 						id="file-upload"
// 						type="file"
// 						multiple
// 						accept=".txt,.md,.pdf"
// 						onChange={handleFileUpload}
// 						className="hidden"
// 					/>
// 				</div>
// 			</div>

// 			{/* Error Alert */}
// 			{error && (
// 				<Alert variant="destructive" className="mt-4">
// 					<AlertDescription>{error}</AlertDescription>
// 				</Alert>
// 			)}

// 			{/* Upload Progress */}
// 			{isUploading && (
// 				<div className="space-y-2">
// 					<div className="flex justify-between text-sm">
// 						<span>Uploading documents...</span>
// 						<span>{uploadProgress}%</span>
// 					</div>
// 					<Progress value={uploadProgress} />
// 				</div>
// 			)}

// 			{/* Knowledge Documents Grid */}
// 			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 				{filteredDocuments.map((doc) => (
// 					<KnowledgeCard
// 						key={doc.id}
// 						document={doc}
// 						onDelete={() => {
// 							setSelectedDoc(doc);
// 							setShowDeleteDialog(true);
// 						}}
// 						onReindex={onReindexDocument ? () => onReindexDocument(doc.id) : undefined}
// 					/>
// 				))}
// 				{filteredDocuments.length === 0 && !isUploading && (
// 					<div className="col-span-full text-center py-8">
// 						<p className="text-gray-500">No documents found. Add documents to get started!</p>
// 					</div>
// 				)}
// 			</div>

// 			{/* Delete Confirmation Dialog */}
// 			<AlertDialog
// 				open={showDeleteDialog}
// 				onOpenChange={() => {
// 					setShowDeleteDialog(false);
// 					setSelectedDoc(null);
// 				}}
// 			>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Delete Document</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to delete "{selectedDoc?.title}"? This action cannot be undone.
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction
// 							onClick={() => selectedDoc && handleDeleteDocument(selectedDoc.id)}
// 							className="bg-red-600 hover:bg-red-700"
// 						>
// 							Delete
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</div>
// 	);
// };

// export default KnowledgeBasePanel;