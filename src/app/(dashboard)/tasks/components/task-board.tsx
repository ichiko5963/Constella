'use client';

import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './task-card';
import { DroppableColumn } from './droppable-column';
import { updateTaskStatus } from '@/server/actions/task';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// We map generic statuses to Kanban columns
const COLUMNS = [
    { 
        id: 'pending', 
        title: 'To Do', 
        gradient: 'from-gray-500/20 via-gray-400/15 to-gray-500/20',
        borderColor: 'border-gray-400/30',
        textColor: 'text-gray-200'
    },
    { 
        id: 'in_progress', 
        title: 'In Progress', 
        gradient: 'from-blue-500/20 via-blue-400/15 to-blue-500/20',
        borderColor: 'border-blue-400/30',
        textColor: 'text-blue-200'
    },
    { 
        id: 'completed', 
        title: 'Done', 
        gradient: 'from-green-500/20 via-green-400/15 to-green-500/20',
        borderColor: 'border-green-400/30',
        textColor: 'text-green-200'
    },
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
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px移動したらドラッグ開始
            },
        }),
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

        if (!overId) {
            setActiveId(null);
            return;
        }

        // Determine target column status
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
            } else {
                // If we can't find the task, try to get status from active task's data
                const activeTask = tasks.find(t => t.id === activeId);
                if (activeTask) {
                    // Stay in same column if we can't determine target
                    setActiveId(null);
                    return;
                }
            }
        }

        if (!newStatus) {
            setActiveId(null);
            return;
        }

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
            try {
                await updateTaskStatus(activeId as number, newStatus);
                router.refresh(); // Sync with server consistency
            } catch (error) {
                console.error('Failed to update task status:', error);
                // Revert optimistic update on error
                setTasks((prev) => {
                    const reverted = prev.map(t => t.id === activeId ? { ...t, status: task.status } : t);
                    if (newStatus === 'completed') {
                        reverted.push(task);
                    }
                    return reverted;
                });
            }
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
                        <DroppableColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            count={colTasks.length}
                            isEmpty={colTasks.length === 0}
                            taskIds={colTasks.map(t => t.id)}
                            gradient={col.gradient}
                            borderColor={col.borderColor}
                            textColor={col.textColor}
                        >
                            {colTasks.map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </DroppableColumn>
                    );
                })}
                
                {/* Done列 - タスクをここにドロップすると完了として非表示になる */}
                <DroppableColumn
                    id="completed"
                    title="Done"
                    count={0}
                    isEmpty={true}
                    taskIds={[]}
                    emptyMessage={
                        <div>
                            <span className="block mb-2 text-2xl">✓</span>
                            タスクをここにドロップすると<br />
                            <span className="text-green-400 font-semibold">完了として非表示</span>になります
                        </div>
                    }
                    gradient="from-green-500/20 via-green-400/15 to-green-500/20"
                    borderColor="border-green-400/30"
                    textColor="text-green-200"
                >
                    {/* Done列にはタスクは表示されない */}
                </DroppableColumn>
            </div>

            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
