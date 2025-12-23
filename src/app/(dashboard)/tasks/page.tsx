import { getTasks } from '@/server/actions/task';
import { TaskBoard } from './components/task-board';
import { CreateTaskDialog } from './components/create-task-dialog';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tasks',
    description: 'Manage your action items and tasks.',
};

export default async function TasksPage() {
    const tasks = await getTasks(undefined);

    return (
        <div className="p-8 h-[calc(100vh-theme(spacing.16))] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">タスク管理</h1>
                    <p className="text-gray-400">タスクをドラッグ&ドロップで移動できます</p>
                </div>
                <CreateTaskDialog />
            </div>

            <div className="flex-1 overflow-hidden">
                {/* Mapping DB 'approved' to 'in_progress' visually to simplify MVP board */}
                {/* Completed tasks are filtered out - they go to "past completed tasks" */}
                <TaskBoard initialTasks={tasks?.filter(t => t.status !== 'completed').map(t => ({
                    ...t,
                    status: t.status === 'approved' ? 'in_progress' : t.status || 'pending'
                })) || []} />
            </div>
        </div>
    );
}
