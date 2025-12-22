'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { meetingNotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateMeetingNoteContent(
    noteId: number,
    content: string
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 議事録の所有確認
        const note = await db.query.meetingNotes.findFirst({
            where: eq(meetingNotes.id, noteId),
        });

        if (!note) {
            return { success: false, error: 'Meeting note not found' };
        }

        if (note.userId !== session.user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await db.update(meetingNotes)
            .set({ 
                formattedMinutes: content,
                updatedAt: new Date(),
            })
            .where(eq(meetingNotes.id, noteId));

        if (note.recordingId) {
            revalidatePath(`/recordings/${note.recordingId}`);
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to update meeting note:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to update meeting note: ${errorMessage}` };
    }
}
