'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { calendarEvents } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export interface ManualJoinEventData {
    meetingUrl: string;
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
    projectId?: number | null;
}

/**
 * 手動参加イベントを作成
 */
export async function createManualJoinEvent(data: ManualJoinEventData): Promise<{ success: boolean; eventId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const [inserted] = await db.insert(calendarEvents).values({
            userId: session.user.id,
            title: data.title,
            description: data.description || null,
            meetingLink: data.meetingUrl,
            startTime: data.startTime,
            endTime: data.endTime,
            projectId: data.projectId || null,
            autoJoinEnabled: true, // 手動追加時は自動参加を有効化
            autoRecordEnabled: true, // 自動録音も有効化
            joinStatus: 'pending',
        }).returning();

        revalidatePath('/calendar');
        return { success: true, eventId: inserted.id };
    } catch (error) {
        console.error('Failed to create manual join event:', error);
        return { success: false, error: 'Failed to create event' };
    }
}

