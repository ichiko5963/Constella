import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { recordings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPresignedUploadUrl } from '@/lib/storage';
import { nanoid } from 'nanoid';

/**
 * モバイル/PWA録音アップロード用エンドポイント
 * Notta Memo相当の機能
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { projectId, duration, fileName } = body;

        // 録音レコードを作成
        const audioKey = `recordings/${session.user.id}/${nanoid()}.webm`;
        const [recording] = await db.insert(recordings).values({
            userId: session.user.id,
            projectId: projectId || null,
            audioKey: audioKey,
            audioUrl: '', // アップロード後に更新
            status: 'uploading',
            duration: duration || null,
            transcription: null,
        }).returning();

        // 事前署名URLを生成
        const { url } = await getPresignedUploadUrl(audioKey, 'audio/webm');

        return NextResponse.json({
            success: true,
            recordingId: recording.id,
            uploadUrl: url,
            audioKey: audioKey,
        });
    } catch (error) {
        console.error('Failed to create mobile recording:', error);
        return NextResponse.json(
            { error: 'Failed to create recording' },
            { status: 500 }
        );
    }
}

/**
 * アップロード完了通知
 */
export async function PUT(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { recordingId, audioUrl } = body;

        // 録音レコードを更新
        await db.update(recordings)
            .set({
                audioUrl: audioUrl,
                status: 'uploaded',
            })
            .where(and(
                eq(recordings.id, recordingId),
                eq(recordings.userId, session.user.id)
            ));

        // バックグラウンド処理を開始
        const { processRecording } = await import('@/server/actions/process-audio');
        processRecording(recordingId).catch((error) => {
            console.error('Processing failed:', error);
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update recording:', error);
        return NextResponse.json(
            { error: 'Failed to update recording' },
            { status: 500 }
        );
    }
}
