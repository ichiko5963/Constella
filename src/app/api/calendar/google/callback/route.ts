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
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/calendar/google/callback`;
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

        return NextResponse.redirect(new URL('/settings?success=calendar_connected', request.url));
    } catch (error) {
        console.error('Failed to handle Google Calendar callback:', error);
        return NextResponse.redirect(new URL('/settings?error=callback_failed', request.url));
    }
}

