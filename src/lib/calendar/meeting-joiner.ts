/**
 * 会議自動参加機能
 * 
 * Google MeetやZoomに自動で参加し、録音を開始する機能
 * 技術仕様書に基づき、Notta Botのような動作を実現
 */

import { db } from '@/db';
import { calendarEvents, recordings } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { createRecordingUploadUrl, updateRecordingStatus } from '@/server/actions/recording';
import { processRecording } from '@/server/actions/process-audio';
import { detectMeetingType } from './meeting-detector';

export interface AutoJoinConfig {
    eventId: number;
    meetingLink: string;
    meetingType: 'google-meet' | 'zoom' | 'teams';
    startTime: Date;
    endTime: Date;
    userId: string;
    projectId?: number;
}

/**
 * 自動参加が必要なイベントを取得
 */
export async function getUpcomingAutoJoinEvents(): Promise<Array<{
    id: number;
    userId: string;
    meetingLink: string;
    startTime: Date;
    endTime: Date;
    title: string;
    projectId?: number | null;
}>> {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1時間後まで

    const events = await db.query.calendarEvents.findMany({
        where: and(
            eq(calendarEvents.autoJoinEnabled, true),
            gte(calendarEvents.startTime, now),
            lte(calendarEvents.startTime, oneHourLater),
            eq(calendarEvents.joinStatus, 'pending')
        ),
    });

    return events
        .filter(event => event.meetingLink)
        .map(event => ({
            id: event.id,
            userId: event.userId,
            meetingLink: event.meetingLink!,
            startTime: event.startTime,
            endTime: event.endTime,
            title: event.title,
            projectId: event.projectId || null,
        }));
}

/**
 * イベントの自動参加ステータスを更新
 */
export async function updateJoinStatus(
    eventId: number,
    status: 'pending' | 'joining' | 'joined' | 'failed' | 'completed',
    recordingId?: number
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.update(calendarEvents)
            .set({
                joinStatus: status,
                joinedAt: status === 'joined' ? new Date() : undefined,
                recordingId: recordingId || undefined,
                updatedAt: new Date(),
            })
            .where(eq(calendarEvents.id, eventId));

        return { success: true };
    } catch (error) {
        console.error('Failed to update join status:', error);
        return { success: false, error: 'Failed to update join status' };
    }
}

/**
 * 会議終了後のイベントを取得（録音処理が必要なイベント）
 */
export async function getCompletedAutoJoinEvents(): Promise<Array<{
    id: number;
    recordingId: number | null;
    endTime: Date;
}>> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1時間前まで

    const events = await db.query.calendarEvents.findMany({
        where: and(
            eq(calendarEvents.autoJoinEnabled, true),
            eq(calendarEvents.autoRecordEnabled, true),
            eq(calendarEvents.joinStatus, 'joined'),
            lte(calendarEvents.endTime, now), // 会議が終了している
            gte(calendarEvents.endTime, oneHourAgo) // 1時間以内に終了した会議
        ),
    });

    return events
        .filter(event => event.recordingId)
        .map(event => ({
            id: event.id,
            recordingId: event.recordingId!,
            endTime: event.endTime,
        }));
}

/**
 * イベントの自動参加設定を更新
 */
export async function updateAutoJoinSettings(
    eventId: number,
    autoJoinEnabled: boolean,
    autoRecordEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.update(calendarEvents)
            .set({
                autoJoinEnabled,
                autoRecordEnabled,
                updatedAt: new Date(),
            })
            .where(eq(calendarEvents.id, eventId));

        return { success: true };
    } catch (error) {
        console.error('Failed to update auto join settings:', error);
        return { success: false, error: 'Failed to update auto join settings' };
    }
}

