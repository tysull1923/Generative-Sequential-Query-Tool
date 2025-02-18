// // src/components/features/DocumentModal/DocumentModal.tsx
import { useState, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/shared/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import KnowledgeCard from '@/components/features/KnowledgeCard/KnowledgeCard';

interface DocumentsModalProps {
	isOpen: boolean;
	onClose: () => void;
	chatId?: string;
	documents: KnowledgeDocument[];
	ragEnabled: boolean;
	onToggleRAG: (documentId: string, include: boolean) => Promise<void>;
}

const DocumentsModal = ({
	isOpen,
	onClose,
	chatId,
	documents = [],
	ragEnabled,
	onToggleRAG
}: DocumentsModalProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

	const documentService = KnowledgeDocumentApiService.getInstance();

	const handleDelete = async (docId: string) => {
		try {
			await documentService.deleteDocument(docId);
			setDocumentToDelete(null);
		} catch (err) {
			console.error('Error deleting document:', err);
			setError('Failed to delete document');
		}
	};

	const handleReindex = async (docId: string) => {
		try {
			await documentService.reindexDocument(docId);
		} catch (err) {
			console.error('Error reindexing document:', err);
			setError('Failed to reindex document');
		}
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Chat Documents</DialogTitle>
						<DialogDescription>
							Manage documents associated with this chat
							{ragEnabled && " - RAG is enabled for this chat"}
						</DialogDescription>
					</DialogHeader>

					{error && (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<ScrollArea className="flex-1 px-1">
						{isLoading ? (
							<div className="flex justify-center items-center p-8">
								<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
							</div>
						) : (
							<div className="space-y-4 py-4">
								{documents.length === 0 ? (
									<div className="text-center py-8">
										<FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
										<p className="text-gray-500">No documents found</p>
										<p className="text-sm text-gray-400">
											Attach files to this chat to see them here
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{documents.map((doc) => (
											<KnowledgeCard
												key={doc._id}
												document={doc}
												onDelete={() => setDocumentToDelete(doc._id)}
												onReindex={() => handleReindex(doc._id)}
												ragEnabled={ragEnabled}
												onToggleRAG={onToggleRAG}
											/>
										))}
									</div>
								)}
							</div>
						)}
					</ScrollArea>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={!!documentToDelete}
				onOpenChange={() => setDocumentToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Document</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this document? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => documentToDelete && handleDelete(documentToDelete)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default DocumentsModal;



// import { useState, useEffect } from 'react';
// import { Loader2, FileText } from 'lucide-react';
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogDescription,
// } from '@/components/shared/dialog';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
// import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// } from '@/components/ui/Alert-dialog';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import KnowledgeCard from '@/components/features/KnowledgeCard/KnowledgeCard';

// interface DocumentsModalProps {
// 	isOpen: boolean;
// 	onClose: () => void;
// 	chatId?: string;
// 	projectId?: string;
// }

// const DocumentsModal = ({ isOpen, onClose, chatId, projectId }: DocumentsModalProps) => {
// 	const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [error, setError] = useState<string | null>(null);
// 	const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

// 	const documentService = KnowledgeDocumentApiService.getInstance();

// 	useEffect(() => {
// 		if (isOpen && chatId) {
// 			console.log("Fetching documents for chat:", chatId);
// 			fetchDocuments();
// 		}
// 	}, [isOpen, chatId, projectId]);

// 	const fetchDocuments = async () => {
// 		if (!chatId) return;

// 		try {
// 			setIsLoading(true);
// 			const docs = await documentService.getChatDocuments(chatId, projectId);
// 			setDocuments(docs);
// 			setError(null);
// 		} catch (err) {
// 			console.error('Error fetching documents:', err);
// 			setError('Failed to load documents');
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	};

// 	const handleDelete = async (docId: string) => {
// 		try {
// 			await documentService.deleteDocument(docId);
// 			setDocuments(docs => docs.filter(d => d._id !== docId));
// 			setDocumentToDelete(null);
// 		} catch (err) {
// 			console.error('Error deleting document:', err);
// 			setError('Failed to delete document');
// 		}
// 	};

// 	const handleReindex = async (docId: string) => {
// 		try {
// 			await documentService.reindexDocument(docId);
// 			await fetchDocuments(); // Refresh the documents list
// 		} catch (err) {
// 			console.error('Error reindexing document:', err);
// 			setError('Failed to reindex document');
// 		}
// 	};

// 	return (
// 		<>
// 			<Dialog open={isOpen} onOpenChange={onClose}>
// 				<DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
// 					<DialogHeader>
// 						<DialogTitle>Chat Documents</DialogTitle>
// 						<DialogDescription>
// 							Manage documents associated with this chat
// 						</DialogDescription>
// 					</DialogHeader>

// 					{error && (
// 						<Alert variant="destructive" className="mt-4">
// 							<AlertDescription>{error}</AlertDescription>
// 						</Alert>
// 					)}

// 					<ScrollArea className="flex-1 px-1">
// 						{isLoading ? (
// 							<div className="flex justify-center items-center p-8">
// 								<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
// 							</div>
// 						) : (
// 							<div className="space-y-4 py-4">
// 								{documents.length === 0 ? (
// 									<div className="text-center py-8">
// 										<FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
// 										<p className="text-gray-500">No documents found</p>
// 										<p className="text-sm text-gray-400">
// 											Attach files to this chat to see them here
// 										</p>
// 									</div>
// 								) : (
// 									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// 										{documents.map((doc) => (
// 											<KnowledgeCard
// 												key={doc._id}
// 												document={doc}
// 												onDelete={() => setDocumentToDelete(doc._id)}
// 												onReindex={() => handleReindex(doc._id)}
// 											/>
// 										))}
// 									</div>
// 								)}
// 							</div>
// 						)}
// 					</ScrollArea>
// 				</DialogContent>
// 			</Dialog>

// 			<AlertDialog
// 				open={!!documentToDelete}
// 				onOpenChange={() => setDocumentToDelete(null)}
// 			>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Delete Document</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to delete this document? This action cannot be undone.
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction
// 							onClick={() => documentToDelete && handleDelete(documentToDelete)}
// 							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
// 						>
// 							Delete
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</>
// 	);
// };

// export default DocumentsModal;





// // src/components/features/DocumentsModal/DocumentsModal.tsx
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { format } from 'date-fns';
// import { Loader2, FileText, Trash2, ExternalLink } from 'lucide-react';
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogDescription,
// } from '@/components/shared/dialog';
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardFooter,
// 	CardHeader,
// 	CardTitle,
// } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';
// import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// } from '@/components/ui/Alert-dialog';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Badge } from '@/components/ui/badge';

// interface DocumentsModalProps {
// 	documents?: initialDocuments;
// 	isOpen: boolean;
// 	onClose: () => void;
// 	chatId?: string;
// 	projectId?: string;
// }

// const DocumentsModal = ({ isOpen, onClose, chatId, projectId }: DocumentsModalProps) => {
// 	const [documents, setDocuments] = useState<KnowledgeDocument[]>();
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [error, setError] = useState<string | null>(null);
// 	const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
// 	const navigate = useNavigate();

// 	const documentService = KnowledgeDocumentApiService.getInstance();

// 	useEffect(() => {
// 		if (isOpen && chatId && projectId) {
// 			console.log("Here");
// 			fetchDocuments();
// 		}
// 	}, [isOpen, chatId, projectId]);

// 	const fetchDocuments = async () => {
// 		if (!projectId || !chatId) return;

// 		try {
// 			setIsLoading(true);
// 			console.log("Fetching documents for chatId:", chatId, "and projectId:", projectId);
// 			const docs = await documentService.getChatDocuments(chatId, projectId);
// 			setDocuments(docs);
// 			setError(null);
// 		} catch (err) {
// 			console.error('Error fetching documents:', err);
// 			setError('Failed to load documents');
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	};

// 	const handleEdit = (docId: string) => {
// 		navigate(`/knowledge/edit/${docId}`, {
// 			state: {
// 				projectId,
// 				returnPath: window.location.pathname
// 			}
// 		});
// 	};

// 	const handleDelete = async (docId: string) => {
// 		try {
// 			await documentService.deleteDocument(docId);
// 			setDocuments(docs => docs.filter(d => d._id !== docId));
// 			setDocumentToDelete(null);
// 		} catch (err) {
// 			console.error('Error deleting document:', err);
// 			setError('Failed to delete document');
// 		}
// 	};
// 	// const filteredDocuments = documents.filter(document => {
// 	// 	console.log("filtered");
// 	// 	const matchesSearch = document?.title?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false;
// 	// 	const matchesType = filterType === 'all';
// 	// 	return matchesSearch && matchesType;
// 	// });
// 	const getFileIcon = (fileType?: string) => {
// 		if (!fileType) return <FileText className="h-4 w-4" />;

// 		// Add more file type icons as needed
// 		switch (fileType.toLowerCase()) {
// 			case 'text/plain':
// 				return <FileText className="h-4 w-4" />;
// 			default:
// 				return <FileText className="h-4 w-4" />;
// 		}
// 	};

// 	return (
// 		<>
// 			<Dialog open={isOpen} onOpenChange={onClose}>
// 				<DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
// 					<DialogHeader>
// 						<DialogTitle>Chat Documents</DialogTitle>
// 						<DialogDescription>
// 							Manage documents associated with this chat
// 						</DialogDescription>
// 					</DialogHeader>

// 					{error && (
// 						<Alert variant="destructive" className="mt-4">
// 							<AlertDescription>{error}</AlertDescription>
// 						</Alert>
// 					)}

// 					<ScrollArea className="flex-1 px-1">
// 						{/* {isLoading ? (
// 							<div className="flex justify-center items-center p-8">
// 								<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
// 							</div>
// 						) : (
// 							<div className="space-y-4 py-4">
// 								{documents.length === 0 ? (
// 									<div className="text-center py-8">
// 										<FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
// 										<p className="text-gray-500">No documents found</p>
// 										<p className="text-sm text-gray-400">
// 											Attach files to this chat to see them here
// 										</p>
// 									</div>
// 								) : (
// 									documents.map((doc) => (
// 										<Card key={doc._id} className="group">
// 											<CardHeader className="flex flex-row items-start justify-between">
// 												<div className="flex items-start gap-4">
// 													{getFileIcon(doc.metadata?.fileType)}
// 													<div>
// 														<CardTitle className="text-base">{doc.title}</CardTitle>
// 														<CardDescription>
// 															Added {format(new Date(doc.addedAt), 'PPP')}
// 														</CardDescription>
// 													</div>
// 												</div>
// 												<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
// 													<Button
// 														variant="outline"
// 														size="sm"
// 														onClick={() => handleEdit(doc._id)}
// 														className="flex items-center gap-1"
// 													>
// 														<ExternalLink className="h-4 w-4" />
// 														Edit
// 													</Button>
// 													<Button
// 														variant="destructive"
// 														size="sm"
// 														onClick={() => setDocumentToDelete(doc._id)}
// 														className="flex items-center gap-1"
// 													>
// 														<Trash2 className="h-4 w-4" />
// 														Delete
// 													</Button>
// 												</div>
// 											</CardHeader>
// 											<CardContent>
// 												<div className="flex items-center gap-2 text-sm text-gray-500">
// 													<Badge variant="secondary" className="capitalize">
// 														{doc.metadata?.fileType?.split('/')[1] || 'unknown'}
// 													</Badge>
// 													{doc.metadata?.fileSize && (
// 														<span>
// 															{Math.round(doc.metadata.fileSize / 1024)} KB
// 														</span>
// 													)}
// 												</div>
// 											</CardContent>
// 											<CardFooter>
// 												<p className="text-sm text-gray-500">
// 													Last updated: {format(new Date(doc.lastUpdated), 'PPP')}
// 												</p>
// 											</CardFooter>
// 										</Card>
// 									))
// 								)}
// 							</div>
// 						)} */}
// 						{/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 							{filteredDocuments.map((doc) => (
// 								<KnowledgeCard
// 									key={doc._id}
// 									document={doc}
// 									onDelete={onRemoveDocument ? () => onRemoveDocument(doc._id) : undefined}
// 									onReindex={onReindexDocument ? () => onReindexDocument(doc._id) : undefined}
// 								/>
// 							))}
// 							{filteredDocuments.length === 0 && !uploadState.isUploading && (
// 								<div className="col-span-full text-center py-8">
// 									<p className="text-gray-500">No documents found. Add documents to get started!</p>
// 								</div>
// 							)}
// 						</div> */}
// 					</ScrollArea>
// 				</DialogContent>
// 			</Dialog>

// 			<AlertDialog
// 				open={!!documentToDelete}
// 				onOpenChange={() => setDocumentToDelete(null)}
// 			>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Delete Document</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to delete this document? This action cannot be undone.
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction
// 							onClick={() => documentToDelete && handleDelete(documentToDelete)}
// 							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
// 						>
// 							Delete
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</>
// 	);
// };

// export default DocumentsModal;