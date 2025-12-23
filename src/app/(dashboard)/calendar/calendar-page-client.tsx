'use client';

import { useState } from 'react';
import { Calendar } from '@/components/calendar/calendar';
import { CalendarEventsList } from '@/components/calendar/calendar-events-list';
import { ManualJoinButton } from '@/components/meeting/manual-join-button';
import { DailyTaskManager } from '@/components/task/daily-task-manager';
import { TaskApprovalList } from '@/components/task/task-approval-list';

interface CalendarPageClientProps {
    formattedTasks: Array<{
        id: number;
        title: string;
        dueDate: Date;
        completed: boolean;
        priority?: 'low' | 'medium' | 'high';
        projectId?: number;
    }>;
    candidates: any[];
}

export function CalendarPageClient({ formattedTasks, candidates }: CalendarPageClientProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">カレンダー</h1>
                    <p className="text-gray-400">スケジュールとタスクを管理</p>
                </div>
                <ManualJoinButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Calendar 
                        tasks={formattedTasks} 
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <CalendarEventsList />
                    <DailyTaskManager selectedDate={selectedDate} />
                </div>
            </div>

            <TaskApprovalList candidates={candidates} />
        </div>
    );
}
