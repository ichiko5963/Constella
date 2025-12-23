'use server';

import { db } from '@/db';
import { recordings, projects } from '@/db/schema';
import { getPresignedUploadUrl } from '@/lib/storage';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/audit-log';

export async function createRecordingUploadUrl(projectId?: number, fileType: string = 'audio/webm') {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    // 2. Generate unique key
    const fileExtension = fileType.split('/')[1] || 'webm';
    const key = `recordings/${session.user.id}/${nanoid()}.${fileExtension}`;

    // 3. Get Presigned URL
    try {
        // S3設定の確認
        if (!process.env.S3_BUCKET_NAME) {
            console.error('S3_BUCKET_NAME is not set');
            return { success: false, error: 'S3ストレージが設定されていません。環境変数を確認してください。' };
        }

        const { url } = await getPresignedUploadUrl(key, fileType);

        // 4. Validate Project IF provided
        if (projectId) {
            const project = await db.query.projects.findFirst({
                where: (p, { and, eq }) => and(
                    eq(p.id, projectId),
                    eq(p.userId, session.user!.id!)
                )
            });

            if (!project) {
                return { success: false, error: 'Project not found or unauthorized' };
            }
        }

        const [inserted] = await db.insert(recordings).values({
            userId: session.user.id,
            projectId: projectId || null, // Allow null
            audioKey: key,
            audioUrl: url.split('?')[0], // Base URL without signature
            status: 'uploading',
            transcription: '', // Initialize
        }).returning();

        // 監査ログを記録
        await logAuditEvent('create', 'recording', inserted.id, {
            projectId: projectId || null,
            fileType,
        });

        return {
            success: true,
            url,
            recordingId: inserted.id,
            key
        };


    } catch (error) {
        console.error('Failed to create upload URL:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { 
            success: false, 
            error: `アップロードURLの生成に失敗しました: ${errorMessage}` 
        };
    }
}

export async function updateRecordingStatus(recordingId: number, status: 'transcribing' | 'processing' | 'completed' | 'failed', skipAuth?: boolean) {
    // 予約URLから予約された会議の自動処理の場合は認証をスキップ
    if (!skipAuth) {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }
    }

    try {
        await db.update(recordings)
            .set({ status })
            .where(eq(recordings.id, recordingId));

        revalidatePath('/dashboard'); // or project page
        return { success: true };
    } catch (error) {
        console.error('Failed to update status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}
