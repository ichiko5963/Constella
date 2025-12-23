'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, Calendar, Filter } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { getTasks } from '@/server/actions/task';
import { updateTask } from '@/server/actions/task';
import { toast } from 'sonner';

interface DailyTaskManagerProps {
    selectedDate?: Date;
}

export function DailyTaskManager({ selectedDate }: DailyTaskManagerProps) {
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [isPending, startTransition] = useTransition();

    // selectedDateをメモ化して、日付部分だけを比較
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

    // 選択された日付のタスクをフィルタリング
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

    const handleToggleComplete = async (taskId: number, currentStatus: string) => {
        startTransition(async () => {
            try {
                const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
                const result = await updateTask(taskId, { status: newStatus });
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

    // 今日のタスクを取得
    const todayTasks = useMemo(() => {
        return allTasks.filter((task: any) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return isToday(dueDate);
        });
    }, [allTasks]);

    const todayPendingTasks = todayTasks.filter((t: any) => t.status !== 'completed' && t.status !== 'approved');
    const todayCompletedTasks = todayTasks.filter((t: any) => t.status === 'completed' || t.status === 'approved');

    if (isLoading) {
        return (
            <Card className="glass border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle className="text-white">日々のタスク管理</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/10 bg-black/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5 text-primary" />
                    日々のタスク管理
                </CardTitle>
                <CardDescription className="text-gray-400">
                    {format(normalizedDate || new Date(), 'yyyy年M月d日 (EEEE)', { locale: ja })}のタスク
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 今日のタスクセクション */}
                {isToday(normalizedDate) && (
                    <div className="space-y-3 pb-4 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-primary" />
                            今日のタスク ({todayTasks.length})
                        </h3>
                        {todayTasks.length === 0 ? (
                            <p className="text-xs text-gray-500">今日のタスクはありません</p>
                        ) : (
                            <div className="space-y-2">
                                {todayPendingTasks.length > 0 && (
                                    <div className="space-y-1.5">
                                        {todayPendingTasks.map((task: any) => (
                                            <div
                                                key={task.id}
                                                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(task.id, task.status)}
                                                        disabled={isPending}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <CheckSquare className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {todayCompletedTasks.length > 0 && (
                                    <div className="space-y-1.5 opacity-60">
                                        {todayCompletedTasks.map((task: any) => (
                                            <div
                                                key={task.id}
                                                className="p-2 rounded-lg border border-white/10 bg-white/5 line-through"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(task.id, task.status)}
                                                        disabled={isPending}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <CheckSquare className="h-3 w-3 text-green-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 選択日付のタスクセクション */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                            {getDateLabel()}のタスク
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className="h-7 text-xs"
                            >
                                すべて
                            </Button>
                            <Button
                                variant={filter === 'pending' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('pending')}
                                className="h-7 text-xs"
                            >
                                未完了
                            </Button>
                            <Button
                                variant={filter === 'completed' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('completed')}
                                className="h-7 text-xs"
                            >
                                完了
                            </Button>
                        </div>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{getDateLabel()}のタスクはありません</p>
                        </div>
                    ) : (
                        <>
                            {pendingTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-yellow-400" />
                                        未完了 ({pendingTasks.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {pendingTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                                        {task.description && (
                                                            <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(task.id, task.status)}
                                                        disabled={isPending}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <CheckSquare className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {completedTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                                        <CheckSquare className="h-3 w-3 text-green-400" />
                                        完了 ({completedTasks.length})
                                    </h4>
                                    <div className="space-y-1.5 opacity-60">
                                        {completedTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="p-2 rounded-lg border border-white/10 bg-white/5 line-through"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                                        {task.description && (
                                                            <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(task.id, task.status)}
                                                        disabled={isPending}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <CheckSquare className="h-3 w-3 text-green-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
