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
import { PlayCircle, FileText } from 'lucide-react';

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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{project.name}</h1>
                    <p className="text-gray-400 max-w-2xl">{project.description || "No description provided."}</p>
                </div>
                <div className="flex gap-2">
                    <ProjectSettingsDialog project={project} />
                    <UploadRecordingButton projectId={projectId} />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Folder Tree */}
                <div className="lg:col-span-1">
                    <FolderTree projectId={projectId} />
                </div>

                {/* Right: Recordings */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Recorder Section */}
                    <div className="w-full">
                        <RecorderTriggerCard projectId={projectId} />
                    </div>

                    <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <PlayCircle className="text-primary w-5 h-5" />
                    Recordings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projectRecordings.map((rec) => (
                        <Link href={`/recordings/${rec.id}`} key={rec.id} className="group">
                            <Card className="glass border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full flex flex-col">
                                <CardHeader className="flex flex-row items-center gap-4 py-6 border-b border-white/5">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,212,170,0.2)]">
                                        <PlayCircle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-white group-hover:text-primary transition-colors">Recording {rec.id}</CardTitle>
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {rec.createdAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-4 flex-1 flex flex-col justify-end">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${rec.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            rec.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                                                rec.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-white/5 text-gray-400 border border-white/5'
                                            }`}>
                                            {rec.status}
                                        </span>
                                        {rec.transcription && (
                                            <div className="flex items-center text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                                                <FileText className="h-3 w-3 mr-1 text-primary" /> Transcribed
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {projectRecordings.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-500 text-sm">
                            Recordings will appear here after processing.
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
}
