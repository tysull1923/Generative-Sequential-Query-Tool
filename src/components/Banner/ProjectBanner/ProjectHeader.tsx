// src/components/Project/ProjectHeader/ProjectHeader.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Settings,
	Edit2,
	Archive,
	CheckCircle,
	Activity,
	Share2,
	MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
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
import { ProjectStatus } from '@/utils/types/project.types';

interface ProjectHeaderProps {
	title: string;
	status: ProjectStatus;
	onUpdateProject: (updates: { title?: string; status?: ProjectStatus }) => Promise<void>;
	onOpenSettings: () => void;
	className?: string;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
	title,
	status,
	onUpdateProject,
	onOpenSettings,
	className = ''
}) => {
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [titleInput, setTitleInput] = useState(title);
	const [showStatusDialog, setShowStatusDialog] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | null>(null);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		setTitleInput(title);
	}, [title]);

	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, [isEditingTitle]);

	const handleTitleSubmit = async () => {
		if (titleInput.trim() !== title) {
			await onUpdateProject({ title: titleInput.trim() });
		}
		setIsEditingTitle(false);
	};

	const handleTitleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleTitleSubmit();
		} else if (e.key === 'Escape') {
			setTitleInput(title);
			setIsEditingTitle(false);
		}
	};

	const getStatusIcon = (status: ProjectStatus) => {
		switch (status) {
			case ProjectStatus.ACTIVE:
				return <Activity className="h-4 w-4 text-green-500" />;
			case ProjectStatus.ARCHIVED:
				return <Archive className="h-4 w-4 text-gray-500" />;
			case ProjectStatus.COMPLETED:
				return <CheckCircle className="h-4 w-4 text-blue-500" />;
		}
	};

	const getStatusText = (status: ProjectStatus) => {
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	};

	const handleStatusChange = async (newStatus: ProjectStatus) => {
		setSelectedStatus(newStatus);
		setShowStatusDialog(true);
	};

	const confirmStatusChange = async () => {
		if (selectedStatus) {
			await onUpdateProject({ status: selectedStatus });
			setShowStatusDialog(false);
			setSelectedStatus(null);
		}
	};

	return (
		<header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					{/* Left section - Title */}
					<div className="flex-1">
						{isEditingTitle ? (
							<input
								ref={titleInputRef}
								type="text"
								value={titleInput}
								onChange={(e) => setTitleInput(e.target.value)}
								onBlur={handleTitleSubmit}
								onKeyDown={handleTitleKeyDown}
								className="text-2xl font-bold bg-white border-b-2 border-blue-500 focus:outline-none px-1 py-1 w-full max-w-xl"
							/>
						) : (
							<div
								className="flex items-center gap-2 cursor-pointer group"
								onClick={() => setIsEditingTitle(true)}
							>
								<h1 className="text-2xl font-bold">{title}</h1>
								<Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
							</div>
						)}
					</div>

					{/* Right section - Actions */}
					<div className="flex items-center space-x-4">
						{/* Status Indicator & Selector */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="flex items-center gap-2"
								>
									{getStatusIcon(status)}
									<span>{getStatusText(status)}</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{Object.values(ProjectStatus).map((statusOption) => (
									<DropdownMenuItem
										key={statusOption}
										onClick={() => handleStatusChange(statusOption)}
										className="flex items-center gap-2"
									>
										{getStatusIcon(statusOption)}
										{getStatusText(statusOption)}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Settings Button */}
						<Button
							variant="ghost"
							size="icon"
							onClick={onOpenSettings}
							className="hover:bg-gray-100"
						>
							<Settings className="h-5 w-5" />
						</Button>

						{/* More Actions */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<MoreVertical className="h-5 w-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem className="flex items-center gap-2">
									<Share2 className="h-4 w-4" />
									Share Project
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-red-600 focus:text-red-600"
									onClick={() => handleStatusChange(ProjectStatus.ARCHIVED)}
								>
									<Archive className="h-4 w-4 mr-2" />
									Archive Project
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			{/* Status Change Confirmation Dialog */}
			<AlertDialog
				open={showStatusDialog}
				onOpenChange={() => {
					setShowStatusDialog(false);
					setSelectedStatus(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Change Project Status</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to change the project status to{' '}
							{selectedStatus ? getStatusText(selectedStatus) : ''}?
							{selectedStatus === ProjectStatus.ARCHIVED &&
								' Archived projects will be moved to the archive section.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmStatusChange}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</header>
	);
};

export default ProjectHeader;