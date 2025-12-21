'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';

export async function createProject(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        return { success: false, error: 'Project name is required' };
    }

    try {
        const [newProject] = await db.insert(projects).values({
            userId: session.user.id,
            name,
            description,
            color: '#007AFF', // Default color
        }).returning();

        revalidatePath('/dashboard/projects');
        return { success: true, projectId: newProject.id };
    } catch (error) {
        console.error('Failed to create project:', error);
        return { success: false, error: 'Failed to create project' };
    }
}

export async function getProjects() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) return [];

    const userProjects = await db.select().from(projects)
        .where(eq(projects.userId, session.user.id))
        .orderBy(desc(projects.createdAt));

    return userProjects;
}
