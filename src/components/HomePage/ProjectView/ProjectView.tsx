// src/pages/projects/ProjectView.tsx
// src/components/HomePage/ProjectView.tsx
// src/components/HomePage/ProjectView.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderPlus, Loader2 } from 'lucide-react';
import { ProjectCard } from '@/components/features/ProjectCard/ProjectCard';
import { CreateProjectModal } from '@/components/features/ProjectModal/CreateProjectModal';
import { Project, CreateProjectInput } from '@/utils/types/project.types';
import { ProjectApiService } from '@/services/database/projectDatabaseApiService';
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

export const ProjectView = () => {
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
	const navigate = useNavigate();

	const projectService = ProjectApiService.getInstance();

	useEffect(() => {
		fetchProjects();
	}, []);

	const fetchProjects = async () => {
		try {
			setLoading(true);
			setError('');
			const fetchedProjects = await projectService.listProjects();
			console.log('Fetched projects:', fetchedProjects); // Debug log
			setProjects(fetchedProjects);
		} catch (err) {
			setError('Failed to load projects. Please try again.');
			console.error('Error fetching projects:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateProject = async (data: CreateProjectInput) => {
		try {
			const newProject = await projectService.createProject(data);
			setProjects((prev) => [newProject, ...prev]);
			setIsCreateModalOpen(false);
			navigate(`/project/${newProject._id}`);
		} catch (err) {
			setError('Failed to create project. Please try again.');
			console.error('Error creating project:', err);
		}
	};

	const handleDeleteProject = async (projectId: string) => {
		try {
			await projectService.deleteProject(projectId);
			setProjects((prev) => prev.filter((p) => p._id !== projectId));
			setProjectToDelete(null);
		} catch (err) {
			setError('Failed to delete project. Please try again.');
			console.error('Error deleting project:', err);
		}
	};

	const handleProjectClick = (project: Project) => {
		console.log('Clicking project:', project); // Debug log
		if (!project._id) {
			console.error('Project ID is undefined:', project);
			return;
		}
		navigate(`/project/${project._id}`);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-2xl font-bold">Your Projects</h1>
				<Button
					onClick={() => setIsCreateModalOpen(true)}
					className="flex items-center"
					size="lg"
				>
					<FolderPlus className="mr-2 h-4 w-4" />
					Create Project
				</Button>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{projects.map((project) => (
					<ProjectCard
						key={project._id}
						project={project}
						onEdit={() => handleProjectClick(project)}
						onDelete={() => setProjectToDelete(project)}
						onClick={() => handleProjectClick(project)}
					/>
				))}
				{projects.length === 0 && !loading && (
					<div className="col-span-full text-center py-8">
						<p className="text-gray-500">
							No projects found. Create your first project to get started!
						</p>
					</div>
				)}
			</div>

			<CreateProjectModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSubmit={handleCreateProject}
			/>

			<AlertDialog
				open={!!projectToDelete}
				onOpenChange={(open) => !open && setProjectToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Project</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this project? This action cannot be undone.
							All associated documents and chat references will be removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => projectToDelete && handleDeleteProject(projectToDelete._id)}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};




// import { useState, useEffect } from 'react';
// import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { FolderPlus, Loader2 } from 'lucide-react';
// import { ProjectCard } from '@/components/features/ProjectCard/ProjectCard';
// import { CreateProjectModal } from '@/components/features/ProjectModal/CreateProjectModal';
// import { Project, CreateProjectInput } from '@/utils/types/project.types';
// import { ProjectApiService } from '@/services/database/projectDatabaseApiService';
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
// import { cn } from '@/lib/utils';

// interface ProjectViewProps {
// 	className?: string;
// }

// export const ProjectView: React.FC<ProjectViewProps> = ({ className }) => {
// 	const [projects, setProjects] = useState<Project[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [error, setError] = useState('');
// 	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
// 	const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

// 	const projectService = ProjectApiService.getInstance();

// 	useEffect(() => {
// 		fetchProjects();
// 	}, []);

// 	const fetchProjects = async () => {
// 		try {
// 			setLoading(true);
// 			setError('');
// 			const fetchedProjects = await projectService.listProjects();
// 			setProjects(fetchedProjects);
// 		} catch (err) {
// 			setError('Failed to load projects. Please try again.');
// 			console.error('Error fetching projects:', err);
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const handleCreateProject = async (data: CreateProjectInput) => {
// 		try {
// 			const newProject = await projectService.createProject(data);
// 			setProjects((prev) => [newProject, ...prev]);
// 		} catch (err) {
// 			setError('Failed to create project. Please try again.');
// 			console.error('Error creating project:', err);
// 		}
// 	};

// 	const handleDeleteProject = async (projectId: string) => {
// 		try {
// 			await projectService.deleteProject(projectId);
// 			setProjects((prev) => prev.filter((p) => p.id !== projectId));
// 			setProjectToDelete(null);
// 		} catch (err) {
// 			setError('Failed to delete project. Please try again.');
// 			console.error('Error deleting project:', err);
// 		}
// 	};

// 	const handleEditProject = (project: Project) => {
// 		console.log('Edit project:', project);
// 	};

// 	if (loading) {
// 		return (
// 			<div className={cn('flex items-center justify-center h-64', className)}>
// 				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className={cn('space-y-6', className)}>
// 			<div className="flex justify-between items-center">
// 				<h1 className="text-2xl font-bold">Your Projects</h1>
// 				<Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center" size="lg">
// 					<FolderPlus className="mr-2 h-4 w-4" />
// 					Create Project
// 				</Button>
// 			</div>

// 			{error && (
// 				<Alert variant="destructive">
// 					<AlertDescription>{error}</AlertDescription>
// 				</Alert>
// 			)}

// 			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// 				{projects.map((project) => (
// 					<ProjectCard
// 						key={project.id}
// 						project={project}
// 						onEdit={handleEditProject}
// 						onDelete={() => setProjectToDelete(project)}
// 					/>
// 				))}
// 				{projects.length === 0 && !loading && (
// 					<div className="col-span-full text-center py-8">
// 						<p className="text-gray-500">No projects found. Create your first project to get started!</p>
// 					</div>
// 				)}
// 			</div>

// 			<CreateProjectModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onSubmit={handleCreateProject} />

// 			<AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Delete Project</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to delete this project? This action cannot be undone. All associated documents and chat references will be removed.
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction onClick={() => projectToDelete && handleDeleteProject(projectToDelete.id)} className="bg-red-500 hover:bg-red-600 text-white">
// 							Delete
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</div>
// 	);
// };

