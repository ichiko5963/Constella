'use client';

import { useState } from 'react';
import { Calendar } from '@/components/calendar/calendar';
import { CalendarEventsList } from '@/components/calendar/calendar-events-list';
import { ManualJoinButton } from '@/components/meeting/manual-join-button';
import { TaskApprovalList } from '@/components/task/task-approval-list';
import { BookingSettingsManager } from '@/components/scheduler/booking-settings-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';

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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header - Compact */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">カレンダー</h1>
                <p className="text-gray-500 text-sm mt-1">スケジュールとタスクを管理</p>
            </div>

            {/* Main Grid - Calendar Left, Booking URL Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <Calendar
                        tasks={formattedTasks}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />
                </div>

                {/* Right Sidebar - Booking URL Management */}
                <div className="space-y-4">
                    <Card className="border-gray-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Link2 className="w-4 h-4" />
                                予約URL管理
                            </CardTitle>
                            <p className="text-xs text-gray-500">
                                他のユーザーが予約できるURLを作成
                            </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <BookingSettingsManager compact />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Below Section - Manual Join & Upcoming Meetings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Meeting Join */}
                <div>
                    <ManualJoinButton />
                </div>

                {/* Upcoming Events */}
                <div>
                    <CalendarEventsList />
                </div>
            </div>

            {/* Task Approval Section */}
            {candidates.length > 0 && (
                <TaskApprovalList candidates={candidates} />
            )}
        </div>
    );
}
