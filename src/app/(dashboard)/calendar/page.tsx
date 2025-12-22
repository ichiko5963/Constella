import { Calendar } from '@/components/calendar/calendar';
import { CalendarEventsList } from '@/components/calendar/calendar-events-list';
import { auth } from '@/auth';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTaskCandidates } from '@/server/actions/task-approval';
import { TaskApprovalList } from '@/components/task/task-approval-list';

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
        }));

    const candidates = await getTaskCandidates();

    return (
        <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">カレンダー</h1>
                    <p className="text-gray-400">スケジュールとタスクを管理</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Calendar tasks={formattedTasks} />
                </div>
                <div className="lg:col-span-1">
                    <CalendarEventsList />
                </div>
            </div>

            <TaskApprovalList candidates={candidates} />
        </div>
    );
}
