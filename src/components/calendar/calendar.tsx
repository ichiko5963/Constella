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

interface CalendarProps {
    tasks?: Task[];
    selectedDate?: Date;
    onDateSelect?: (date: Date) => void;
}

export function Calendar({ tasks = [], selectedDate: externalSelectedDate, onDateSelect }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [internalSelectedDate, setInternalSelectedDate] = useState(new Date());
    const selectedDate = externalSelectedDate ?? internalSelectedDate;

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const onDateClick = (day: Date) => {
        if (onDateSelect) {
            onDateSelect(day);
        } else {
            setInternalSelectedDate(day);
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                    <Button onClick={prevMonth} variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-gray-100 text-gray-600">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button onClick={nextMonth} variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-gray-100 text-gray-600">
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
                <div className="text-center text-xs font-medium text-gray-400 py-3 uppercase tracking-wider" key={i}>
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7">{days}</div>;
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
                            "relative aspect-square flex flex-col p-2 cursor-pointer transition-all duration-150 border-t border-r border-gray-100 first:border-l",
                            !isSameMonth(day, monthStart) ? "bg-gray-50/50 text-gray-300" : "bg-white text-gray-700 hover:bg-gray-50",
                            isSameDay(day, selectedDate) ? "bg-gray-100 ring-1 ring-gray-900 ring-inset" : "",
                            isToday(day) && !isSameDay(day, selectedDate) ? "bg-gray-50" : ""
                        )}
                        key={day.toString()}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <div className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                            isToday(day) ? "bg-gray-900 text-white font-semibold" : "",
                        )}>
                            {formattedDate}
                        </div>

                        <div className="flex flex-col gap-0.5 overflow-hidden mt-1">
                            {tasksForDay.slice(0, 2).map((task) => (
                                <div key={task.id} className="flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded truncate">
                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", task.completed ? "bg-green-500" : "bg-gray-900")} />
                                    <span className={cn("truncate text-gray-600", task.completed && "line-through text-gray-400")}>{task.title}</span>
                                </div>
                            ))}
                            {tasksForDay.length > 2 && (
                                <span className="text-[9px] text-gray-400 px-1">+{tasksForDay.length - 2}</span>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 border-b border-gray-100 last:border-b-0" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">{rows}</div>;
    };

    return (
        <div className="w-full">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}
