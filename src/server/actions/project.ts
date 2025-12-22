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
        // ユーザーがデータベースに存在するか確認
        const existingUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        // ユーザーが存在しない場合は作成（フォールバック）
        if (!existingUser) {
            await db.insert(users).values({
                id: session.user.id,
                name: session.user.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                emailVerified: 1,
                image: session.user.image || null,
                createdAt: new Date(),
                updatedAt: new Date(),
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
