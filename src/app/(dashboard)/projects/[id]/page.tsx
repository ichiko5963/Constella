import { db } from '@/db';
import { projects, recordings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadRecordingButton } from './components/upload-recording-button';
import { DeleteProjectButton } from './components/delete-project-button';
import { ProjectSettingsDialog } from './components/project-settings-dialog';
import { RecorderTriggerCard } from '@/components/recording/recorder-trigger-card';
import { FolderTree } from '@/components/file/folder-tree';
import Link from 'next/link';
import { PlayCircle, FileText, Mic } from 'lucide-react';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) return notFound();

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    if (!project) return notFound();

    const projectRecordings = await db.query.recordings.findMany({
        where: eq(recordings.projectId, projectId),
        orderBy: desc(recordings.createdAt),
    });

    const getStatusClassName = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border border-green-200';
            case 'processing':
                return 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse';
            case 'failed':
                return 'bg-red-100 text-red-700 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-600 border border-gray-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{project.name}</h1>
                    <p className="text-gray-500 max-w-2xl">{project.description || "説明がありません"}</p>
                </div>
                <div className="flex gap-2">
                    <ProjectSettingsDialog project={project} />
                    <UploadRecordingButton projectId={projectId} />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Folder Tree */}
                <div className="lg:col-span-1">
                    <FolderTree projectId={projectId} />
                </div>

                {/* Right: Recordings */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Recorder Section */}
                    <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                        <CardContent className="py-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center">
                                    <Mic className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">新しい録音を追加</p>
                                    <p className="text-sm text-gray-500">クリックして録音を開始</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <PlayCircle className="text-gray-700 w-5 h-5" />
                            録音一覧
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projectRecordings.map((rec) => (
                                <Link href={`/recordings/${rec.id}`} key={rec.id} className="group">
                                    <Card className="hover:border-gray-300 transition-all duration-200 hover:shadow-md h-full flex flex-col">
                                        <CardHeader className="flex flex-row items-center gap-4 py-4 border-b border-gray-100">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                                <PlayCircle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm group-hover:text-gray-600 transition-colors">Recording {rec.id}</CardTitle>
                                                <p className="text-xs text-gray-400 font-mono mt-1">
                                                    {rec.createdAt.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-3 flex-1 flex flex-col justify-end">
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getStatusClassName(rec.status || 'uploading')}`}>
                                                    {rec.status || 'uploading'}
                                                </span>
                                                {rec.transcription && rec.transcription.trim() && (
                                                    <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                        <FileText className="h-3 w-3 mr-1 text-gray-600" /> 文字起こし済
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}

                            {projectRecordings.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                                    録音はまだありません
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
