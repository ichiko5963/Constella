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
    gradient?: string;
    borderColor?: string;
    textColor?: string;
}

export function DroppableColumn({ 
    id, 
    title, 
    count, 
    children, 
    className,
    isEmpty = false,
    emptyMessage = 'タスクをドラッグ&ドロップ',
    taskIds = [],
    gradient = 'from-gray-500/20 via-gray-400/15 to-gray-500/20',
    borderColor = 'border-white/10',
    textColor = 'text-white'
}: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "flex flex-col h-full rounded-lg p-4 glass border transition-all relative overflow-hidden",
                `bg-gradient-to-br ${gradient}`,
                borderColor,
                isOver && "border-primary border-2 scale-[1.02] shadow-lg shadow-primary/20",
                className
            )}
        >
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className={cn("font-bold text-lg", textColor)}>{title}</h3>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm border border-white/10">
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
                        "flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors relative z-10",
                        isOver && "bg-primary/20 backdrop-blur-sm"
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
