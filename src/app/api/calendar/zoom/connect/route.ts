import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Zoom OAuth認証URLを生成
    const clientId = process.env.ZOOM_CLIENT_ID;
    if (!clientId) {
        return NextResponse.redirect(new URL('/calendar?error=zoom_not_configured', request.url));
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/calendar/zoom/callback`;
    const state = session.user.id; // セッションIDをstateとして使用

    const authUrl = `https://zoom.us/oauth/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state: state,
    })}`;

    return NextResponse.redirect(authUrl);
}
