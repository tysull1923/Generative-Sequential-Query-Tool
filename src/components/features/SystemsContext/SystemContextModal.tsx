// src/components/SystemContext/SystemContextModal.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/shared/dialog';
import { Textarea } from '@/components/ui/textarea';
import { set } from 'mongoose';

interface SystemContextModalProps {
	isOpen: boolean;
	onClose: () => void;
	content: string;
	onSave: (content: string) => void;
	onDelete: () => void;
}

const SystemContextModal: React.FC<SystemContextModalProps> = ({
	isOpen,
	onClose,
	content,
	onSave,
	onDelete
}) => {
	const [temporaryContent, setTemporaryContent] = React.useState(content);

	useEffect(() => {
		setTemporaryContent(content);
	}, [content]);

	const handleSave = () => {
		console.log(temporaryContent);
		onSave(temporaryContent);
		onClose();
	};

	const handleCancel = () => {
		setTemporaryContent(content);
		onClose();
	};

	const handleDelete = () => {
		onDelete();
		setTemporaryContent('');
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle className="flex justify-between items-center">
						<span>System Context</span>
						<Button
							variant="ghost"
							className="h-8 w-8 p-0"
							onClick={handleCancel}
						>
							<X className="h-4 w-4" />
						</Button>
					</DialogTitle>
				</DialogHeader>

				<div className="py-4">
					<Textarea
						value={temporaryContent}
						onChange={(e) => setTemporaryContent(e.target.value)}
						placeholder="Enter system context..."
						className="min-h-[200px] resize-none"
					/>
				</div>

				<DialogFooter className="flex justify-between">
					<div className="flex gap-2">
						{content && (
							<Button
								variant="destructive"
								onClick={handleDelete}
							>
								Delete
							</Button>
						)}
						<Button variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
					</div>
					<Button onClick={handleSave}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SystemContextModal;