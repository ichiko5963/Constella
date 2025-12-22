'use client';

import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './task-card';
import { updateTaskStatus } from '@/server/actions/task';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// We map generic statuses to Kanban columns
const COLUMNS = [
    { id: 'pending', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
    { id: 'completed', title: 'Done', color: 'bg-green-50' },
];

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: string | null;
    priority: string | null;
    dueDate: Date | null;
}

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<number | null>(null);
    const router = useRouter();

    // Tasks grouped by status
    const tasksByStatus = useMemo(() => {
        return {
            pending: tasks.filter(t => !t.status || t.status === 'pending'),
            in_progress: tasks.filter(t => t.status === 'in_progress' || t.status === 'approved'), // Map approved to in_progress if needed, or keep separate
            completed: tasks.filter(t => t.status === 'completed'),
        };
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveId(active.id as number);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        const activeId = active.id;
        const overId = over?.id;

        if (!overId) return;

        // Determine target column status
        // If overId is a column ID (e.g., 'pending'), then we dropped on the column/empty space
        // If overId is a task ID, we find that task and its column

        let newStatus = '';

        const isOverColumn = COLUMNS.some(col => col.id === overId);
        if (isOverColumn) {
            newStatus = overId as string;
        } else {
            // Find which column the over-task belongs to
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status || 'pending';
            }
        }

        if (!newStatus) return;

        // Update local state optimistically
        const task = tasks.find(t => t.id === activeId);
        if (task && task.status !== newStatus) {
            setTasks((prev) =>
                prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t)
            );

            // Call server action
            await updateTaskStatus(activeId as number, newStatus);
            router.refresh(); // Sync with server consistency
        }

        setActiveId(null);
    }

    // Sync with initialTasks if they change externally (e.g. create task)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const activeTask = tasks.find(t => t.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-x-auto">
                {COLUMNS.map((col) => {
                    const colTasks = tasksByStatus[col.id as keyof typeof tasksByStatus] || [];

                    return (
                        <div key={col.id} className={cn("flex flex-col h-full rounded-lg p-4", col.color)}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">{col.title}</h3>
                                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 shadow-sm">
                                    {colTasks.length}
                                </span>
                            </div>

                            <SortableContext
                                id={col.id} // Important: Column ID acts as container ID for drag check logic
                                items={colTasks.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex-1 space-y-3 min-h-[100px]">
                                    {colTasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    );
                })}
            </div>

            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
