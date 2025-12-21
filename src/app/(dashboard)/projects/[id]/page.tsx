import { db } from '@/db';
import { projects, recordings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadRecordingButton } from './components/upload-recording-button';
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
        <div className="p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-gray-500 mt-2">{project.description}</p>
                </div>
                <UploadRecordingButton projectId={projectId} />
            </div>

            <h2 className="text-xl font-semibold mb-4">Recordings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectRecordings.map((rec) => (
                    <Link href={`/dashboard/recordings/${rec.id}`} key={rec.id}>
                        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4 py-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <PlayCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Recording {rec.id}</CardTitle>
                                    <p className="text-xs text-gray-500">
                                        {rec.createdAt.toLocaleDateString()}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="py-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${rec.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            rec.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                rec.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {rec.status}
                                    </span>
                                    {rec.transcription && <FileText className="h-4 w-4" />}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {projectRecordings.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No recordings yet. Upload one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
