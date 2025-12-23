'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

interface DroppableColumnProps {
    id: string;
    title: string;
    count: number;
    children: React.ReactNode;
    className?: string;
    isEmpty?: boolean;
    emptyMessage?: React.ReactNode;
    taskIds?: number[];
}

export function DroppableColumn({ 
    id, 
    title, 
    count, 
    children, 
    className,
    isEmpty = false,
    emptyMessage = 'タスクをドラッグ&ドロップ',
    taskIds = []
}: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "flex flex-col h-full rounded-lg p-4 glass border transition-all",
                isOver && "border-primary border-2 scale-[1.02]",
                className
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm">
                    {count}
                </span>
            </div>

            <SortableContext
                id={id}
                items={taskIds}
                strategy={verticalListSortingStrategy}
            >
                <div 
                    className={cn(
                        "flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors",
                        isOver && "bg-primary/10"
                    )}
                    style={{ 
                        minHeight: '200px',
                    }}
                >
                    {isEmpty ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
                            {emptyMessage}
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
