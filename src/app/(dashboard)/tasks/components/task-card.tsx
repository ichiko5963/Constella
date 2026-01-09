'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, Edit2 } from 'lucide-react';
import { TaskEditDialog } from './task-edit-dialog';

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: string | null;
    priority: string | null;
    dueDate: Date | null;
}

interface TaskCardProps {
    task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColor =
        task.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                'bg-blue-100 text-blue-700 border-blue-200';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="touch-none"
        >
            <Card className="hover:shadow-md hover:scale-[1.01] transition-all border border-gray-200 bg-white cursor-grab active:cursor-grabbing">
                <CardContent
                    className="p-3 space-y-2"
                    {...listeners}
                >
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{task.title}</h4>
                        <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded border uppercase font-semibold",
                                task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                                task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                'bg-blue-50 text-blue-600 border-blue-200'
                            )}>
                                {task.priority || 'medium'}
                            </span>
                            <div onClick={(e) => e.stopPropagation()}>
                                <TaskEditDialog task={task} />
                            </div>
                        </div>
                    </div>

                    {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                    )}

                    {task.dueDate && (
                        <div className="flex items-center text-xs text-gray-400 pt-2 border-t border-gray-100 mt-2">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString('ja-JP')}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
