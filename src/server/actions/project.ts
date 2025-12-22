'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { desc, eq, and } from 'drizzle-orm';

import { users } from '@/db/schema';

export async function createProject(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = (formData.get('color') as string) || '#007AFF';

    if (!name) {
        return { success: false, error: 'Project name is required' };
    }

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });
        const now = new Date();

        if (!existingUser) {
            const fallbackName = session.user.name
                || session.user.email?.split('@')[0]
                || 'User';

            await db.insert(users).values({
                id: session.user.id,
                name: fallbackName,
                email: session.user.email || '',
                emailVerified: true,
                image: session.user.image || null,
                createdAt: now,
                updatedAt: now,
            });
        }

        const [newProject] = await db.insert(projects).values({
            userId: session.user.id,
            name: name.trim(),
            description: description?.trim() || null,
            color: color || '#007AFF',
        }).returning();

        revalidatePath('/projects');
        return { success: true, projectId: newProject.id };
    } catch (error) {
        console.error('Failed to create project:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { 
            success: false, 
            error: `Failed to create project: ${errorMessage}` 
        };
    }
}

export async function getProjects() {
    const session = await auth();

    if (!session?.user?.id) return [];

    const userProjects = await db.select().from(projects)
        .where(eq(projects.userId, session.user.id))
        .orderBy(desc(projects.createdAt));

    return userProjects;
}


export async function updateProject(projectId: number, formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const isArchived = formData.get('isArchived') === 'true';

    try {
        await db.update(projects)
            .set({
                name,
                description,
                color,
                isArchived,
                updatedAt: new Date(),
            })
            .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));

        revalidatePath('/projects');
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update project:', error);
        return { success: false, error: 'Failed to update project' };
    }
}

export async function archiveProject(projectId: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.update(projects)
            .set({ isArchived: true })
            .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));

        revalidatePath('/projects');
        return { success: true };
    } catch (error) {
        console.error('Failed to archive project:', error);
        return { success: false, error: 'Failed to archive project' };
    }
}
