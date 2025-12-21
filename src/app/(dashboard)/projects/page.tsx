import { getProjects } from '@/server/actions/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from './components/create-project-dialog';

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Projects</h1>
                <CreateProjectDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {project.description || 'No description'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-500">
                                    Created: {project.createdAt.toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No projects found. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
