// src/components/Project/RAGSettings/RAGSettingsModal.tsx

import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/shared/dialog';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { RAGSettings } from '@/utils/types/project.types';

interface RAGSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	settings: RAGSettings;
	onUpdateSettings: (settings: RAGSettings) => Promise<void>;
}

const EMBEDDING_MODELS = [
	{ id: 'openai-ada-002', name: 'OpenAI Ada 002', dimensions: 1536 },
	{ id: 'openai-text-003', name: 'OpenAI Text 003', dimensions: 1536 },
	{ id: 'cohere-embed-multilingual', name: 'Cohere Multilingual', dimensions: 1024 },
];

const RAGSettingsModal: React.FC<RAGSettingsModalProps> = ({
	isOpen,
	onClose,
	settings,
	onUpdateSettings,
}) => {
	const [localSettings, setLocalSettings] = useState<RAGSettings>(settings);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		try {
			setIsSaving(true);
			await onUpdateSettings(localSettings);
			onClose();
		} catch (error) {
			console.error('Error saving RAG settings:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const updateSettings = (updates: Partial<RAGSettings>) => {
		setLocalSettings(prev => ({
			...prev,
			...updates,
		}));
	};

	return (
		<Dialog open={isOpen} onOpenChange={() => onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>RAG System Settings</DialogTitle>
					<DialogDescription>
						Configure how documents are processed and retrieved in the RAG system.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="chunking" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="chunking">Chunking</TabsTrigger>
						<TabsTrigger value="embedding">Embedding</TabsTrigger>
						<TabsTrigger value="retrieval">Retrieval</TabsTrigger>
					</TabsList>

					{/* Chunking Settings */}
					<TabsContent value="chunking">
						<Card>
							<CardHeader>
								<CardTitle>Document Chunking</CardTitle>
								<CardDescription>
									Configure how documents are split into chunks for processing.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label>Chunk Size (tokens)</Label>
									<div className="flex items-center gap-4">
										<Slider
											value={[localSettings.chunkSize]}
											onValueChange={([value]) => updateSettings({ chunkSize: value })}
											min={100}
											max={2000}
											step={50}
											className="flex-1"
										/>
										<Input
											type="number"
											value={localSettings.chunkSize}
											onChange={(e) => updateSettings({ chunkSize: parseInt(e.target.value) })}
											className="w-20"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Chunk Overlap (tokens)</Label>
									<div className="flex items-center gap-4">
										<Slider
											value={[localSettings.chunkOverlap]}
											onValueChange={([value]) => updateSettings({ chunkOverlap: value })}
											min={0}
											max={200}
											step={10}
											className="flex-1"
										/>
										<Input
											type="number"
											value={localSettings.chunkOverlap}
											onChange={(e) => updateSettings({ chunkOverlap: parseInt(e.target.value) })}
											className="w-20"
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Embedding Settings */}
					<TabsContent value="embedding">
						<Card>
							<CardHeader>
								<CardTitle>Embedding Model</CardTitle>
								<CardDescription>
									Select the model used to create embeddings for document chunks.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label>Model</Label>
									<Select
										value={localSettings.embedding.model}
										onValueChange={(value) => {
											const model = EMBEDDING_MODELS.find(m => m.id === value);
											if (model) {
												updateSettings({
													embedding: {
														model: value,
														dimensions: model.dimensions
													}
												});
											}
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select embedding model" />
										</SelectTrigger>
										<SelectContent>
											{EMBEDDING_MODELS.map((model) => (
												<SelectItem key={model.id} value={model.id}>
													{model.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-sm text-muted-foreground">
										Vector dimensions: {localSettings.embedding.dimensions}
									</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Retrieval Settings */}
					<TabsContent value="retrieval">
						<Card>
							<CardHeader>
								<CardTitle>Retrieval Settings</CardTitle>
								<CardDescription>
									Configure how documents are retrieved and ranked.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label>Similarity Threshold</Label>
									<div className="flex items-center gap-4">
										<Slider
											value={[localSettings.similarity.threshold * 100]}
											onValueChange={([value]) =>
												updateSettings({
													similarity: {
														...localSettings.similarity,
														threshold: value / 100
													}
												})
											}
											min={0}
											max={100}
											step={1}
											className="flex-1"
										/>
										<span className="w-16 text-right">
											{(localSettings.similarity.threshold * 100).toFixed(0)}%
										</span>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Maximum Results</Label>
									<div className="flex items-center gap-4">
										<Slider
											value={[localSettings.similarity.maxResults]}
											onValueChange={([value]) =>
												updateSettings({
													similarity: {
														...localSettings.similarity,
														maxResults: value
													}
												})
											}
											min={1}
											max={20}
											step={1}
											className="flex-1"
										/>
										<Input
											type="number"
											value={localSettings.similarity.maxResults}
											onChange={(e) =>
												updateSettings({
													similarity: {
														...localSettings.similarity,
														maxResults: parseInt(e.target.value)
													}
												})
											}
											className="w-20"
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RAGSettingsModal;