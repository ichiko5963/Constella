'use server';

import { db } from '@/db';
import { recordings } from '@/db/schema';
import { getPresignedUploadUrl } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function createRecordingUploadUrl(projectId: number, fileType: string = 'audio/webm') {
    // 1. Authenticate user
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    // 2. Generate unique key
    const fileExtension = fileType.split('/')[1] || 'webm';
    const key = `recordings/${session.user.id}/${nanoid()}.${fileExtension}`;

    // 3. Get Presigned URL
    try {
        const { url } = await getPresignedUploadUrl(key, fileType);

        // 4. Create DB Entry (Initial status: uploading)
        // Note: We might want to create the record first to track it, or after upload.
        // Here we return the URL and let the client upload. 
        // We can verify upload later or create the record now.
        // Creating it now allows us to return an ID to the client.

        // Check if project belongs to user (SKIP for MVP speed, but TODO add check)

        const [inserted] = await db.insert(recordings).values({
            userId: session.user.id,
            projectId: projectId,
            audioKey: key,
            audioUrl: url.split('?')[0], // Base URL without signature
            status: 'uploading',
            transcription: '', // Initialize
        }).returning();

        return {
            success: true,
            url,
            recordingId: inserted.id,
            key
        };

    } catch (error) {
        console.error('Failed to create upload URL:', error);
        return { success: false, error: 'Failed to generate upload URL' };
    }
}

export async function updateRecordingStatus(recordingId: number, status: 'transcribing' | 'processing' | 'completed' | 'failed') {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { success: false, error: 'Unauthorized' };
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
