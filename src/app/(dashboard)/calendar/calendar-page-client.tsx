'use client';

import { useState } from 'react';
import { Calendar } from '@/components/calendar/calendar';
import { CalendarEventsList } from '@/components/calendar/calendar-events-list';
import { ManualJoinButton } from '@/components/meeting/manual-join-button';
import { TaskApprovalList } from '@/components/task/task-approval-list';
import { MeetingScheduler } from '@/components/scheduler/meeting-scheduler';
import { BookingSettingsManager } from '@/components/scheduler/booking-settings-manager';

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
    const [activeTab, setActiveTab] = useState<'scheduler' | 'booking'>('scheduler');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">カレンダー</h1>
                    <p className="text-gray-400">スケジュールとタスクを管理</p>
                </div>
                <ManualJoinButton />
            </div>

            {/* カレンダーとイベントリスト */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Calendar 
                        tasks={formattedTasks} 
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />
                </div>
                <div className="lg:col-span-1">
                    <CalendarEventsList />
                </div>
            </div>

            {/* スケジューラーセクション */}
            <div className="mt-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">ミーティングスケジューラー</h2>
                    <p className="text-gray-400">予約可能な時間を設定し、他のユーザーに予約してもらえます。</p>
                </div>
                <div className="mb-6">
                    <div className="flex gap-2 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('scheduler')}
                            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                                activeTab === 'scheduler'
                                    ? 'border-primary text-white'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            直接予約
                        </button>
                        <button
                            onClick={() => setActiveTab('booking')}
                            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                                activeTab === 'booking'
                                    ? 'border-primary text-white'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            予約URL管理
                        </button>
                    </div>
                </div>

                {activeTab === 'scheduler' && (
                    <MeetingScheduler />
                )}

                {activeTab === 'booking' && (
                    <BookingSettingsManager />
                )}
            </div>

            <TaskApprovalList candidates={candidates} />
        </div>
    );
}
