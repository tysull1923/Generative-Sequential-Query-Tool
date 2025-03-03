// src/pages/knowledge/KnowledgeEditPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	Save,
	RefreshCw,
	FileText,
	Calendar,
	Hash,
	Database,
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
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface KnowledgeEditPageState {
	document?: KnowledgeDocument;
	projectId?: string;
}

const KnowledgeEditPage = () => {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const state = location.state as KnowledgeEditPageState;

	const [document, setDocument] = useState<KnowledgeDocument | null>(state?.document || null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isReindexing, setIsReindexing] = useState(false);
	const [isLoading, setIsLoading] = useState(!state?.document);
	const [error, setError] = useState<string | null>(null);

	const documentService = KnowledgeDocumentApiService.getInstance();

	const fetchDocument = useCallback(async () => {
		if (!id || !state?.projectId) return;

		try {
			setIsLoading(true);
			const doc = await documentService.getDocument(id);
			setDocument(doc);
			setError(null);
		} catch (err) {
			console.error('Error fetching document:', err);
			setError('Failed to load document');
		} finally {
			setIsLoading(false);
		}
	}, [id, state?.projectId]);

	useEffect(() => {
		if (!document && id) {
			fetchDocument();
		}
	}, [document, id, fetchDocument]);

	const handleSave = async () => {
		if (!document?._id) return;

		try {
			setIsSaving(true);
			setError(null);

			await documentService.updateDocument(document._id, {
				title: document.title,
				content: document.content,
				lastUpdated: new Date()
			});

			setIsEditing(false);
		} catch (err) {
			console.error('Error saving document:', err);
			setError('Failed to save document');
		} finally {
			setIsSaving(false);
		}
	};

	const handleReindex = async () => {
		if (!document?._id) return;

		try {
			setIsReindexing(true);
			setError(null);

			await documentService.reindexDocument(document._id);
			await fetchDocument(); // Refresh document data

		} catch (err) {
			console.error('Error reindexing document:', err);
			setError('Failed to reindex document');
		} finally {
			setIsReindexing(false);
		}
	};

	const renderContent = (content: string) => {
		if (!content) return null;

		const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
		const parts = [];
		let lastIndex = 0;
		let match;

		while ((match = codeBlockRegex.exec(content)) !== null) {
			// Add text before code block
			if (match.index > lastIndex) {
				parts.push(
					<p key={`text-${lastIndex}`} className="mb-4">
						{content.substring(lastIndex, match.index)}
					</p>
				);
			}

			// Add code block
			const [, language, code] = match;
			parts.push(
				<div key={`code-${match.index}`} className="relative mb-4">
					<div className="absolute right-2 top-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => navigator.clipboard.writeText(code)}
							className="h-8 w-8 p-0"
						>
							<FileText className="h-4 w-4" />
						</Button>
					</div>
					<SyntaxHighlighter
						language={language || 'text'}
						style={vscDarkPlus}
						className="rounded-md !mt-0"
					>
						{code}
					</SyntaxHighlighter>
				</div>
			);

			lastIndex = match.index + match[0].length;
		}

		// Add remaining text
		if (lastIndex < content.length) {
			parts.push(
				<p key={`text-${lastIndex}`} className="mb-4">
					{content.substring(lastIndex)}
				</p>
			);
		}

		return parts;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	if (!document) {
		return (
			<div className="container mx-auto px-4 py-6">
				<Alert variant="destructive">
					<AlertDescription>Document not found</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6 max-w-7xl">
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
										onChange={(e) =>
											setDocument((prev) =>
												prev ? { ...prev, title: e.target.value } : prev
											)
										}
										placeholder="Document Title"
										className="text-xl font-bold"
									/>
								) : (
									document.title
								)}
							</CardTitle>
							<CardDescription>
								Last updated {format(new Date(document.lastUpdated), 'PPP')}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[600px] w-full rounded-md border p-4">
								{isEditing ? (
									<Textarea
										value={document.content}
										onChange={(e) =>
											setDocument((prev) =>
												prev ? { ...prev, content: e.target.value } : prev
											)
										}
										placeholder="Document Content"
										className="min-h-[500px] resize-none"
									/>
								) : (
									<div className="prose prose-sm max-w-none dark:prose-invert">
										{renderContent(document.content)}
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
									{format(new Date(document.addedAt), 'PPP')}
								</p>
							</div>
							<Separator />
							<div>
								<Label className="flex items-center gap-2 mb-2">
									<Hash className="h-4 w-4" />
									Source
								</Label>
								<Badge variant="secondary">{document.source}</Badge>
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
										<Card key={chunk.id} className="p-2">
											<p className="font-mono text-xs text-gray-500 mb-1">
												Chunk {index + 1}
											</p>
											<p className="text-sm truncate">{chunk.content}</p>
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


// // src/pages/knowledge/KnowledgeEditPage.tsx
// import React, { useState, useEffect } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import {
// 	ArrowLeft,
// 	Save,
// 	RefreshCw,
// 	FileText,
// 	Calendar,
// 	Hash,
// 	Database
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { Button } from '@/components/ui/button';
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from '@/components/ui/card';
// import { Input } from '@/components/ui/Input';
// import { Textarea } from '@/components/ui/textarea';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import { Label } from '@/components/ui/label';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Loader2 } from 'lucide-react';

// import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
// import { ProjectApiService } from '@/services/database/projectDatabaseApiService';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// interface KnowledgeEditPageState {
// 	document?: KnowledgeDocument;
// 	projectId?: string;
// }

// const KnowledgeEditPage: React.FC = () => {
// 	const { id } = useParams();
// 	const location = useLocation();
// 	const navigate = useNavigate();
// 	const state = location.state as KnowledgeEditPageState;

// 	const [document, setDocument] = useState<KnowledgeDocument | null>(state?.document || null);
// 	const [isEditing, setIsEditing] = useState(false);
// 	const [isSaving, setIsSaving] = useState(false);
// 	const [isReindexing, setIsReindexing] = useState(false);
// 	const [error, setError] = useState<string | null>(null);

// 	const projectService = ProjectApiService.getInstance();

// 	useEffect(() => {
// 		if (!document && id) {
// 			fetchDocument();
// 		}
// 	}, [id]);

// 	const fetchDocument = async () => {
// 		try {
// 			// You'll need to implement this endpoint
// 			const docData = await projectService.getDocument(state.projectId!, id!);
// 			setDocument(docData);
// 		} catch (err) {
// 			setError('Failed to load document');
// 			console.error('Error fetching document:', err);
// 		}
// 	};

// 	const handleSave = async () => {
// 		if (!document || !state.projectId) return;

// 		try {
// 			setIsSaving(true);
// 			setError(null);

// 			// Update the document
// 			await projectService.updateDocument(state.projectId, document._id, {
// 				...document,
// 				lastUpdated: new Date()
// 			});

// 			setIsEditing(false);
// 		} catch (err) {
// 			setError('Failed to save document');
// 			console.error('Error saving document:', err);
// 		} finally {
// 			setIsSaving(false);
// 		}
// 	};
// 	const renderContent = (content: string) => {
// 		const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

// 		const parts = [];
// 		let lastIndex = 0;
// 		let match;

// 		while ((match = codeBlockRegex.exec(content)) !== null) {
// 			const [fullMatch, lang, code] = match;

// 			// Push text before the code block
// 			if (match.index > lastIndex) {
// 				parts.push(
// 					<p key={lastIndex}>{content.substring(lastIndex, match.index)}</p>
// 				);
// 			}

// 			// Push the code block
// 			parts.push(
// 				<SyntaxHighlighter key={match.index} language={lang || 'plaintext'} style={vscDarkPlus}>
// 					{code}
// 				</SyntaxHighlighter>
// 			);

// 			lastIndex = match.index + fullMatch.length;
// 		}

// 		// Push remaining text after last code block
// 		if (lastIndex < content.length) {
// 			parts.push(<p key={lastIndex}>{content.substring(lastIndex)}</p>);
// 		}

// 		return parts;
// 	};

// 	const handleReindex = async () => {
// 		if (!document || !state.projectId) return;

// 		try {
// 			setIsReindexing(true);
// 			setError(null);

// 			// Trigger reindexing
// 			await projectService.reindexDocument(state.projectId, document.id);

// 			// Refresh document data
// 			await fetchDocument();
// 		} catch (err) {
// 			setError('Failed to reindex document');
// 			console.error('Error reindexing document:', err);
// 		} finally {
// 			setIsReindexing(false);
// 		}
// 	};

// 	if (!document) {
// 		return (
// 			<div className="flex items-center justify-center min-h-screen">
// 				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="container mx-auto px-4 py-6 max-w-5xl">
// 			{/* Header */}
// 			<div className="flex justify-between items-center mb-6">
// 				<Button
// 					variant="ghost"
// 					onClick={() => navigate(-1)}
// 					className="flex items-center gap-2"
// 				>
// 					<ArrowLeft className="h-4 w-4" />
// 					Back
// 				</Button>
// 				<div className="flex items-center gap-2">
// 					{isEditing ? (
// 						<>
// 							<Button
// 								variant="outline"
// 								onClick={() => setIsEditing(false)}
// 								disabled={isSaving}
// 							>
// 								Cancel
// 							</Button>
// 							<Button
// 								onClick={handleSave}
// 								disabled={isSaving}
// 								className="flex items-center gap-2"
// 							>
// 								{isSaving ? (
// 									<Loader2 className="h-4 w-4 animate-spin" />
// 								) : (
// 									<Save className="h-4 w-4" />
// 								)}
// 								Save Changes
// 							</Button>
// 						</>
// 					) : (
// 						<>
// 							<Button
// 								variant="outline"
// 								onClick={handleReindex}
// 								disabled={isReindexing}
// 								className="flex items-center gap-2"
// 							>
// 								{isReindexing ? (
// 									<Loader2 className="h-4 w-4 animate-spin" />
// 								) : (
// 									<RefreshCw className="h-4 w-4" />
// 								)}
// 								Reindex
// 							</Button>
// 							<Button
// 								onClick={() => setIsEditing(true)}
// 								className="flex items-center gap-2"
// 							>
// 								<FileText className="h-4 w-4" />
// 								Edit
// 							</Button>
// 						</>
// 					)}
// 				</div>
// 			</div>

// 			{error && (
// 				<Alert variant="destructive" className="mb-6">
// 					<AlertDescription>{error}</AlertDescription>
// 				</Alert>
// 			)}

// 			<div className="grid grid-cols-3 gap-6">
// 				{/* Main Content */}
// 				<div className="col-span-2 space-y-6">
// 					<Card>
// 						<CardHeader>
// 							<CardTitle>
// 								{isEditing ? (
// 									<Input
// 										value={document.title}
// 										onChange={(e) => setDocument(prev =>
// 											prev ? { ...prev, title: e.target.value } : prev
// 										)}
// 										placeholder="Document Title"
// 										className="text-xl font-bold"
// 									/>
// 								) : (
// 									document.title
// 								)}
// 							</CardTitle>
// 							<CardDescription>
// 								Last updated {format(new Date(document.lastUpdated), 'MMM d, yyyy')}
// 							</CardDescription>
// 						</CardHeader>
// 						<CardContent>
// 							<ScrollArea className="h-[600px] w-full rounded-md border p-4">
// 								{isEditing ? (
// 									<Textarea
// 										value={document.content}
// 										onChange={(e) => setDocument(prev =>
// 											prev ? { ...prev, content: e.target.value } : prev
// 										)}
// 										placeholder="Document Content"
// 										className="min-h-[500px] resize-none"
// 									/>
// 								) : (
// 									<div className="prose max-w-none">
// 										{renderContent(document.content)}
// 									</div>
// 								)}
// 							</ScrollArea>
// 						</CardContent>
// 					</Card>
// 				</div>

// 				{/* Sidebar */}
// 				<div className="space-y-6">
// 					<Card>
// 						<CardHeader>
// 							<CardTitle>Document Info</CardTitle>
// 						</CardHeader>
// 						<CardContent className="space-y-4">
// 							<div>
// 								<Label className="flex items-center gap-2 mb-2">
// 									<Calendar className="h-4 w-4" />
// 									Added
// 								</Label>
// 								<p className="text-sm text-gray-500">
// 									{format(new Date(document.addedAt), 'MMM d, yyyy')}
// 								</p>
// 							</div>
// 							<Separator />
// 							<div>
// 								<Label className="flex items-center gap-2 mb-2">
// 									<Hash className="h-4 w-4" />
// 									Source
// 								</Label>
// 								<Badge variant="secondary">
// 									{document.source}
// 								</Badge>
// 							</div>
// 							<Separator />
// 							<div>
// 								<Label className="flex items-center gap-2 mb-2">
// 									<Database className="h-4 w-4" />
// 									Chunks
// 								</Label>
// 								<div className="space-y-2">
// 									<p className="text-sm text-gray-500">
// 										{document.chunks?.length || 0} chunks generated
// 									</p>
// 									{document.chunks?.map((chunk, index) => (
// 										<Card key={chunk.id} className="p-2 text-sm">
// 											<p className="font-mono text-xs text-gray-500 mb-1">
// 												Chunk {index + 1}
// 											</p>
// 											<p className="truncate">{chunk.content}</p>
// 										</Card>
// 									))}
// 								</div>
// 							</div>
// 						</CardContent>
// 					</Card>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

// export default KnowledgeEditPage;