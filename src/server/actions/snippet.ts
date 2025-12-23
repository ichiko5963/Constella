'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { snippets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createSnippet(
    noteId: number | null,
    title: string,
    content: string,
    tags?: string[],
    startTime?: number,
    endTime?: number
): Promise<{ success: boolean; error?: string; snippetId?: number }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const [inserted] = await db.insert(snippets).values({
            userId: session.user.id,
            noteId: noteId || null,
            title,
            content,
            tags: tags ? JSON.stringify(tags) : null,
            startTime: startTime || null,
            endTime: endTime || null,
        }).returning();

        revalidatePath('/recordings');
        return { success: true, snippetId: inserted.id };
    } catch (error) {
        console.error('Failed to create snippet:', error);
        return { success: false, error: 'Failed to create snippet' };
    }
}

export async function getSnippets(noteId?: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const snippetList = await db.query.snippets.findMany({
            where: (snippets, { and, eq }) => {
                const conditions = [eq(snippets.userId, session.user.id)];
                if (noteId) {
                    conditions.push(eq(snippets.noteId, noteId));
                }
                return and(...conditions);
            },
            orderBy: (snippets, { desc }) => [desc(snippets.createdAt)],
        });

        return {
            success: true,
            snippets: snippetList.map(s => ({
                id: s.id,
                noteId: s.noteId,
                title: s.title,
                content: s.content,
                tags: s.tags ? JSON.parse(s.tags) : [],
                startTime: s.startTime,
                endTime: s.endTime,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get snippets:', error);
        return { success: false, error: 'Failed to retrieve snippets' };
    }
}

export async function updateSnippet(
    snippetId: number,
    title?: string,
    content?: string,
    tags?: string[]
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const existing = await db.query.snippets.findFirst({
            where: eq(snippets.id, snippetId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Snippet not found or unauthorized' };
        }

        await db.update(snippets)
            .set({
                title: title ?? existing.title,
                content: content ?? existing.content,
                tags: tags !== undefined ? JSON.stringify(tags) : existing.tags,
                updatedAt: new Date(),
            })
            .where(eq(snippets.id, snippetId));

        revalidatePath('/recordings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update snippet:', error);
        return { success: false, error: 'Failed to update snippet' };
    }
}

export async function deleteSnippet(snippetId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const existing = await db.query.snippets.findFirst({
            where: eq(snippets.id, snippetId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Snippet not found or unauthorized' };
        }

        await db.delete(snippets)
            .where(eq(snippets.id, snippetId));

        revalidatePath('/recordings');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete snippet:', error);
        return { success: false, error: 'Failed to delete snippet' };
    }
}

