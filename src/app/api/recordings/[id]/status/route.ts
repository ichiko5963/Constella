import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { recordings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 録音のステータスを取得
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const recordingId = parseInt(id, 10);

        if (isNaN(recordingId)) {
            return NextResponse.json({ error: 'Invalid recording ID' }, { status: 400 });
        }

        const recording = await db.query.recordings.findFirst({
            where: and(
                eq(recordings.id, recordingId),
                eq(recordings.userId, session.user.id)
            ),
        });

        if (!recording) {
            return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: recording.status,
            recordingId: recording.id,
        });
    } catch (error) {
        console.error('Failed to get recording status:', error);
        return NextResponse.json(
            { error: 'Failed to get recording status' },
            { status: 500 }
        );
    }
}
