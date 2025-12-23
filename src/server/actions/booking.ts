'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { bookingSettings, bookings, calendarEvents, calendarIntegrations } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit-log';

export interface CreateBookingSettingInput {
    title?: string;
    description?: string;
    duration?: number;
    bufferTime?: number;
    businessHoursStart?: number;
    businessHoursEnd?: number;
    availableDays?: number[];
    timezone?: string;
    autoGenerateMeetLink?: boolean;
    autoJoinActory?: boolean;
    autoRecord?: boolean;
}

/**
 * 予約設定を作成
 */
export async function createBookingSetting(input: CreateBookingSettingInput = {}) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 一意のトークンを生成
        const token = nanoid(12);

        const [inserted] = await db.insert(bookingSettings).values({
            userId: session.user.id,
            token,
            title: input.title || '予約可能な時間',
            description: input.description || null,
            duration: input.duration || 30,
            bufferTime: input.bufferTime || 0,
            businessHoursStart: input.businessHoursStart || 9,
            businessHoursEnd: input.businessHoursEnd || 18,
            availableDays: input.availableDays ? JSON.stringify(input.availableDays) : JSON.stringify([1, 2, 3, 4, 5]), // 月-金
            timezone: input.timezone || 'Asia/Tokyo',
            autoGenerateMeetLink: input.autoGenerateMeetLink !== false,
            autoJoinActory: input.autoJoinActory !== false,
            autoRecord: input.autoRecord || false,
            enabled: true,
        }).returning();

        revalidatePath('/scheduler');
        return { success: true, bookingSetting: inserted };
    } catch (error) {
        console.error('Failed to create booking setting:', error);
        return { success: false, error: 'Failed to create booking setting' };
    }
}

/**
 * 予約設定を取得
 */
export async function getBookingSettings() {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const settings = await db.query.bookingSettings.findMany({
            where: eq(bookingSettings.userId, session.user.id),
            orderBy: (settings, { desc }) => [desc(settings.createdAt)],
        });

        return { success: true, settings };
    } catch (error) {
        console.error('Failed to get booking settings:', error);
        return { success: false, error: 'Failed to retrieve booking settings' };
    }
}

/**
 * トークンから予約設定を取得（公開用）
 */
export async function getBookingSettingByToken(token: string) {
    try {
        const setting = await db.query.bookingSettings.findFirst({
            where: and(
                eq(bookingSettings.token, token),
                eq(bookingSettings.enabled, true)
            ),
            with: {
                user: true,
            },
        });

        if (!setting) {
            return { success: false, error: 'Booking setting not found' };
        }

        return { success: true, setting };
    } catch (error) {
        console.error('Failed to get booking setting by token:', error);
        return { success: false, error: 'Failed to retrieve booking setting' };
    }
}

/**
 * 予約設定を更新
 */
export async function updateBookingSetting(id: number, input: Partial<CreateBookingSettingInput>) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 所有者確認
        const existing = await db.query.bookingSettings.findFirst({
            where: and(
                eq(bookingSettings.id, id),
                eq(bookingSettings.userId, session.user.id)
            ),
        });

        if (!existing) {
            return { success: false, error: 'Booking setting not found' };
        }

        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.duration !== undefined) updateData.duration = input.duration;
        if (input.bufferTime !== undefined) updateData.bufferTime = input.bufferTime;
        if (input.businessHoursStart !== undefined) updateData.businessHoursStart = input.businessHoursStart;
        if (input.businessHoursEnd !== undefined) updateData.businessHoursEnd = input.businessHoursEnd;
        if (input.availableDays !== undefined) updateData.availableDays = JSON.stringify(input.availableDays);
        if (input.timezone !== undefined) updateData.timezone = input.timezone;
        if (input.autoGenerateMeetLink !== undefined) updateData.autoGenerateMeetLink = input.autoGenerateMeetLink;
        if (input.autoJoinActory !== undefined) updateData.autoJoinActory = input.autoJoinActory;
        if (input.autoRecord !== undefined) updateData.autoRecord = input.autoRecord;

        const [updated] = await db.update(bookingSettings)
            .set(updateData)
            .where(eq(bookingSettings.id, id))
            .returning();

        revalidatePath('/scheduler');
        return { success: true, bookingSetting: updated };
    } catch (error) {
        console.error('Failed to update booking setting:', error);
        return { success: false, error: 'Failed to update booking setting' };
    }
}

/**
 * 予約設定を削除
 */
