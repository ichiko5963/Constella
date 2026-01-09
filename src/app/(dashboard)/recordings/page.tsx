import { RecorderTriggerCard } from '@/components/recording/recorder-trigger-card';
import { RecordingImport } from '@/components/recording/recording-import';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { recordings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { Metadata } from 'next';
import Link from 'next/link';
import { Mic, Clock, Star } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Recordings | Constella',
    description: 'Browse and search all your voice recordings.',
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
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">録音</h1>
                    <p className="text-gray-500 mt-1">あなたの思考を星として記録</p>
                </div>
            </div>

            <div className="w-full h-[320px]">
                <RecorderTriggerCard />
            </div>

            {/* Recording Import */}
            <RecordingImport />

            {/* Recordings List */}
            <Card>
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Mic className="w-5 h-5" />
                        すべての録音
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {userRecordings.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                <Mic className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">録音がありません</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                上のRecorderをタップして、思考を星として記録しましょう。
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userRecordings.map((rec) => (
                                <Link key={rec.id} href={`/recordings/${rec.id}`}>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                                <Mic className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-gray-900 font-medium group-hover:text-gray-700 transition-colors">
                                                    {rec.transcription ? '録音 (文字起こし済み)' : `録音 #${rec.id}`}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                    {rec.project && (
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3 h-3" />
                                                            {rec.project.name}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {rec.createdAt.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                                                rec.status === 'completed'
                                                    ? 'bg-gray-900 text-white'
                                                    : rec.status === 'processing' || rec.status === 'transcribing'
                                                        ? 'bg-gray-200 text-gray-700 animate-pulse'
                                                        : 'bg-gray-100 text-gray-600'
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
    );
}
