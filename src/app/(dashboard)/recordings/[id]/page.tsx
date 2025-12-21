import { db } from '@/db';
import { recordings, meetingNotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, FileText, CheckSquare } from 'lucide-react';

export default async function RecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const recordingId = parseInt(id);

    if (isNaN(recordingId)) return notFound();

    const recording = await db.query.recordings.findFirst({
        where: eq(recordings.id, recordingId),
        with: {
            project: true
        }
    });

    if (!recording) return notFound();

    const note = await db.query.meetingNotes.findFirst({
        where: eq(meetingNotes.recordingId, recordingId),
    });

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href={recording.projectId ? `/dashboard/projects/${recording.projectId}` : '/dashboard/recordings'} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
            </Link>

            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold">Recording {recording.id}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${recording.status === 'completed' ? 'bg-green-100 text-green-700' :
                            recording.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                        }`}>
                        {recording.status}
                    </span>
                </div>
                <p className="text-gray-500">Uploaded on {recording.createdAt.toLocaleDateString()} at {recording.createdAt.toLocaleTimeString()}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Audio & Transcript */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Play className="h-5 w-5" /> Audio Player
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <audio controls className="w-full" src={recording.audioUrl}>
                                Your browser does not support the audio element.
                            </audio>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Transcript
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-96 overflow-y-auto whitespace-pre-wrap text-gray-700 leading-relaxed font-mono text-sm border p-4 rounded-md bg-gray-50">
                            {recording.transcription || (recording.status === 'processing' ? 'Transcribing...' : 'No transcription available.')}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: AI Summary & Action Items */}
                <div className="space-y-8">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5" /> AI Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {note ? (
                                <>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                                        <p className="text-sm text-gray-600">{note.summary}</p>
                                    </div>

                                    {note.decisions && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Decisions</h3>
                                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                {/* Simple JSON parse if needed or just display if string array */}
                                                {/* Ideally we parse in component or use a helper */}
                                                {/* For MVP, assuming valid JSON string -> array if array, or just string */}
                                                <div dangerouslySetInnerHTML={{ __html: JSON.parse(note.decisions as string || '[]').map((d: string) => `<li>${d}</li>`).join('') }} />
                                            </ul>
                                        </div>
                                    )}

                                    {note.actionItems && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Action Items</h3>
                                            <div className="space-y-2">
                                                {JSON.parse(note.actionItems as string || '[]').map((item: any, i: number) => (
                                                    <div key={i} className="flex gap-2 items-start text-sm bg-gray-50 p-2 rounded">
                                                        <input type="checkbox" className="mt-1" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.title}</p>
                                                            <p className="text-xs text-gray-500">By {item.assignee || 'Someone'} due {item.dueDate || 'Soon'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    {recording.status === 'completed' ? 'No summary generated.' : 'AI processing in progress...'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
