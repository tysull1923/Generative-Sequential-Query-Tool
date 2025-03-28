// src/components/Project/KnowledgeBase/KnowledgeBasePanel.tsx
import { useState, useCallback, useEffect } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/Input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import KnowledgeCard from "@/components/features/KnowledgeCard/KnowledgeCard"
import type { KnowledgeBasePanelProps, UploadState } from "./KnowledgeBasePanel.types"
import { KnowledgeDocumentApiService } from "@/services/database/knowledgeDocumentApiService"
import { ProjectApiService } from "@/services/database/projectDatabaseApiService"
import { getDocument } from 'pdfjs-dist'
import { KnowledgeDocument } from "@/utils/types/KnowledgeBase.types"
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
	projectId,
	documents: initialDocuments,
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
	const projectService = ProjectApiService.getInstance();
	const documentService = KnowledgeDocumentApiService.getInstance();
	const [documents, setDocuments] = useState<KnowledgeDocument[]>(initialDocuments);


	const [filterType, setFilterType] = useState<'all'>('all');
	useEffect(() => {
		fetchProjectDocuments();
	}, [projectId]);

	const fetchProjectDocuments = async () => {
		try {
			const projectDocs = await documentService.getProjectDocuments(projectId);
			setDocuments(projectDocs);
		} catch (error) {
			console.error('Error fetching documents:', error);
			setDocuments([]);
		}// } finally {
		// 	setLoading(false);
		// }
	};

	// Helper function to categorize document types
	const getDocumentType = (filename: string): string => {
		const ext = filename.split(".").pop()?.toLowerCase() || ""
		if (ext === "pdf") return "pdf"
		if (ext === "doc" || ext === "docx") return "word"
		if (ext === "xls" || ext === "xlsx") return "excel"
		if (["java", "ts", "js", "py", "cpp", "cs", "html", "css", "json"].includes(ext)) return "code"
		return "text"
	}

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
					
					// Handle Word documents (.doc, .docx)
					else if (fileType === "docx" || fileType === "doc") {
						const result = await mammoth.extractRawText({
							arrayBuffer: e.target!.result as ArrayBuffer
						})
						content = result.value
					}
					
					// Handle Excel files (.xls, .xlsx)
					else if (fileType === "xlsx" || fileType === "xls") {
						const data = new Uint8Array(e.target!.result as ArrayBuffer)
						const workbook = XLSX.read(data, { type: 'array' })
						let excelText = ""
						
						// Process each sheet
						workbook.SheetNames.forEach(sheetName => {
							const worksheet = workbook.Sheets[sheetName]
							excelText += `# Sheet: ${sheetName}\n\n`
							
							// Convert sheet to JSON and then to text
							const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
							json.forEach(row => {
								if (Array.isArray(row)) {
									excelText += row.join('\t') + '\n'
								}
							})
							
							excelText += '\n\n'
						})
						
						content = excelText
					}

					// Wrap code files in a code block
					const codeFileExtensions = ["java", "ts", "js", "py", "cpp", "cs", "html", "css", "json"]
					if (codeFileExtensions.includes(fileType)) {
						content = `\`\`\`${fileType}\n${content}\n\`\`\``
					}

					resolve(content)
				} catch (error) {
					console.error("Error processing file:", error)
					reject(error)
				}
			}

			reader.onerror = () => reject(reader.error)

			// Read file based on type
			if (file.name.endsWith(".pdf") || 
				file.name.endsWith(".docx") || 
				file.name.endsWith(".doc") ||
				file.name.endsWith(".xlsx") ||
				file.name.endsWith(".xls")) {
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
						extension: file.name.split(".").pop()?.toLowerCase(),
						docType: getDocumentType(file.name)
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
	// const filteredDocuments = documents.filter(doc =>
	// 	doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
	// 	doc.source.toLowerCase().includes(searchQuery.toLowerCase())
	// )

	const filteredDocuments = documents.filter(document => {
		console.log("filtered");
		const matchesSearch = document?.title?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false;
		const matchesType = filterType === 'all';
		return matchesSearch && matchesType;
	});

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
						accept=".txt,.md,.pdf,.java,.ts,.js,.py,.cpp,.cs,.html,.css,.json,.doc,.docx,.xls,.xlsx"
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