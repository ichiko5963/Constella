'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, Calendar, Filter } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { getTasks } from '@/server/actions/task';
import { updateTask } from '@/server/actions/task';
import { toast } from 'sonner';
// TaskCardコンポーネントをインポート（存在しない場合は簡易版を作成）

interface DailyTaskManagerProps {
    selectedDate?: Date;
}

export function DailyTaskManager({ selectedDate = new Date() }: DailyTaskManagerProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        loadTasks();
    }, [selectedDate]);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const result = await getTasks();
            if (result.success && result.tasks) {
                const dayStart = startOfDay(selectedDate);
                const dayEnd = endOfDay(selectedDate);
                
                const dayTasks = result.tasks.filter((task: any) => {
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    return dueDate >= dayStart && dueDate <= dayEnd;
                });

                setTasks(dayTasks);
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            toast.error('タスクの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComplete = async (taskId: number, currentStatus: string) => {
        startTransition(async () => {
            try {
                const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
                const result = await updateTask(taskId, { status: newStatus });
                if (result.success) {
                    toast.success(`タスクを${newStatus === 'completed' ? '完了' : '未完了'}に変更しました`);
                    loadTasks();
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
        if (isToday(selectedDate)) return '今日';
        if (isTomorrow(selectedDate)) return '明日';
        if (isYesterday(selectedDate)) return '昨日';
        return format(selectedDate, 'M月d日');
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'pending') return task.status !== 'completed' && task.status !== 'approved';
        if (filter === 'completed') return task.status === 'completed' || task.status === 'approved';
        return true;
    });

    const pendingTasks = filteredTasks.filter(t => t.status !== 'completed' && t.status !== 'approved');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.status === 'approved');

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>日次タスク管理</CardTitle>
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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {getDateLabel()}のタスク
                        </CardTitle>
                        <CardDescription>
                            {format(selectedDate, 'yyyy年M月d日 (EEEE)', { locale: ja })}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            すべて
                        </Button>
                        <Button
                            variant={filter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('pending')}
                        >
                            未完了
                        </Button>
                        <Button
                            variant={filter === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('completed')}
                        >
                            完了
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{getDateLabel()}のタスクはありません</p>
                    </div>
                ) : (
                    <>
                        {pendingTasks.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-yellow-400" />
                                    未完了 ({pendingTasks.length})
                                </h3>
                                <div className="space-y-2">
                                    {pendingTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-white">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleComplete(task.id, task.status)}
                                                    disabled={isPending}
                                                >
                                                    <CheckSquare className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {completedTasks.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <CheckSquare className="h-4 w-4 text-green-400" />
                                    完了 ({completedTasks.length})
                                </h3>
                                <div className="space-y-2 opacity-60">
                                    {completedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all line-through opacity-60"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-white">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleComplete(task.id, task.status)}
                                                    disabled={isPending}
                                                >
                                                    <CheckSquare className="h-4 w-4 text-green-400" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

