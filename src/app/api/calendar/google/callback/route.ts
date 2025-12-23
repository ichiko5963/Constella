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
        return NextResponse.redirect(new URL('/settings?error=calendar_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
    }

    try {
        // アクセストークンを取得
        // リダイレクトURIはconnectルートと同じものを使用する必要がある
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const redirectUri = `${baseUrl}/api/calendar/google/callback`;
        
        // デバッグ用: リダイレクトURIをログに出力（本番環境では削除推奨）
        if (process.env.NODE_ENV === 'development') {
            console.log('Google OAuth callback redirect URI:', redirectUri);
        }
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', tokenData);
            return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url));
        }

        // カレンダー統合を保存または更新
        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
        }
        const existing = await db.query.calendarIntegrations.findFirst({
            where: (integrations, { and, eq }) => and(
                eq(integrations.userId, userId),
                eq(integrations.provider, 'google')
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
                provider: 'google',
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
                eq(integrations.provider, 'google')
            ),
        });
        if (integration) {
            // 非同期で同期を実行（エラーは無視）
            syncCalendar(integration.id).catch(e => console.error('Auto-sync failed:', e));
        }

        return NextResponse.redirect(new URL('/calendar?success=google_calendar_connected', request.url));
    } catch (error) {
        console.error('Failed to handle Google Calendar callback:', error);
        return NextResponse.redirect(new URL('/settings?error=callback_failed', request.url));
    }
}

