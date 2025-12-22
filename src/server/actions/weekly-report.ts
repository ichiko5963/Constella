'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { weeklyReports, meetingNotes, tasks, recordings } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 週間レポートを生成
 */
export async function generateWeeklyReport(weekStartDate?: Date): Promise<{ success: boolean; reportId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 週の開始日と終了日を計算
        const start = weekStartDate || getWeekStart(new Date());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        // 週間のデータを集計
        const [meetings, tasksData, recordingsData] = await Promise.all([
            // 会議数と合計時間
            db.query.meetingNotes.findMany({
                where: (notes, { and, eq, gte, lte }) => and(
                    eq(notes.userId, session.user.id),
                    gte(notes.meetingDate, start),
                    lte(notes.meetingDate, end)
                ),
                with: {
                    recording: true,
                },
            }),
            // タスク数
            db.query.tasks.findMany({
                where: (tasks, { and, eq, gte, lte }) => and(
                    eq(tasks.userId, session.user.id),
                    gte(tasks.createdAt, start),
                    lte(tasks.createdAt, end)
                ),
            }),
            // 録音データ
            db.query.recordings.findMany({
                where: (recordings, { and, eq, gte, lte }) => and(
                    eq(recordings.userId, session.user.id),
                    gte(recordings.createdAt, start),
                    lte(recordings.createdAt, end)
                ),
            }),
        ]);

        const totalMeetings = meetings.length;
        const totalDuration = meetings.reduce((sum, note) => {
            return sum + (note.duration || 0);
        }, 0);
        const totalTasks = tasksData.length;
        const completedTasks = tasksData.filter(t => t.status === 'completed' || t.status === 'approved').length;

        // プロジェクト別の集計
        const projectCounts = new Map<number, number>();
        meetings.forEach(note => {
            if (note.projectId) {
                projectCounts.set(note.projectId, (projectCounts.get(note.projectId) || 0) + 1);
            }
        });
        const topProjects = Array.from(projectCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([projectId]) => projectId);

        // AIで週間サマリーを生成
        const summaries = meetings.map(note => note.summary || note.title).filter(Boolean).join('\n');
        let aiSummary = '';
        
        if (summaries) {
            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'あなたは週間レポートを生成するアシスタントです。会議の要約から、週間の主要な成果、決定事項、課題を抽出して簡潔にまとめてください。',
                        },
                        {
                            role: 'user',
                            content: `以下の会議要約から週間レポートを生成してください：\n\n${summaries}`,
                        },
                    ],
                    max_tokens: 500,
                });
                aiSummary = completion.choices[0]?.message?.content || '';
            } catch (error) {
                console.error('Failed to generate AI summary:', error);
                aiSummary = 'AIサマリーの生成に失敗しました';
            }
        }

        // 週間レポートを保存
        const [inserted] = await db.insert(weeklyReports).values({
            userId: session.user.id,
            weekStartDate: start,
            weekEndDate: end,
            totalMeetings,
            totalDuration,
            totalTasks,
            completedTasks,
            summary: aiSummary,
            keyMetrics: JSON.stringify({
                averageMeetingDuration: totalMeetings > 0 ? Math.floor(totalDuration / totalMeetings / 60) : 0,
                taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            }),
            topProjects: JSON.stringify(topProjects),
        }).returning();

        revalidatePath('/dashboard');
        return { success: true, reportId: inserted.id };
    } catch (error) {
        console.error('Failed to generate weekly report:', error);
        return { success: false, error: 'Failed to generate weekly report' };
    }
}

/**
 * 週間レポートを取得
 */
export async function getWeeklyReports(limit: number = 10) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const reports = await db.query.weeklyReports.findMany({
            where: eq(weeklyReports.userId, session.user.id),
            orderBy: (reports, { desc }) => [desc(reports.weekStartDate)],
            limit,
        });

        return {
            success: true,
            reports: reports.map(r => ({
                id: r.id,
                weekStartDate: r.weekStartDate,
                weekEndDate: r.weekEndDate,
                totalMeetings: r.totalMeetings,
                totalDuration: r.totalDuration,
                totalTasks: r.totalTasks,
                completedTasks: r.completedTasks,
                summary: r.summary,
                keyMetrics: r.keyMetrics ? JSON.parse(r.keyMetrics) : null,
                topProjects: r.topProjects ? JSON.parse(r.topProjects) : [],
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get weekly reports:', error);
        return { success: false, error: 'Failed to retrieve weekly reports' };
    }
}

/**
 * 週の開始日（月曜日）を取得
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日に調整
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
