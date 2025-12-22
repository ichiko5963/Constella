'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { calendarEvents, calendarIntegrations } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
}

export interface BookingRequest {
    name: string;
    email: string;
    message?: string;
    selectedSlot: Date;
    duration: number; // 分単位
}

/**
 * 利用可能な時間スロットを取得
 */
export async function getAvailableTimeSlots(date: Date, duration: number = 30): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // ユーザーのカレンダー統合を取得
        const integrations = await db.query.calendarIntegrations.findMany({
            where: (integrations, { and, eq }) => and(
                eq(integrations.userId, session.user.id),
                eq(integrations.enabled, true)
            ),
        });

        // 指定日の既存イベントを取得
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingEvents = await db.query.calendarEvents.findMany({
            where: (events, { and, eq, gte, lte }) => and(
                eq(events.userId, session.user.id),
                gte(events.startTime, startOfDay),
                lte(events.startTime, endOfDay)
            ),
        });

        // デフォルトの営業時間（9:00 - 18:00）
        const businessHours = { start: 9, end: 18 };
        const slots: TimeSlot[] = [];

        // 30分刻みでスロットを生成
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const slotStart = new Date(date);
                slotStart.setHours(hour, minute, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + duration);

                // 既存イベントと重複していないかチェック
                const isAvailable = !existingEvents.some(event => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    return (slotStart >= eventStart && slotStart < eventEnd) ||
                           (slotEnd > eventStart && slotEnd <= eventEnd) ||
                           (slotStart <= eventStart && slotEnd >= eventEnd);
                });

                slots.push({
                    start: slotStart,
                    end: slotEnd,
                    available: isAvailable,
                });
            }
        }

        return { success: true, slots };
    } catch (error) {
        console.error('Failed to get available time slots:', error);
        return { success: false, error: 'Failed to retrieve time slots' };
    }
}

/**
 * 予約リクエストを作成
 */
export async function createBookingRequest(data: BookingRequest): Promise<{ success: boolean; eventId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const endTime = new Date(data.selectedSlot);
        endTime.setMinutes(endTime.getMinutes() + data.duration);

        // カレンダーイベントを作成（手動追加として）
        const [inserted] = await db.insert(calendarEvents).values({
            userId: session.user.id,
            integrationId: null, // 手動追加
            externalId: null,
            title: `${data.name} との予約`,
            description: data.message || `予約者: ${data.name} (${data.email})`,
            startTime: data.selectedSlot,
            endTime: endTime,
            meetingLink: null, // 後で生成
            attendees: JSON.stringify([{ name: data.name, email: data.email }]),
            autoJoinEnabled: false,
            autoRecordEnabled: false,
            joinStatus: 'pending',
        }).returning();

        // TODO: 予約確認メールを送信
        // TODO: 会議リンクを生成（Google Meet/Zoom）

        revalidatePath('/calendar');
        return { success: true, eventId: inserted.id };
    } catch (error) {
        console.error('Failed to create booking request:', error);
        return { success: false, error: 'Failed to create booking' };
    }
}
