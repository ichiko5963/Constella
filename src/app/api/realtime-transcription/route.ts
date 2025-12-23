import { NextRequest } from 'next/server';
import { auth } from '@/auth';

/**
 * リアルタイム文字起こしWebSocketエンドポイント
 * OpenAI Realtime APIまたはDeepgram APIへのプロキシ
 */
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    // WebSocketアップグレード
    // 注意: Next.jsのApp RouterではWebSocketを直接サポートしていないため、
    // 実際の実装では専用のWebSocketサーバー（Cloudflare Workers、PartyKit等）が必要
    
    // ここではSSE（Server-Sent Events）を使用した代替実装のプレースホルダー
    return new Response(null, {
        status: 426, // Upgrade Required
        headers: {
            'Upgrade': 'websocket',
            'Connection': 'Upgrade',
        },
    });
}

/**
 * SSEを使用したリアルタイム文字起こし（代替実装）
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { audioChunk } = await req.json();

        // TODO: OpenAI Realtime APIまたはDeepgram APIに音声チャンクを送信
        // 現在はプレースホルダー実装
        
        // OpenAI Realtime APIの例（実装は後で追加）
        // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // const transcription = await openai.audio.transcriptions.create({
        //     file: audioChunk,
        //     model: 'whisper-1',
        // });

        return Response.json({
            success: true,
            text: '', // 実際の文字起こし結果
            isFinal: false,
        });
    } catch (error) {
        console.error('Failed to process realtime transcription:', error);
        return Response.json(
            { error: 'Failed to process transcription' },
            { status: 500 }
        );
    }
}

