import { auth } from '@/auth';
import { db } from '@/db';
import { recordings, projects } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { RecorderTriggerCard } from '@/components/recording/recorder-trigger-card';
import { WeeklyReportCard } from '@/components/dashboard/weekly-report-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Clock, Calendar, ArrowRight, PlayCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const allRecordings = await db.query.recordings.findMany({
        where: eq(recordings.userId, session.user.id),
        orderBy: desc(recordings.createdAt),
        with: { project: true }
    });
    const recentRecordings = allRecordings.slice(0, 3);

    const allProjects = await db.query.projects.findMany({
        where: eq(projects.userId, session.user.id),
        orderBy: desc(projects.updatedAt),
    });
    const recentProjects = allProjects.slice(0, 3);

    return (
        <div className="space-y-12 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 tracking-tight">
                    おかえりなさい、{session.user.name?.split(' ')[0]}
                </h1>
                <p className="text-gray-400 max-w-xl text-lg">
                    あなたのワークスペースの準備ができました。思考を記録したり、最新のインサイトを確認したりできます。
                </p>
            </div>

            {/* Main Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Recorder */}
                <div className="lg:col-span-2 h-[400px]">
                    <RecorderTriggerCard />
                </div>

                {/* Quick Stats / Info */}
                <div className="space-y-6">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono text-gray-400 uppercase tracking-widest">システムステータス</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">総録音数</span>
                                <span className="text-2xl font-light text-white">{recentRecordings.length}+</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">アクティブなプロジェクト</span>
                                <span className="text-2xl font-light text-white">{recentProjects.length}</span>
                            </div>
                            <div className="h-px bg-white/10 my-4" />
                            <div className="flex items-center gap-2 text-xs text-primary">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                すべてのシステムが正常に動作中
                            </div>
                        </CardContent>
                    </Card>

                    <Link href="/calendar" className="block group">
                        <Card className="bg-white/5 border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">カレンダー</h3>
                                        <p className="text-xs text-gray-400">今後のタスクを表示</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Weekly Report */}
            <WeeklyReportCard />

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Recent Recordings */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-light text-white tracking-wide flex items-center gap-3">
                            <Mic className="w-5 h-5 text-primary" />
                            最近の録音
                        </h2>
                        <Link href="/recordings" className="text-xs text-primary hover:underline uppercase tracking-widest">すべて表示</Link>
                    </div>

                    <div className="space-y-4">
                        {recentRecordings.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-gray-500">まだ録音がありません。</p>
                            </div>
                        ) : recentRecordings.map(rec => (
                            <Link key={rec.id} href={`/recordings/${rec.id}`}>
                                <div className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <PlayCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate">{rec.transcription ? (rec.transcription.slice(0, 30) + '...') : 'Untitled Recording'}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(rec.createdAt).toLocaleDateString()}</span>
                                            {rec.project && <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300">{rec.project.name}</span>}
                                        </div>
                                    </div>
                                    <div className={`text-[10px] uppercase px-2 py-1 rounded border ${rec.status === 'completed' ? 'border-primary/30 text-primary' : 'border-yellow-500/30 text-yellow-500'}`}>
                                        {rec.status}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recent Projects */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-light text-white tracking-wide flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-400" />
                            アクティブなプロジェクト
                        </h2>
                        <Link href="/projects" className="text-xs text-purple-400 hover:underline uppercase tracking-widest">すべて表示</Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {recentProjects.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-gray-500">アクティブなプロジェクトがありません。</p>
                            </div>
                        ) : recentProjects.map(proj => (
                            <Link key={proj.id} href={`/projects/${proj.id}`}>
                                <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">{proj.name}</h3>
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-2">{proj.description || 'No description'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
