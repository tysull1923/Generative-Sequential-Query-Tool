// src/components/Project/ProjectHeader/ProjectHeader.types.ts

import { ProjectStatus } from '@/utils/types/project.types';

export interface ProjectHeaderProps {
	/**
	 * The title of the project
	 */
	title: string;

	/**
	 * Current status of the project
	 */
	status: ProjectStatus;

	/**
	 * Callback function to update project details
	 * @param updates Object containing title and/or status updates
	 */
	onUpdateProject: (updates: {
		title?: string;
		status?: ProjectStatus
	}) => Promise<void>;

	/**
	 * Callback function to open project settings
	 */
	onOpenSettings: () => void;

	/**
	 * Optional CSS className for styling
	 */
	className?: string;
}

export interface StatusDialogProps {
	/**
	 * Whether the dialog is visible
	 */
	isOpen: boolean;

	/**
	 * The status being changed to
	 */
	newStatus: ProjectStatus;

	/**
	 * Callback when the dialog is closed
	 */
	onClose: () => void;

	/**
	 * Callback when status change is confirmed
	 */
	onConfirm: () => void;
}

export interface StatusConfig {
	/**
	 * Display text for the status
	 */
	text: string;

	/**
	 * CSS color class for the status
	 */
	color: string;

	/**
	 * Icon component for the status
	 */
	icon: React.ComponentType;
}