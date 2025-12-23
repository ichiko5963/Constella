import { RecorderTriggerCard } from '@/components/recording/recorder-trigger-card';
import { RecordingImport } from '@/components/recording/recording-import';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { recordings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { Metadata } from 'next';
import Link from 'next/link';
import { PlayCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'All Recordings',
    description: 'Browse and search all your meeting recordings.',
};

export default async function RecordingsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userRecordings = await db.query.recordings.findMany({
        where: eq(recordings.userId, session.user.id),
        orderBy: desc(recordings.createdAt),
        with: {
            project: true
        }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">録音</h1>

            <div className="w-full mb-8">
                <RecorderTriggerCard />
            </div>

            {/* 録音インポート機能 */}
            <div className="mb-8">
                <RecordingImport />
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card className="glass border-white/10 bg-black/40">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="text-white">すべての録音</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {userRecordings.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>録音が見つかりません。プロジェクトを作成して録音を開始しましょう。</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {userRecordings.map((rec) => (
                                    <Link key={rec.id} href={`/recordings/${rec.id}`}>
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <PlayCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-medium group-hover:text-primary transition-colors">
                                                        録音 {rec.transcription ? '(文字起こし済み)' : `#${rec.id}`}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 flex items-center gap-2">
                                                        <span className="truncate max-w-[200px]">{rec.project?.name || 'プロジェクトなし'}</span>
                                                        <span>•</span>
                                                        <span>{rec.createdAt.toLocaleDateString()}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${rec.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                                    rec.status === 'processing' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                                                        'bg-gray-500/10 text-gray-400'
                                                    }`}>
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
