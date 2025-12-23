'use server';

import { db } from '@/db';
import { tasks } from '@/db/schema';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit-log';

export async function getTasks(projectId?: number) {
    const session = await auth();

    if (!session?.user?.id) return [];

    const conditions = [eq(tasks.userId, session.user.id)];
    if (projectId) {
        conditions.push(eq(tasks.projectId, projectId));
    }

    const userTasks = await db.query.tasks.findMany({
        where: and(...conditions),
        orderBy: desc(tasks.createdAt),
        with: {
            project: true
        }
    });

    return userTasks;
}

export async function createTask(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = (formData.get('status') as string) || 'pending';
    const priority = (formData.get('priority') as string) || 'medium';
    const projectIdRaw = formData.get('projectId');
    const projectId = projectIdRaw ? parseInt(projectIdRaw as string) : undefined;
    const dueDateRaw = formData.get('dueDate');
    const dueDate = dueDateRaw ? new Date(dueDateRaw as string) : undefined;

    if (!title) {
        return { success: false, error: 'Title is required' };
    }

    try {
        const [newTask] = await db.insert(tasks).values({
            userId: session.user.id,
            projectId,
            title,
            description,
            status: status, // pending, in_progress, completed, etc.
            priority,
            dueDate,
        }).returning();

        // 監査ログを記録
        await logAuditEvent('create', 'task', newTask.id, {
            projectId: projectId || null,
            status,
            priority,
        });

        revalidatePath('/tasks');
        return { success: true, taskId: newTask.id };
    } catch (error) {
        console.error('Failed to create task:', error);
        return { success: false, error: 'Failed to create task' };
    }
}

export async function updateTaskStatus(taskId: number, newStatus: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.update(tasks)
            .set({ status: newStatus })
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

        // 監査ログを記録
        await logAuditEvent('update', 'task', taskId, {
            status: newStatus,
        });

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('Failed to update task status:', error);
        return { success: false, error: 'Failed to update task status' };
    }
}

export async function deleteTask(taskId: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 監査ログを記録（削除前）
        await logAuditEvent('delete', 'task', taskId);

        await db.delete(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete task:', error);
        return { success: false, error: 'Failed to delete task' };
    }
}

export async function updateTask(taskId: number, formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = (formData.get('priority') as string) || 'medium';
    const dueDateRaw = formData.get('dueDate');
    const dueDate = dueDateRaw ? new Date(dueDateRaw as string) : undefined;

    try {
        await db.update(tasks)
            .set({
                title,
                description,
                priority,
                dueDate,
                updatedAt: new Date(),
            })
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('Failed to update task:', error);
        return { success: false, error: 'Failed to update task' };
    }
}
