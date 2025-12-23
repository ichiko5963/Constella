import { auth } from '@/auth';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTaskCandidates } from '@/server/actions/task-approval';
import { CalendarPageClient } from './calendar-page-client';

export default async function CalendarPage() {
    const session = await auth();

    if (!session?.user?.id) return null;

    const userTasks = await db.query.tasks.findMany({
        where: eq(tasks.userId, session.user.id),
    });

    const formattedTasks = userTasks
        .filter(t => t.dueDate) // Filter out tasks without due date for calendar
        .map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate!, // Drizzle returns Date object
            completed: t.status === 'completed' || t.status === 'approved',
            priority: t.priority as 'low' | 'medium' | 'high' | undefined,
            projectId: t.projectId || undefined,
        }));

    const candidates = await getTaskCandidates();

    return <CalendarPageClient formattedTasks={formattedTasks} candidates={candidates} />;
}
