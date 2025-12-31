import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Google OAuth認証URLを生成
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // リダイレクトURIを決定（Google側のAuthorized redirect URIと必ず一致させる）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
        console.error('NEXT_PUBLIC_APP_URL is not set. Set it to e.g. http://localhost:3000');
        return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL is not set' }, { status: 500 });
    }
    const redirectUri = `${baseUrl}/api/calendar/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
    const state = session.user.id; // セッションIDをstateとして使用

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        access_type: 'offline',
        prompt: 'consent',
        state: state,
    })}`;

    return NextResponse.redirect(authUrl);
}

