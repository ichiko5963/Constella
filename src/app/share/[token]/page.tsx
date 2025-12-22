import { getNoteByShareToken } from '@/server/actions/folder';
import { notFound } from 'next/navigation';
import { NoteViewer } from '@/components/note/note-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const result = await getNoteByShareToken(token);

    if (!result.success || !result.note) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020205] via-[#050510] to-[#0a101f] p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-bold text-white">{result.note.title}</h1>
                    {result.note.projectName && (
                        <p className="text-gray-400">プロジェクト: {result.note.projectName}</p>
                    )}
                    {result.note.meetingDate && (
                        <p className="text-gray-400">
                            {new Date(result.note.meetingDate).toLocaleDateString('ja-JP')}
                        </p>
                    )}
                </div>

                <Card className="glass border-white/10 bg-black/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FileText className="h-5 w-5 text-primary" />
                            議事録
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result.note.formattedMinutes ? (
                            <NoteViewer
                                title=""
                                content={result.note.formattedMinutes}
                            />
                        ) : result.note.summary ? (
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300">{result.note.summary}</p>
                            </div>
                        ) : (
                            <p className="text-gray-400">内容がありません</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
