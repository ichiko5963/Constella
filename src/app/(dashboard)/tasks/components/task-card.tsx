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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-lg hover:scale-[1.02] transition-all glass border border-white/10 bg-white/10 hover:bg-white/15">
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-sm text-white line-clamp-2">{task.title}</h4>
                        <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded border uppercase font-bold",
                                task.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            )}>
                                {task.priority || 'medium'}
                            </span>
                            <TaskEditDialog task={task} />
                        </div>
                    </div>

                    {task.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-white/10 mt-2">
                        {task.dueDate && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString('ja-JP')}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
