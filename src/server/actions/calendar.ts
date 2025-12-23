'use server';

import { db } from '@/db';
import { calendarIntegrations, calendarEvents } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type CalendarIntegration = {
    id: number;
    userId: string;
    provider: 'google' | 'microsoft' | 'zoom';
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
                provider: i.provider as 'google' | 'microsoft' | 'zoom',
                enabled: i.enabled ?? false, // nullの場合はfalseに変換
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

        // Google Calendar APIからイベントを取得
        if (integration.provider === 'google' && integration.accessToken) {
            try {
                // トークンの有効期限をチェック
                let accessToken = integration.accessToken;
                if (integration.expiresAt && new Date() >= integration.expiresAt) {
                    // トークンをリフレッシュ
                    if (integration.refreshToken) {
                        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: process.env.GOOGLE_CLIENT_ID!,
                                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                                refresh_token: integration.refreshToken,
                                grant_type: 'refresh_token',
                            }),
                        });
                        const refreshData = await refreshResponse.json();
                        if (refreshResponse.ok) {
                            accessToken = refreshData.access_token;
                            await db.update(calendarIntegrations)
                                .set({
                                    accessToken: refreshData.access_token,
                                    expiresAt: refreshData.expires_in
                                        ? new Date(Date.now() + refreshData.expires_in * 1000)
                                        : null,
                                })
                                .where(eq(calendarIntegrations.id, integrationId));
                        }
                    }
                }

                // カレンダーイベントを取得
                const now = new Date();
                const oneMonthLater = new Date(now);
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                const eventsResponse = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                    `timeMin=${now.toISOString()}&timeMax=${oneMonthLater.toISOString()}&singleEvents=true&orderBy=startTime`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    const events = eventsData.items || [];

                    // 既存のイベントを削除（この統合のもの）
                    await db.delete(calendarEvents)
                        .where(eq(calendarEvents.integrationId, integrationId));

                    // 新しいイベントを保存
                    let savedCount = 0;
                    for (const event of events) {
                        if (event.start && event.end) {
                            const meetingLink = event.hangoutLink || 
                                              event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri ||
                                              event.location?.match(/https?:\/\/[^\s]+/)?.[0] ||
                                              null;

                            // Google Meetリンクがある場合は自動参加・自動録音を有効化
                            const hasMeetingLink = !!meetingLink;
                            
                            await db.insert(calendarEvents).values({
                                userId: session.user.id,
                                integrationId: integrationId,
                                externalId: event.id,
                                title: event.summary || 'Untitled Event',
                                description: event.description || null,
                                startTime: new Date(event.start.dateTime || event.start.date),
                                endTime: new Date(event.end.dateTime || event.end.date),
                                meetingLink: meetingLink,
                                location: event.location || null,
                                attendees: event.attendees ? JSON.stringify(event.attendees.map((a: any) => ({ email: a.email, displayName: a.displayName }))) : null,
                                // Google Meetリンクがある場合は自動参加・自動録音を有効化
                                autoJoinEnabled: hasMeetingLink,
                                autoRecordEnabled: hasMeetingLink,
                                joinStatus: 'pending',
                            });
                            savedCount++;
                        }
                    }

                    await db.update(calendarIntegrations)
                        .set({
                            lastSyncAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .where(eq(calendarIntegrations.id, integrationId));

                    revalidatePath('/settings');
                    revalidatePath('/calendar');
                    return { success: true, eventsCount: savedCount };
                } else {
                    console.error('Failed to fetch calendar events:', await eventsResponse.text());
                    return { success: false, error: 'Failed to fetch calendar events' };
                }
            } catch (error) {
                console.error('Failed to sync calendar:', error);
                return { success: false, error: 'Failed to sync calendar' };
            }
        }

        // Zoom APIから会議を取得
        if (integration.provider === 'zoom' && integration.accessToken) {
            try {
                // トークンの有効期限をチェック
                let accessToken = integration.accessToken;
                if (integration.expiresAt && new Date() >= integration.expiresAt) {
                    // トークンをリフレッシュ
                    if (integration.refreshToken) {
                        const clientId = process.env.ZOOM_CLIENT_ID;
                        const clientSecret = process.env.ZOOM_CLIENT_SECRET;
                        if (!clientId || !clientSecret) {
                            return { success: false, error: 'Zoom credentials not configured' };
                        }

                        const refreshResponse = await fetch('https://zoom.us/oauth/token', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                            },
                            body: new URLSearchParams({
                                grant_type: 'refresh_token',
                                refresh_token: integration.refreshToken,
                            }),
                        });
                        const refreshData = await refreshResponse.json();
                        if (refreshResponse.ok) {
                            accessToken = refreshData.access_token;
                            await db.update(calendarIntegrations)
                                .set({
                                    accessToken: refreshData.access_token,
                                    refreshToken: refreshData.refresh_token || integration.refreshToken,
                                    expiresAt: refreshData.expires_in
                                        ? new Date(Date.now() + refreshData.expires_in * 1000)
                                        : null,
                                })
                                .where(eq(calendarIntegrations.id, integrationId));
                        }
                    }
                }

                // Zoom会議を取得（今後の会議）
                const now = new Date();
                const oneMonthLater = new Date(now);
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                const meetingsResponse = await fetch(
                    `https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (meetingsResponse.ok) {
                    const meetingsData = await meetingsResponse.json();
                    const meetings = meetingsData.meetings || [];

                    // 既存のイベントを削除（この統合のもの）
                    await db.delete(calendarEvents)
                        .where(eq(calendarEvents.integrationId, integrationId));

                    // 新しい会議を保存
                    let savedCount = 0;
                    for (const meeting of meetings) {
                        if (meeting.start_time) {
                            const startTime = new Date(meeting.start_time);
                            const duration = meeting.duration || 60; // デフォルト60分
                            const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

                            // Zoom会議リンクを生成
                            const meetingLink = meeting.join_url || `https://zoom.us/j/${meeting.id}`;

                            await db.insert(calendarEvents).values({
                                userId: session.user.id,
                                integrationId: integrationId,
                                externalId: meeting.id.toString(),
                                title: meeting.topic || 'Untitled Meeting',
                                description: meeting.agenda || null,
                                startTime: startTime,
                                endTime: endTime,
                                meetingLink: meetingLink,
                                location: null,
                                attendees: null, // Zoom APIでは参加者情報は取得できない
                                // Zoom会議は自動参加・自動録音を有効化
                                autoJoinEnabled: true,
                                autoRecordEnabled: true,
                                joinStatus: 'pending',
                            });
                            savedCount++;
                        }
                    }

                    await db.update(calendarIntegrations)
                        .set({
                            lastSyncAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .where(eq(calendarIntegrations.id, integrationId));

                    revalidatePath('/settings');
                    revalidatePath('/calendar');
                    return { success: true, eventsCount: savedCount };
                } else {
                    console.error('Failed to fetch Zoom meetings:', await meetingsResponse.text());
                    return { success: false, error: 'Failed to fetch Zoom meetings' };
                }
            } catch (error) {
                console.error('Failed to sync Zoom calendar:', error);
                return { success: false, error: 'Failed to sync Zoom calendar' };
            }
        }

        // Microsoft Outlookの実装は将来追加
        return { success: false, error: 'Provider not supported yet' };
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

