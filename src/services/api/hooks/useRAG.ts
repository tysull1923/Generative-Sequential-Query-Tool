// src/hooks/useRAG.ts
import { useState } from 'react';
import { RAGApiService } from '@/services/rag/ragApiService';
import { KnowledgeDocumentApiService } from '@/services/database/knowledgeDocumentApiService';
import { RAGSettings, RAGQueryResult } from '@/utils/types/project.types';
import { KnowledgeDocument } from '@/utils/types/KnowledgeBase.types';

export const useRAG = (containerId: string | null, containerType: 'chat' | 'project') => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeDocuments, setActiveDocuments] = useState<KnowledgeDocument[]>([]);

	const ragService = RAGApiService.getInstance();
	const documentService = KnowledgeDocumentApiService.getInstance();

	const addDocument = async (document: KnowledgeDocument, settings: RAGSettings) => {
		if (!containerId) return;

		try {
			setIsProcessing(true);
			await ragService.addDocument(containerId, document, settings);
			setActiveDocuments(prev => [...prev, document]);
		} catch (error) {
			console.error('Error adding document to RAG:', error);
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	const removeDocument = async (documentId: string) => {
		if (!containerId) return;

		try {
			setIsProcessing(true);
			await ragService.removeDocument(containerId, documentId);
			setActiveDocuments(prev => prev.filter(doc => doc._id !== documentId));
		} catch (error) {
			console.error('Error removing document from RAG:', error);
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	const queryDocuments = async (query: string, settings: RAGSettings): Promise<RAGQueryResult> => {
		if (!containerId) {
			throw new Error('No container ID provided for RAG query');
		}

		try {
			setIsProcessing(true);
			return await ragService.query(containerId, query, settings);
		} catch (error) {
			console.error('Error querying RAG system:', error);
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	const loadDocuments = async () => {
		if (!containerId) return [];

		try {
			setIsProcessing(true);
			const documents = await documentService.getChatDocuments(containerId, {
				includeInRAG: true
			});
			setActiveDocuments(documents);
			return documents;
		} catch (error) {
			console.error('Error loading RAG documents:', error);
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	const toggleDocument = async (documentId: string, include: boolean) => {
		if (!containerId) return;

		try {
			setIsProcessing(true);
			await ragService.toggleDocumentInclusion(containerId, documentId, include);
			if (include) {
				const document = await documentService.getDocument(documentId);
				setActiveDocuments(prev => [...prev, document]);
			} else {
				setActiveDocuments(prev => prev.filter(doc => doc._id !== documentId));
			}
		} catch (error) {
			console.error('Error toggling document inclusion:', error);
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	return {
		addDocument,
		removeDocument,
		queryDocuments,
		loadDocuments,
		toggleDocument,
		isProcessing,
		activeDocuments
	};
};