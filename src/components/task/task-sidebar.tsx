'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, Calendar, Plus, Filter } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { getTasks } from '@/server/actions/task';
import { updateTaskStatus } from '@/server/actions/task';
import { toast } from 'sonner';
import { useTransition } from 'react';

interface TaskSidebarProps {
    selectedDate?: Date;
}

export function TaskSidebar({ selectedDate }: TaskSidebarProps) {
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [isPending, startTransition] = useTransition();

    const normalizedDate = useMemo(() => {
        const date = selectedDate || new Date();
        return startOfDay(date);
    }, [selectedDate ? selectedDate.getTime() : null]);

    useEffect(() => {
        loadAllTasks();
    }, []);

    const loadAllTasks = async () => {
        setIsLoading(true);
        try {
            const tasks = await getTasks();
            setAllTasks(tasks || []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            toast.error('タスクの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const tasks = useMemo(() => {
        if (!normalizedDate) return [];
        const dayStart = startOfDay(normalizedDate);
        const dayEnd = endOfDay(normalizedDate);
        
        return allTasks.filter((task: any) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= dayStart && dueDate <= dayEnd;
        });
    }, [allTasks, normalizedDate]);

    const todayTasks = useMemo(() => {
        return allTasks.filter((task: any) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return isToday(dueDate);
        });
    }, [allTasks]);

    const handleToggleComplete = async (taskId: number, currentStatus: string) => {
        startTransition(async () => {
            try {
                const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
                const result = await updateTaskStatus(taskId, newStatus);
                if (result.success) {
                    toast.success(`タスクを${newStatus === 'completed' ? '完了' : '未完了'}に変更しました`);
                    loadAllTasks();
                } else {
                    toast.error(result.error || '更新に失敗しました');
                }
            } catch (error) {
                console.error('Failed to toggle task:', error);
                toast.error('エラーが発生しました');
            }
        });
    };

    const getDateLabel = () => {
        const date = normalizedDate || new Date();
        if (isToday(date)) return '今日';
        if (isTomorrow(date)) return '明日';
        if (isYesterday(date)) return '昨日';
        return format(date, 'M月d日');
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'pending') return task.status !== 'completed' && task.status !== 'approved';
        if (filter === 'completed') return task.status === 'completed' || task.status === 'approved';
        return true;
    });

    const pendingTasks = filteredTasks.filter(t => t.status !== 'completed' && t.status !== 'approved');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.status === 'approved');

    const todayPendingTasks = todayTasks.filter((t: any) => t.status !== 'completed' && t.status !== 'approved');
    const todayCompletedTasks = todayTasks.filter((t: any) => t.status === 'completed' || t.status === 'approved');

    if (isLoading) {
        return (
            <div className="w-80 h-full border-r border-white/10 bg-black/20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-80 h-full border-r border-white/10 bg-black/20 flex flex-col">
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-white">タスク管理</h2>
                </div>
                
                {/* 今日のタスクサマリー */}
                {isToday(normalizedDate) && todayTasks.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-white">今日のタスク</span>
                            <span className="text-xs text-gray-400">{todayTasks.length}件</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <span className="text-yellow-400">未完了: {todayPendingTasks.length}</span>
                            <span className="text-green-400">完了: {todayCompletedTasks.length}</span>
                        </div>
                    </div>
                )}

                {/* フィルターボタン */}
                <div className="grid grid-cols-3 gap-1">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="h-7 text-xs px-2"
                    >
                        すべて
                    </Button>
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('pending')}
                        className="h-7 text-xs px-2"
                    >
                        未完了
                    </Button>
                    <Button
                        variant={filter === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('completed')}
                        className="h-7 text-xs px-2"
                    >
                        完了
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 選択日付のタスク */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {getDateLabel()}のタスク ({tasks.length})
                    </h3>

                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">{getDateLabel()}のタスクはありません</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingTasks.length > 0 && (
                                <div className="space-y-1.5">
                                    {pendingTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                            onClick={() => handleToggleComplete(task.id, task.status)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                                    )}
                                                </div>
                                                <CheckSquare className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {completedTasks.length > 0 && (
                                <div className="space-y-1.5 opacity-60">
                                    {completedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-2 rounded-lg border border-white/10 bg-white/5 line-through cursor-pointer"
                                            onClick={() => handleToggleComplete(task.id, task.status)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                                                </div>
                                                <CheckSquare className="h-4 w-4 text-green-400 ml-2 flex-shrink-0" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
