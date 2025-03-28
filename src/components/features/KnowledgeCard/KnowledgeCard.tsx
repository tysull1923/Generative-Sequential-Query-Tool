import type React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Trash2, ExternalLink, RefreshCw, ChevronDown, Database } from "lucide-react"
import { format } from "date-fns"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import type { DocumentCardProps } from "@/utils/types/KnowledgeBase.types"

interface ExtendedDocumentCardProps extends DocumentCardProps {
	ragEnabled?: boolean;
	onToggleRAG?: (documentId: string, include: boolean) => Promise<void>;
}

const KnowledgeCard: React.FC<ExtendedDocumentCardProps> = ({
	document,
	onDelete,
	onReindex,
	className = "",
	ragEnabled,
	onToggleRAG
}) => {
	const navigate = useNavigate()

	const handleCardClick = () => {
		if (!document._id) {
			console.error("Document id is undefined:", document)
			return
		}
		navigate(`/knowledge/${document._id}`, {
			state: { document, projectId: document.projectId },
		})
	}

	const handleAction = async (e: React.MouseEvent, action: () => void | Promise<void>) => {
		e.stopPropagation()
		await action()
	}

	if (!document || !document._id) {
		console.error("Invalid document:", document)
		return null
	}

	return (
		<Card
			className={`flex flex-col hover:shadow-lg transition-shadow cursor-pointer ${className}`}
			onClick={handleCardClick}
		>
			<CardHeader>
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<CardTitle className="text-lg flex items-center gap-2">
							<FileText className="h-4 w-4" />
							{document.title}
						</CardTitle>
						<p className="text-sm text-gray-500">Added {format(new Date(document.addedAt), "MMM d, yyyy")}</p>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
							<Button variant="ghost" size="sm">
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={(e) => handleAction(e, () => navigate(`/knowledge/${document._id}`))}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Edit Content
							</DropdownMenuItem>
							{onReindex && (
								<DropdownMenuItem
									onClick={(e) => handleAction(e, () => onReindex())}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Reindex
								</DropdownMenuItem>
							)}
							{ragEnabled && onToggleRAG && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={(e) => handleAction(e, () => onToggleRAG(document._id, !document.includeInRAG))}
									>
										<Database className="h-4 w-4 mr-2" />
										{document.includeInRAG ? 'Exclude from RAG' : 'Include in RAG'}
									</DropdownMenuItem>
								</>
							)}
							{onDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-red-600"
										onClick={(e) => handleAction(e, () => onDelete())}
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{/* Chunks badge - more detailed info */}
					<Badge variant="secondary" className="flex items-center gap-1">
						<FileText className="h-3 w-3" />
						{document.chunks?.length || 0} chunks
					</Badge>

					{/* Source badge */}
					<Badge variant="secondary">{document.source}</Badge>

					{/* Enhanced RAG status badge with clear visual indication */}
					<Badge
						variant={ragEnabled && document.includeInRAG ? "default" : "secondary"}
						className={`flex items-center gap-1 ${!ragEnabled ? "opacity-50" : document.includeInRAG ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
					>
						<Database className={`h-3 w-3 ${document.includeInRAG ? "text-green-600" : "text-gray-600"}`} />
						{!ragEnabled ? 'RAG Disabled' :
							document.includeInRAG 
								? `In RAG (${document.chunks?.length || 0} chunks)` 
								: 'Not in RAG'}
					</Badge>
					
					{/* Collection ID badge - only show if document is in RAG */}
					{document.ragCollectionId && document.includeInRAG && (
						<Badge variant="outline" className="flex items-center gap-1 text-xs border-dashed">
							<Database className="h-3 w-3" />
							{document.metadata?.containerName || document.ragCollectionId}
						</Badge>
					)}
				</div>
			</CardContent>
			<CardFooter className="text-sm text-gray-500 mt-auto">
				Last updated {format(new Date(document.lastUpdated), "MMM d, yyyy")}
			</CardFooter>
		</Card>
	)
}

export default KnowledgeCard