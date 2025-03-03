// src/components/Banner/MainBanner/NewProjectDropdown.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	FolderPlus,
	ChevronDown,
	FileText,
	Code,
	Database,
	BookOpen
} from 'lucide-react';

interface NewProjectDropdownProps {
	onNewProject: (type: string) => void;
	className?: string;
}

const NewProjectDropdown: React.FC<NewProjectDropdownProps> = ({
	onNewProject,
	className = ''
}) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="flex items-center gap-2">
					<FolderPlus className="h-4 w-4" />
					New Project
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => onNewProject('documentation')}>
						<FileText className="h-4 w-4 mr-2" />
						Documentation Project
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onNewProject('code')}>
						<Code className="h-4 w-4 mr-2" />
						Code Project
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onNewProject('data')}>
						<Database className="h-4 w-4 mr-2" />
						Data Analysis Project
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onNewProject('research')}>
						<BookOpen className="h-4 w-4 mr-2" />
						Research Project
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NewProjectDropdown;