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

    // Tasks grouped by status (completed tasks are hidden from the board)
    const tasksByStatus = useMemo(() => {
        return {
            pending: tasks.filter(t => !t.status || t.status === 'pending'),
            in_progress: tasks.filter(t => t.status === 'in_progress' || t.status === 'approved'),
            completed: [], // Completed tasks are hidden - they go to "past completed tasks"
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

        // Check if dropped on a column (including 'completed')
        const isOverColumn = COLUMNS.some(col => col.id === overId) || overId === 'completed';
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
            // If moving to completed, remove from board immediately
            if (newStatus === 'completed') {
                setTasks((prev) => prev.filter(t => t.id !== activeId));
            } else {
                setTasks((prev) =>
                    prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t)
                );
            }

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
                {COLUMNS.filter(col => col.id !== 'completed').map((col) => {
                    const colTasks = tasksByStatus[col.id as keyof typeof tasksByStatus] || [];

                    return (
                        <div 
                            key={col.id} 
                            id={col.id}
                            className={cn(
                                "flex flex-col h-full rounded-lg p-4 glass border border-white/10",
                                col.id === 'pending' && "bg-white/5",
                                col.id === 'in_progress' && "bg-blue-500/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white text-lg">{col.title}</h3>
                                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm">
                                    {colTasks.length}
                                </span>
                            </div>

                            <SortableContext
                                id={col.id}
                                items={colTasks.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div 
                                    className="flex-1 space-y-3 min-h-[200px] p-2 rounded-lg"
                                    style={{ 
                                        minHeight: '200px',
                                        background: col.id === 'pending' 
                                            ? 'rgba(255, 255, 255, 0.02)' 
                                            : 'rgba(59, 130, 246, 0.05)'
                                    }}
                                >
                                    {colTasks.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            <p>タスクをドラッグ&ドロップ</p>
                                        </div>
                                    ) : (
                                        colTasks.map(task => (
                                            <TaskCard key={task.id} task={task} />
                                        ))
                                    )}
                                </div>
                            </SortableContext>
                        </div>
                    );
                })}
                
                {/* Done列 - タスクをここにドロップすると完了として非表示になる */}
                <div 
                    id="completed"
                    data-column-id="completed"
                    className="flex flex-col h-full rounded-lg p-4 glass border-2 border-dashed border-green-500/30 bg-green-500/10 hover:border-green-500/50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white text-lg">Done</h3>
                        <span className="bg-green-500/20 px-3 py-1 rounded-full text-xs font-medium text-green-300 shadow-sm">
                            完了
                        </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[200px] p-2 rounded-lg bg-green-500/5">
                        <p className="text-gray-400 text-sm text-center">
                            <span className="block mb-2">✓</span>
                            タスクをここにドロップすると<br />
                            <span className="text-green-400 font-semibold">完了として非表示</span>になります
                        </p>
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
