'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { files, meetingNotes } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

/**
 * フォルダを作成
 */
export async function createFolder(
    projectId: number,
    name: string,
    parentFileId?: number | null
): Promise<{ success: boolean; folderId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const [inserted] = await db.insert(files).values({
            userId: session.user.id,
            projectId,
            name,
            fileType: 'folder',
            parentFileId: parentFileId || null,
        }).returning();

        revalidatePath(`/projects/${projectId}`);
        return { success: true, folderId: inserted.id };
    } catch (error) {
        console.error('Failed to create folder:', error);
        return { success: false, error: 'Failed to create folder' };
    }
}

/**
 * フォルダ階層を取得
 */
export async function getFolderTree(projectId: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const allFiles = await db.query.files.findMany({
            where: (files, { and, eq }) => and(
                eq(files.userId, session.user.id),
                eq(files.projectId, projectId)
            ),
        });

        // 階層構造を構築
        const fileMap = new Map<number, any>();
        const rootFiles: any[] = [];

        // すべてのファイルをマップに追加
        allFiles.forEach(file => {
            fileMap.set(file.id, {
                ...file,
                children: [],
            });
        });

        // 階層を構築
        allFiles.forEach(file => {
            const fileNode = fileMap.get(file.id)!;
            if (file.parentFileId && fileMap.has(file.parentFileId)) {
                const parent = fileMap.get(file.parentFileId)!;
                parent.children.push(fileNode);
            } else {
                rootFiles.push(fileNode);
            }
        });

        return {
            success: true,
            tree: rootFiles,
        };
    } catch (error) {
        console.error('Failed to get folder tree:', error);
        return { success: false, error: 'Failed to retrieve folder tree' };
    }
}

/**
 * ファイルを移動
 */
export async function moveFile(
    fileId: number,
    newParentFileId: number | null
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const file = await db.query.files.findFirst({
            where: eq(files.id, fileId),
        });

        if (!file || file.userId !== session.user.id) {
            return { success: false, error: 'File not found or unauthorized' };
        }

        // 循環参照をチェック
        if (newParentFileId) {
            let currentParentId: number | null = newParentFileId;
            while (currentParentId) {
                if (currentParentId === fileId) {
                    return { success: false, error: 'Cannot move folder into itself' };
                }
                const parent = await db.query.files.findFirst({
                    where: eq(files.id, currentParentId),
                });
                currentParentId = parent?.parentFileId || null;
            }
        }

        await db.update(files)
            .set({
                parentFileId: newParentFileId,
                updatedAt: new Date(),
            })
            .where(eq(files.id, fileId));

        revalidatePath(`/projects/${file.projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to move file:', error);
        return { success: false, error: 'Failed to move file' };
    }
}

/**
 * 共有トークンを生成
 */
export async function generateShareToken(noteId: number): Promise<{ success: boolean; shareToken?: string; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const note = await db.query.meetingNotes.findFirst({
            where: eq(meetingNotes.id, noteId),
        });

        if (!note || note.userId !== session.user.id) {
            return { success: false, error: 'Note not found or unauthorized' };
        }

        const shareToken = nanoid(32);

        await db.update(meetingNotes)
            .set({
                shareToken,
                updatedAt: new Date(),
            })
            .where(eq(meetingNotes.id, noteId));

        revalidatePath(`/recordings`);
        return { success: true, shareToken };
    } catch (error) {
        console.error('Failed to generate share token:', error);
        return { success: false, error: 'Failed to generate share token' };
    }
}

/**
 * 共有トークンでノートを取得
 */
export async function getNoteByShareToken(shareToken: string) {
    try {
        const note = await db.query.meetingNotes.findFirst({
            where: eq(meetingNotes.shareToken, shareToken),
            with: {
                project: true,
            },
        });

        if (!note) {
            return { success: false, error: 'Note not found' };
        }

        return {
            success: true,
            note: {
                id: note.id,
                title: note.title,
                summary: note.summary,
                formattedMinutes: note.formattedMinutes,
                meetingDate: note.meetingDate,
                projectName: note.project?.name,
            },
        };
    } catch (error) {
        console.error('Failed to get note by share token:', error);
        return { success: false, error: 'Failed to retrieve note' };
    }
}

/**
 * 共有を無効化
 */
export async function revokeShareToken(noteId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const note = await db.query.meetingNotes.findFirst({
            where: eq(meetingNotes.id, noteId),
        });

        if (!note || note.userId !== session.user.id) {
            return { success: false, error: 'Note not found or unauthorized' };
        }

        await db.update(meetingNotes)
            .set({
                shareToken: null,
                updatedAt: new Date(),
            })
            .where(eq(meetingNotes.id, noteId));

        revalidatePath(`/recordings`);
        return { success: true };
    } catch (error) {
        console.error('Failed to revoke share token:', error);
        return { success: false, error: 'Failed to revoke share token' };
    }
}
