'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteProject(projectId: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        await db.delete(projects).where(eq(projects.id, projectId));
        revalidatePath('/projects');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete project:', error);
        return { success: false, error: 'Failed to delete project' };
    }
}
