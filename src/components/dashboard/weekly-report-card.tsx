'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Clock, CheckSquare, FileText, Loader2 } from 'lucide-react';
import { getWeeklyReports, generateWeeklyReport } from '@/server/actions/weekly-report';
import { toast } from 'sonner';

interface WeeklyReport {
    id: number;
    weekStartDate: Date;
    weekEndDate: Date;
    totalMeetings: number;
    totalDuration: number;
    totalTasks: number;
    completedTasks: number;
    summary: string | null;
    keyMetrics: {
        averageMeetingDuration: number;
        taskCompletionRate: number;
    } | null;
    topProjects: number[];
}

export function WeeklyReportCard() {
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const result = await getWeeklyReports(1); // 最新の1件のみ
            if (result.success && result.reports) {
                setReports(result.reports);
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
            toast.error('レポートの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateWeeklyReport();
            if (result.success) {
                toast.success('週間レポートを生成しました');
                loadReports();
            } else {
                toast.error(result.error || 'レポートの生成に失敗しました');
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            toast.error('レポート生成中にエラーが発生しました');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        }
        return `${minutes}分`;
    };

    const formatDateRange = (start: Date, end: Date) => {
        const startStr = start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        return `${startStr} - ${endStr}`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>週間レポート</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const latestReport = reports[0];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            週間レポート
                        </CardTitle>
                        <CardDescription>
                            週間の会議とタスクのサマリー
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4" />
                                生成
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {latestReport ? (
                    <div className="space-y-6">
                        {/* 週の期間 */}
                        <div className="text-sm text-gray-400">
                            {formatDateRange(latestReport.weekStartDate, latestReport.weekEndDate)}
                        </div>

                        {/* メトリクス */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-gray-400">会議数</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{latestReport.totalMeetings}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-gray-400">合計時間</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {formatDuration(latestReport.totalDuration)}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-gray-400">タスク</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {latestReport.completedTasks}/{latestReport.totalTasks}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-gray-400">完了率</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {latestReport.keyMetrics?.taskCompletionRate || 0}%
                                </div>
                            </div>
                        </div>

                        {/* AIサマリー */}
                        {latestReport.summary && (
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    AIサマリー
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed">{latestReport.summary}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>週間レポートがありません</p>
                        <p className="text-sm mt-2">生成ボタンから週間レポートを作成してください</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
