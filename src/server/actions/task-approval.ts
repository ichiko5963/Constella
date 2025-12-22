'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { tasks, taskCandidates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function approveTaskCandidate(candidateId: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const candidate = await db.query.taskCandidates.findFirst({
            where: eq(taskCandidates.id, candidateId),
        });

        if (!candidate) return { success: false, error: 'Candidate not found' };

        // Move to Tasks
        await db.insert(tasks).values({
            userId: session.user.id,
            projectId: candidate.suggestedProjectId,
            fileId: candidate.suggestedFileId,
            recordingId: candidate.recordingId,
            title: candidate.title,
            description: candidate.description,
            priority: candidate.suggestedPriority,
            dueDate: candidate.suggestedDueDate,
            status: 'pending',
            aiGenerated: true,
            aiConfidence: candidate.aiConfidence,
        });

        // Mark as approved
        await db.update(taskCandidates)
            .set({ isApproved: true })
            .where(eq(taskCandidates.id, candidateId));

        revalidatePath('/calendar');
        return { success: true };
    } catch (error) {
        console.error('Failed to approve task:', error);
        return { success: false, error: 'Failed to approve task' };
    }
}

export async function rejectTaskCandidate(candidateId: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        await db.update(taskCandidates)
            .set({ isApproved: false })
            .where(eq(taskCandidates.id, candidateId));

        revalidatePath('/calendar');
        return { success: true };
    } catch (error) {
        console.error('Failed to reject task:', error);
        return { success: false, error: 'Failed to reject task' };
    }
}

export async function getTaskCandidates() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await db.query.taskCandidates.findMany({
        where: (candidates, { and, eq, isNull }) => and(
            eq(candidates.userId, session.user!.id!),
            isNull(candidates.isApproved)
        ),
        orderBy: (candidates, { desc }) => [desc(candidates.createdAt)],
    });
}
