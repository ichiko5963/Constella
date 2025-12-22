'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { bookmarks, recordings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface Bookmark {
    id: number;
    recordingId: number;
    userId: string;
    timestamp: number;
    note?: string | null;
    createdAt: Date;
}

export async function addBookmark(
    recordingId: number,
    timestamp: number,
    note?: string,
): Promise<{ success: boolean; bookmarkId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const recording = await db.query.recordings.findFirst({
            where: eq(recordings.id, recordingId),
        });

        if (!recording) {
            return { success: false, error: 'Recording not found' };
        }

        if (recording.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const [newBookmark] = await db.insert(bookmarks).values({
            recordingId,
            userId: session.user.id,
            timestamp,
            note: note?.trim() || null,
        }).returning();

        revalidatePath(`/recordings/${recordingId}`);
        return { success: true, bookmarkId: newBookmark.id };
    } catch (error) {
        console.error('Failed to add bookmark:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to add bookmark: ${errorMessage}` };
    }
}

export async function getBookmarks(
    recordingId: number,
): Promise<{ success: boolean; bookmarks?: Bookmark[]; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const userBookmarks = await db.query.bookmarks.findMany({
            where: and(
                eq(bookmarks.recordingId, recordingId),
                eq(bookmarks.userId, session.user.id),
            ),
            orderBy: (bookmarkTable, { asc }) => [asc(bookmarkTable.timestamp)],
        });

        return { success: true, bookmarks: userBookmarks as Bookmark[] };
    } catch (error) {
        console.error('Failed to get bookmarks:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to get bookmarks: ${errorMessage}` };
    }
}

export async function deleteBookmark(
    bookmarkId: number,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const bookmark = await db.query.bookmarks.findFirst({
            where: eq(bookmarks.id, bookmarkId),
        });

        if (!bookmark) {
            return { success: false, error: 'Bookmark not found' };
        }

        if (bookmark.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await db.delete(bookmarks).where(eq(bookmarks.id, bookmarkId));

        revalidatePath(`/recordings/${bookmark.recordingId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete bookmark:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to delete bookmark: ${errorMessage}` };
    }
}

export async function updateBookmark(
    bookmarkId: number,
    note?: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const bookmark = await db.query.bookmarks.findFirst({
            where: eq(bookmarks.id, bookmarkId),
        });

        if (!bookmark) {
            return { success: false, error: 'Bookmark not found' };
        }

        if (bookmark.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await db.update(bookmarks)
            .set({ note: note?.trim() || null })
            .where(eq(bookmarks.id, bookmarkId));

        revalidatePath(`/recordings/${bookmark.recordingId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update bookmark:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to update bookmark: ${errorMessage}` };
    }
}
