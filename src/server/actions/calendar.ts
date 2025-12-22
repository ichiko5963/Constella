'use server';

import { db } from '@/db';
import { calendarIntegrations, calendarEvents } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type CalendarIntegration = {
    id: number;
    userId: string;
    provider: 'google' | 'microsoft';
    enabled: boolean;
    lastSyncAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function getCalendarIntegrations() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const integrations = await db.query.calendarIntegrations.findMany({
            where: eq(calendarIntegrations.userId, session.user.id),
        });

        return {
            success: true,
            integrations: integrations.map(i => ({
                id: i.id,
                userId: i.userId,
                provider: i.provider as 'google' | 'microsoft',
                enabled: i.enabled,
                lastSyncAt: i.lastSyncAt,
                createdAt: i.createdAt,
                updatedAt: i.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get calendar integrations:', error);
        return { success: false, error: 'Failed to retrieve integrations' };
    }
}

export async function syncCalendar(integrationId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const integration = await db.query.calendarIntegrations.findFirst({
            where: and(
                eq(calendarIntegrations.id, integrationId),
                eq(calendarIntegrations.userId, session.user.id)
            ),
        });

        if (!integration) {
            return { success: false, error: 'Integration not found' };
        }

        // TODO: 実際のカレンダー同期ロジックを実装
        // ここでは、lastSyncAtを更新するだけ
        await db.update(calendarIntegrations)
            .set({
                lastSyncAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(calendarIntegrations.id, integrationId));

        revalidatePath('/settings');
        revalidatePath('/calendar');
        return { success: true, eventsCount: 0 };
    } catch (error) {
        console.error('Failed to sync calendar:', error);
        return { success: false, error: 'Failed to sync calendar' };
    }
}

export async function disconnectCalendar(integrationId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const integration = await db.query.calendarIntegrations.findFirst({
            where: and(
                eq(calendarIntegrations.id, integrationId),
                eq(calendarIntegrations.userId, session.user.id)
            ),
        });

        if (!integration) {
            return { success: false, error: 'Integration not found' };
        }

        // 関連するイベントも削除
        await db.delete(calendarEvents)
            .where(eq(calendarEvents.integrationId, integrationId));

        // 統合を削除
        await db.delete(calendarIntegrations)
            .where(eq(calendarIntegrations.id, integrationId));

        revalidatePath('/settings');
        revalidatePath('/calendar');
        return { success: true };
    } catch (error) {
        console.error('Failed to disconnect calendar:', error);
        return { success: false, error: 'Failed to disconnect calendar' };
    }
}

export async function getCalendarEvents() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const events = await db.query.calendarEvents.findMany({
            where: eq(calendarEvents.userId, session.user.id),
            orderBy: (events, { asc }) => [asc(events.startTime)],
        });

        return {
            success: true,
            events: events.map(event => ({
                id: event.id,
                userId: event.userId,
                integrationId: event.integrationId,
                externalId: event.externalId,
                title: event.title,
                description: event.description,
                startTime: event.startTime,
                endTime: event.endTime,
                meetingLink: event.meetingLink,
                location: event.location,
                attendees: event.attendees,
                autoJoinEnabled: event.autoJoinEnabled,
                autoRecordEnabled: event.autoRecordEnabled,
                recordingId: event.recordingId,
                joinStatus: event.joinStatus,
                joinedAt: event.joinedAt,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get calendar events:', error);
        return { success: false, error: 'Failed to retrieve events' };
    }
}
