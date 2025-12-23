'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { calendarEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateAutoJoinSettings, updateJoinStatus } from '@/lib/calendar/meeting-joiner';
import { revalidatePath } from 'next/cache';

/**
 * イベントの自動参加設定を更新
 */
export async function toggleAutoJoin(
    eventId: number,
    autoJoinEnabled: boolean,
    autoRecordEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // イベントの所有確認
        const event = await db.query.calendarEvents.findFirst({
            where: eq(calendarEvents.id, eventId),
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        if (event.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await updateAutoJoinSettings(eventId, autoJoinEnabled, autoRecordEnabled);
        
        if (result.success) {
            revalidatePath('/calendar');
            revalidatePath('/settings');
        }

        return result;
    } catch (error) {
        console.error('Failed to toggle auto join:', error);
        return { success: false, error: 'Failed to update auto join settings' };
    }
}

/**
 * イベントの自動参加ステータスを更新（内部使用）
 */
export async function updateEventJoinStatus(
    eventId: number,
    status: 'pending' | 'joining' | 'joined' | 'failed' | 'completed',
    recordingId?: number
): Promise<{ success: boolean; error?: string }> {
    return await updateJoinStatus(eventId, status, recordingId);
}

