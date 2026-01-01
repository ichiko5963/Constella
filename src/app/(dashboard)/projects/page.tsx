import { getProjects } from '@/server/actions/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from './components/create-project-dialog';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contexts',
    description: 'コンテキストと録音を管理',
};

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">コンテキスト</h1>
                    <p className="text-gray-400">ナレッジコンテキストと録音を管理</p>
                </div>
                <CreateProjectDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link href={`/projects/${project.id}`} key={project.id} className="group">
                        <Card className="glass border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full flex flex-col justify-between">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-semibold text-white group-hover:text-primary transition-colors flex justify-between items-start">
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-gray-400 mt-2">
                                    {project.description || '説明がありません。'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-500 font-mono pt-4 border-t border-white/5 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                                    作成日: {project.createdAt.toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-black/20 glass rounded-xl border border-dashed border-white/10">
                        <p className="text-gray-400">コンテキストが見つかりません。最初のコンテキストを作成しましょう！</p>
                    </div>
                )}
            </div>
        </div>
    );
}