export async function deleteBookingSetting(id: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 所有者確認
        const existing = await db.query.bookingSettings.findFirst({
            where: and(
                eq(bookingSettings.id, id),
                eq(bookingSettings.userId, session.user.id)
            ),
        });

        if (!existing) {
            return { success: false, error: 'Booking setting not found' };
        }

        await db.delete(bookingSettings).where(eq(bookingSettings.id, id));

        revalidatePath('/scheduler');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete booking setting:', error);
        return { success: false, error: 'Failed to delete booking setting' };
    }
}

/**
 * Google Meetリンクを生成してGoogle Calendarにイベントを作成
 */
async function createGoogleCalendarEventWithMeet(
    accessToken: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attendeeEmail: string,
    attendeeName: string
): Promise<{ success: boolean; eventId?: string; meetLink?: string; error?: string }> {
    try {
        const requestId = `actory-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        const event = {
            summary: title,
            description: description,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Asia/Tokyo',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Tokyo',
            },
            attendees: [
                { email: attendeeEmail, displayName: attendeeName },
            ],
            conferenceData: {
                createRequest: {
                    requestId: requestId,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                    },
                },
            },
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create Google Calendar event:', errorText);
            return { success: false, error: 'Failed to create Google Calendar event' };
        }

        const eventData = await response.json();
        
        // Google Meetリンクを取得（複数の方法で試行）
        let meetLink = eventData.hangoutLink;
        
        if (!meetLink && eventData.conferenceData?.entryPoints) {
            const videoEntry = eventData.conferenceData.entryPoints.find(
                (ep: any) => ep.entryPointType === 'video' || ep.entryPointType === 'hangoutsMeet'
            );
            meetLink = videoEntry?.uri || null;
        }

        // まだ見つからない場合は、conferenceDataから直接取得
        if (!meetLink && eventData.conferenceData?.hangoutLink) {
            meetLink = eventData.conferenceData.hangoutLink;
        }

        if (!meetLink) {
            console.error('Google Meet link not found in response:', JSON.stringify(eventData, null, 2));
            return { 
                success: false, 
                error: 'Google Meetリンクが生成されませんでした。Google Calendar APIの応答に問題があります。' 
            };
        }

        return {
            success: true,
            eventId: eventData.id,
            meetLink: meetLink,
        };
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return { success: false, error: 'Failed to create Google Calendar event' };
    }
}

/**
 * 予約を作成（公開予約ページから）
 */
export async function createBooking(
    token: string,
    attendeeName: string,
    attendeeEmail: string,
    selectedSlot: Date,
    message?: string
) {
    try {
        // 予約設定を取得
        const settingResult = await getBookingSettingByToken(token);
        if (!settingResult.success || !settingResult.setting) {
            return { success: false, error: 'Invalid booking link' };
        }

        const setting = settingResult.setting;
        const endTime = new Date(selectedSlot);
        endTime.setMinutes(endTime.getMinutes() + setting.duration);

        // Google Calendar統合を取得
        const integration = await db.query.calendarIntegrations.findFirst({
            where: and(
                eq(calendarIntegrations.userId, setting.userId),
                eq(calendarIntegrations.provider, 'google' as any),
                eq(calendarIntegrations.enabled, true)
            ),
        });

        let googleCalendarEventId: string | null = null;
        let meetLink: string | null = null;

        // Google Calendar統合が必須 - Meetリンクを生成するため
        if (!integration?.accessToken) {
            return { 
                success: false, 
                error: 'Google Calendar連携が必要です。設定からGoogle Calendarを連携してください。' 
            };
        }

        // トークンの有効期限をチェックしてリフレッシュ
        let accessToken = integration.accessToken;
        if (integration.expiresAt && new Date() >= integration.expiresAt && integration.refreshToken) {
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
                    .where(eq(calendarIntegrations.id, integration.id));
            } else {
                console.error('Failed to refresh Google token:', refreshData);
                return { 
                    success: false, 
                    error: 'Google Calendar連携の更新に失敗しました。設定から再連携してください。' 
                };
            }
        }

        // Google Meetリンクを生成してGoogle Calendarにイベントを作成（必須）
        const calendarResult = await createGoogleCalendarEventWithMeet(
            accessToken,
            `${setting.title} - ${attendeeName}`,
            message || `予約者: ${attendeeName} (${attendeeEmail})\n${setting.description || ''}`,
            selectedSlot,
            endTime,
            attendeeEmail,
            attendeeName
        );

        if (!calendarResult.success) {
            return { 
                success: false, 
                error: calendarResult.error || 'Google Calendarへの予定追加に失敗しました。' 
            };
        }

        googleCalendarEventId = calendarResult.eventId || null;
        meetLink = calendarResult.meetLink || null;

        // Meetリンクが生成されなかった場合はエラー
        if (!meetLink) {
            console.error('Google Meet link was not generated');
            return { 
                success: false, 
                error: 'Google Meetリンクの生成に失敗しました。' 
            };
        }

        // Actoryのカレンダーイベントを作成
        const [calendarEvent] = await db.insert(calendarEvents).values({
            userId: setting.userId,
            integrationId: integration?.id || null,
            externalId: googleCalendarEventId,
            title: `${setting.title} - ${attendeeName}`,
            description: message || `予約者: ${attendeeName} (${attendeeEmail})`,
            startTime: selectedSlot,
            endTime: endTime,
            meetingLink: meetLink,
            attendees: JSON.stringify([{ name: attendeeName, email: attendeeEmail }]),
            autoJoinEnabled: setting.autoJoinActory || false,
            autoRecordEnabled: setting.autoRecord || false,
            joinStatus: 'pending',
        }).returning();

        // 予約レコードを作成
        const [booking] = await db.insert(bookings).values({
            bookingSettingId: setting.id,
            userId: setting.userId,
            attendeeName,
            attendeeEmail,
            message: message || null,
            startTime: selectedSlot,
            endTime: endTime,
            meetingLink: meetLink,
            googleCalendarEventId: googleCalendarEventId,
            calendarEventId: calendarEvent.id,
            status: 'confirmed',
        }).returning();

        // 予約確認メールを送信
        await sendBookingConfirmationEmail(
            attendeeEmail,
            attendeeName,
            selectedSlot,
            endTime,
            meetLink,
            setting.title
        ).catch(error => {
            console.error('Failed to send confirmation email:', error);
            // メール送信の失敗は予約を妨げない
        });

        // 監査ログを記録
        await logAuditEvent('create', 'project', booking.id, {
            type: 'booking',
            attendeeEmail,
        });

        revalidatePath('/calendar');
        return {
            success: true,
            booking,
            calendarEvent,
            meetLink,
        };
    } catch (error) {
        console.error('Failed to create booking:', error);
        return { success: false, error: 'Failed to create booking' };
    }
}

/**
 * 予約設定に基づいて利用可能な時間スロットを取得（公開予約ページ用）
 */
export async function getAvailableTimeSlotsForBooking(token: string, date: Date) {
    try {
        const settingResult = await getBookingSettingByToken(token);
        if (!settingResult.success || !settingResult.setting) {
            return { success: false, error: 'Invalid booking link' };
        }

        const setting = settingResult.setting;
        const availableDays = setting.availableDays ? JSON.parse(setting.availableDays) : [1, 2, 3, 4, 5];
        
        // 指定日の曜日をチェック
        const dayOfWeek = date.getDay();
        if (!availableDays.includes(dayOfWeek)) {
            return { success: true, slots: [] };
        }

        // ユーザーのカレンダー統合を取得
        const integrations = await db.query.calendarIntegrations.findMany({
            where: and(
                eq(calendarIntegrations.userId, setting.userId),
                eq(calendarIntegrations.enabled, true)
            ),
        });

        // 指定日の既存イベントを取得
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingEvents = await db.query.calendarEvents.findMany({
            where: and(
                eq(calendarEvents.userId, setting.userId),
                gte(calendarEvents.startTime, startOfDay),
                lte(calendarEvents.startTime, endOfDay)
            ),
        });

        // 既存の予約も取得
        const existingBookings = await db.query.bookings.findMany({
            where: and(
                eq(bookings.userId, setting.userId),
                gte(bookings.startTime, startOfDay),
                lte(bookings.startTime, endOfDay)
            ),
        });

        const slots: any[] = [];
        const businessHoursStart = setting.businessHoursStart || 9;
        const businessHoursEnd = setting.businessHoursEnd || 18;
        const duration = setting.duration || 30;
        const bufferTime = setting.bufferTime || 0;

        // 時間スロットを生成
        for (let hour = businessHoursStart; hour < businessHoursEnd; hour++) {
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
                }) && !existingBookings.some(booking => {
                    const bookingStart = new Date(booking.startTime);
                    const bookingEnd = new Date(booking.endTime);
                    return (slotStart >= bookingStart && slotStart < bookingEnd) ||
                           (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                           (slotStart <= bookingStart && slotEnd >= bookingEnd);
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
        console.error('Failed to get available time slots for booking:', error);
        return { success: false, error: 'Failed to retrieve time slots' };
    }
}
