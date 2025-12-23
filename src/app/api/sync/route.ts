import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { recordings, meetingNotes, tasks } from '@/db/schema';
import { logAuditEvent } from '@/lib/audit-log';

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

        let resourceId: number | undefined;

        switch (type) {
            case 'recording':
                // 録音データを同期
                const [recording] = await db.insert(recordings).values({
                    userId: session.user.id,
                    ...data,
                }).returning();
                resourceId = recording.id;
                await logAuditEvent('create', 'recording', resourceId, { synced: true });
                break;

            case 'note':
                // 議事録データを同期
                const [note] = await db.insert(meetingNotes).values({
                    userId: session.user.id,
                    ...data,
                }).returning();
                resourceId = note.id;
                await logAuditEvent('create', 'note', resourceId, { synced: true });
                break;

            case 'task':
                // タスクデータを同期
                const [task] = await db.insert(tasks).values({
                    userId: session.user.id,
                    ...data,
                }).returning();
                resourceId = task.id;
                await logAuditEvent('create', 'task', resourceId, { synced: true });
                break;

            default:
                return NextResponse.json(
                    { error: 'Unknown item type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, resourceId });
    } catch (error) {
        console.error('Failed to sync item:', error);
        return NextResponse.json(
            { error: 'Failed to sync item' },
            { status: 500 }
        );
    }
}

