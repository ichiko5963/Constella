import { getProjects } from '@/server/actions/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { CreateProjectDialog } from './components/create-project-dialog';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Stella | Constella',
    description: 'あなたのコンテキスト（星）を管理',
};

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Star className="w-8 h-8" />
                        Stella
                    </h1>
                    <p className="text-gray-500 mt-1">あなたのコンテキスト（星）を管理</p>
                </div>
                <CreateProjectDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link href={`/projects/${project.id}`} key={project.id} className="group">
                        <Card className="h-full flex flex-col justify-between group-hover:shadow-lg transition-all duration-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-white" />
                                    </div>
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-gray-500 mt-2">
                                    {project.description || '説明がありません。'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-400 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span>作成日: {project.createdAt.toLocaleDateString()}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 -rotate-45 group-hover:rotate-0 transition-all" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-16 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                        <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Stellaがありません</h3>
                        <p className="text-gray-500">最初のStellaを作成して、コンテキストを整理しましょう</p>
                    </div>
                )}
            </div>
        </div>
    );
}
