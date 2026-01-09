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
    bgColor?: string;
    borderColor?: string;
    textColor?: string;
    badgeColor?: string;
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
    bgColor = 'bg-gray-50',
    borderColor = 'border-gray-200',
    textColor = 'text-gray-700',
    badgeColor = 'bg-gray-200 text-gray-700'
}: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col h-full rounded-xl p-4 border transition-all",
                bgColor,
                borderColor,
                isOver && "border-gray-900 ring-2 ring-gray-900/20 scale-[1.01]",
                className
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-semibold text-base", textColor)}>{title}</h3>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", badgeColor)}>
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
                        isOver && "bg-gray-100"
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
