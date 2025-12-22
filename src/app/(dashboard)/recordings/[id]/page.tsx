import { db } from '@/db';
import { recordings, meetingNotes, taskCandidates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { NoteViewerWithEditor } from '@/components/note/note-viewer-with-editor';
import { TaskReviewer } from '@/components/task/task-reviewer';
import { RecordingDetailClient } from '@/components/recording/recording-detail-client';
import { MindMapViewer } from '@/components/mindmap/mindmap-viewer';

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

    const candidates = await db.query.taskCandidates.findMany({
        where: (c, { and, eq, isNull }) => and(
            eq(c.recordingId, recordingId),
            isNull(c.isApproved)
        )
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <Link
                    href={recording.projectId ? `/projects/${recording.projectId}` : '/recordings'}
                    className="flex items-center text-gray-400 hover:text-white transition-colors mb-4 group"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to {recording.projectId ? 'Project' : 'Recordings'}
                </Link>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${recording.status === 'completed' ? 'bg-primary/20 text-primary border border-primary/20' :
                        recording.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20 animate-pulse' :
                            'bg-white/10 text-gray-400 border border-white/10'
                        }`}>
                        {recording.status}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                        {recording.createdAt.toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Title Section */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    {note?.title || `Recording ${recording.id}`}
                </h1>
                <p className="text-gray-400">
                    {recording.duration ? `${Math.floor(recording.duration / 60)} mins` : 'Duration unknown'} • {recording.project ? recording.project.name : 'No Project'}
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)]">

                {/* Left Column: Audio & Transcript (4 cols) */}
                <RecordingDetailClient
                    recordingId={recordingId}
                    audioUrl={recording.audioUrl || ''}
                    hasTranscription={!!recording.transcription}
                    status={recording.status || 'uploading'}
                    noteId={note?.id || null}
                />

                {/* Right Column: AI Note View (8 cols) */}
                <div className="lg:col-span-8 h-full overflow-hidden">
                    {note?.formattedMinutes ? (
                        <NoteViewerWithEditor 
                            noteId={note.id}
                            title="Meeting Minutes" 
                            content={note.formattedMinutes}
                            shareToken={note.shareToken}
                        />
                    ) : (
                        <Card className="glass border-white/10 h-full flex flex-col items-center justify-center text-center p-8 bg-black/20 border-dashed">
                            <CheckSquare className="w-16 h-16 text-gray-600 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Generating Minutes...</h3>
                            <p className="text-gray-400 max-w-md">
                                AI is currently analyzing the transcript to generate structured meeting notes. This usually takes 1-2 minutes.
                            </p>
                        </Card>
                    )}
                </div>

                {/* Task Reviewer Section (Full Width below or part of right col?) */}
                {/* Let's stack it under NoteViewer if candidates exist */}
                {candidates.length > 0 && (
                    <div className="lg:col-span-12 mt-8">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-primary" />
                            Review Suggested Tasks
                        </h3>
                        <TaskReviewer candidates={candidates} recordingId={recordingId} />
                    </div>
                )}

                {/* Mind Map Section */}
                {note?.formattedMinutes && (
                    <div className="lg:col-span-12 mt-8">
                        <MindMapViewer markdown={note.formattedMinutes} noteId={note.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
