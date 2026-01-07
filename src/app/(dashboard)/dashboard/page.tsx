import { auth } from '@/auth';
import { db } from '@/db';
import { recordings, projects } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { RecorderTriggerCard } from '@/components/recording/recorder-trigger-card';
import { WeeklyReportCard } from '@/components/dashboard/weekly-report-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Clock, Calendar, ArrowRight, Mic, Network } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    try {
        let session;
        try {
            session = await auth();
        } catch (error) {
            console.error('Auth error in dashboard page:', error);
            return (
                <div className="space-y-12 max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">認証エラーが発生しました</h1>
                        <p className="text-gray-500">データベース接続を確認してください</p>
                    </div>
                </div>
            );
        }

        if (!session?.user?.id) {
            return (
                <div className="space-y-12 max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-gray-500">ログインが必要です</p>
                    </div>
                </div>
            );
        }

        let allRecordings: Array<{
            id: number;
            transcription: string | null;
            status: string | null;
            createdAt: Date;
            project: { name: string } | null;
        }> = [];
        let allProjects: Array<{
            id: number;
            name: string;
            description: string | null;
        }> = [];

        try {
            allRecordings = await db.query.recordings.findMany({
                where: eq(recordings.userId, session.user.id),
                orderBy: desc(recordings.createdAt),
                with: { project: true }
            });
        } catch (error) {
            console.error('Failed to fetch recordings:', error);
        }

        try {
            allProjects = await db.query.projects.findMany({
                where: eq(projects.userId, session.user.id),
                orderBy: desc(projects.updatedAt),
            });
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }

        const recentRecordings = allRecordings.slice(0, 3);
        const recentProjects = allProjects.slice(0, 3);

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Hero Section - Clean White Design */}
            <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    おかえりなさい、{session.user.name?.split(' ')[0]}
                </h1>
                <p className="text-gray-500 max-w-xl text-lg">
                    あなたの思考を星のように記録し、意味のある星座へと繋げましょう。
                </p>
            </div>

            {/* Main Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Recorder */}
                <div className="lg:col-span-2 h-[360px]">
                    <RecorderTriggerCard />
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Constellation Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Mic className="w-4 h-4" />
                                    録音数
                                </span>
                                <span className="text-2xl font-semibold text-gray-900">{allRecordings.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    Stella
                                </span>
                                <span className="text-2xl font-semibold text-gray-900">{allProjects.length}</span>
                            </div>
                            <div className="h-px bg-gray-100 my-2" />
                            <div className="flex items-center gap-2 text-xs text-gray-900">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-900 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-900"></span>
                                </span>
                                すべてのシステムが正常に動作中
                            </div>
                        </CardContent>
                    </Card>

                    <Link href="/calendar" className="block group">
                        <Card className="group-hover:shadow-lg transition-all duration-200">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">カレンダー</h3>
                                        <p className="text-xs text-gray-500">今後のタスクを表示</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/graph" className="block group">
                        <Card className="group-hover:shadow-lg transition-all duration-200">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                                        <Network className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Constellation</h3>
                                        <p className="text-xs text-gray-500">コンテキストの繋がりを可視化</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Weekly Report */}
            <WeeklyReportCard />

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Recent Recordings */}
                <section className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                            <Mic className="w-5 h-5" />
                            最近の録音
                        </h2>
                        <Link href="/recordings" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">すべて表示</Link>
                    </div>

                    <div className="space-y-3">
                        {recentRecordings.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                                <Mic className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">まだ録音がありません</p>
                            </div>
                        ) : recentRecordings.map(rec => (
                            <Link key={rec.id} href={`/recordings/${rec.id}`}>
                                <Card className="group cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                            <Mic className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-gray-900 font-medium truncate group-hover:text-gray-600 transition-colors">
                                                {rec.transcription ? (rec.transcription.slice(0, 30) + '...') : '無題の録音'}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(rec.createdAt).toLocaleDateString()}
                                                </span>
                                                {rec.project && (
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        {rec.project.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-[10px] uppercase px-2 py-1 rounded-full font-medium ${
                                            rec.status === 'completed'
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {rec.status}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recent Stella (Projects) */}
                <section className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                            <Star className="w-5 h-5" />
                            アクティブなStella
                        </h2>
                        <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">すべて表示</Link>
                    </div>

                    <div className="space-y-3">
                        {recentProjects.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                                <Star className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">アクティブなStellaがありません</p>
                            </div>
                        ) : recentProjects.map(proj => (
                            <Link key={proj.id} href={`/projects/${proj.id}`}>
                                <Card className="group cursor-pointer">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                                    <Star className="w-4 h-4 text-white" />
                                                </div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                                                    {proj.name}
                                                </h3>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 ml-11">
                                            {proj.description || 'No description'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
    } catch (error) {
        console.error('Dashboard page error:', error);
        return (
            <div className="space-y-12 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
                    <p className="text-gray-500">
                        {error instanceof Error ? error.message : '不明なエラーが発生しました'}
                    </p>
                </div>
            </div>
        );
    }
}
