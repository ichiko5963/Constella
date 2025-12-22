'use client';

import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

type Task = {
    id: number;
    title: string;
    dueDate: Date;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
    projectId?: number;
};

export function Calendar({ tasks = [] }: { tasks?: Task[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const onDateClick = (day: Date) => setSelectedDate(day);

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <Button onClick={prevMonth} variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 hover:bg-white/10 hover:text-white glass">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button onClick={nextMonth} variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 hover:bg-white/10 hover:text-white glass">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateFormat = "EEE";
        const startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="text-center text-sm font-medium text-gray-500 py-4 uppercase tracking-wider" key={i}>
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const tasksForDay = tasks.filter(t => isSameDay(t.dueDate, cloneDay));

                days.push(
                    <div
                        className={cn(
                            "relative aspect-square flex flex-col p-2 cursor-pointer transition-all duration-200 border-t border-r border-white/5 first:border-l",
                            !isSameMonth(day, monthStart) ? "bg-black/40 text-gray-700" : "bg-transparent text-gray-300 hover:bg-white/5",
                            isSameDay(day, selectedDate) ? "bg-white/10 shadow-[inset_0_0_20px_rgba(0,212,170,0.1)]" : "",
                            isToday(day) ? "bg-primary/10" : ""
                        )}
                        key={day.toString()}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <div className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors mb-1",
                            isToday(day) ? "bg-primary text-black font-bold shadow-lg shadow-primary/30" : "",
                        )}>
                            {formattedDate}
                        </div>

                        <div className="flex flex-col gap-1 overflow-hidden">
                            {tasksForDay.map((task) => (
                                <div key={task.id} className="flex items-center gap-1 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate">
                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", task.completed ? "bg-green-500" : "bg-primary")} />
                                    <span className={cn("truncate", task.completed && "line-through text-gray-500")}>{task.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 border-b border-white/5 last:border-b-0" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl">{rows}</div>;
    };

    return (
        <div className="w-full">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}
