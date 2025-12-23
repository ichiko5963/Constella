import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { calendarIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/calendar?error=zoom_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/calendar?error=no_code', request.url));
    }

    try {
        // アクセストークンを取得
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/calendar/zoom/callback`;
        const clientId = process.env.ZOOM_CLIENT_ID;
        const clientSecret = process.env.ZOOM_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.redirect(new URL('/calendar?error=zoom_not_configured', request.url));
        }

        // Basic認証でトークンを取得
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', tokenData);
            return NextResponse.redirect(new URL('/calendar?error=token_exchange_failed', request.url));
        }

        // カレンダー統合を保存または更新
        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
        }

        const existing = await db.query.calendarIntegrations.findFirst({
            where: (integrations, { and, eq }) => and(
                eq(integrations.userId, userId),
                eq(integrations.provider, 'zoom')
            ),
        });

        const expiresAt = tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null;

        if (existing) {
            await db.update(calendarIntegrations)
                .set({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token || existing.refreshToken,
                    expiresAt: expiresAt,
                    enabled: true,
                    updatedAt: new Date(),
                })
                .where(eq(calendarIntegrations.id, existing.id));
        } else {
            await db.insert(calendarIntegrations).values({
                userId: session.user.id,
                provider: 'zoom',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || null,
                expiresAt: expiresAt,
                enabled: true,
            });
        }

        // 連携後に自動同期を実行
        const { syncCalendar } = await import('@/server/actions/calendar');
        const integration = await db.query.calendarIntegrations.findFirst({
            where: (integrations, { and, eq }) => and(
                eq(integrations.userId, userId),
                eq(integrations.provider, 'zoom')
            ),
        });
        if (integration) {
            // 非同期で同期を実行（エラーは無視）
            syncCalendar(integration.id).catch(e => console.error('Auto-sync failed:', e));
        }

        return NextResponse.redirect(new URL('/calendar?success=zoom_connected', request.url));
    } catch (error) {
        console.error('Failed to handle Zoom callback:', error);
        return NextResponse.redirect(new URL('/calendar?error=callback_failed', request.url));
    }
}
