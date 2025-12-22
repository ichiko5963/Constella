import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { recordings, meetingNotes, tasks } from '@/db/schema';

/**
 * クロスデバイス同期エンドポイント
 * PWA/モバイルから送信されたデータをTursoに同期
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const item = await req.json();
        const { type, data } = item;

        switch (type) {
            case 'recording':
                // 録音データを同期
                await db.insert(recordings).values({
                    userId: session.user.id,
                    ...data,
                });
                break;

            case 'note':
                // 議事録データを同期
                await db.insert(meetingNotes).values({
                    userId: session.user.id,
                    ...data,
                });
                break;

            case 'task':
                // タスクデータを同期
                await db.insert(tasks).values({
                    userId: session.user.id,
                    ...data,
                });
                break;

            default:
                return NextResponse.json(
                    { error: 'Unknown item type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to sync item:', error);
        return NextResponse.json(
            { error: 'Failed to sync item' },
            { status: 500 }
        );
    }
}
