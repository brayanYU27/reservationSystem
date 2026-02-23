import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Appointment } from '@/types';

interface AppointmentCalendarProps {
    appointments: Appointment[];
    onDateSelect?: (date: Date) => void;
    selectedDate?: Date;
}

export function AppointmentCalendar({
    appointments,
    onDateSelect,
    selectedDate = new Date()
}: AppointmentCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onDateSelect?.(today);
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Comienza en Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const getAppointmentsForDay = (day: Date) => {
        return appointments.filter(apt => isSameDay(new Date(apt.date), day));
    };

    return (
        <Card>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <div className="flex items-center rounded-md border bg-white shadow-sm">
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoy
                    </Button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2 text-center text-sm font-medium text-neutral-500">
                    {weekDays.map(day => (
                        <div key={day} className="py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, dayIdx) => {
                        const dayAppointments = getAppointmentsForDay(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => onDateSelect?.(day)}
                                className={`
                  min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                  ${!isCurrentMonth ? 'bg-neutral-50 text-neutral-400' : 'bg-white'}
                  ${isSelected ? 'ring-2 ring-neutral-900 border-transparent z-10' : 'hover:border-neutral-300'}
                  ${isToday ? 'bg-blue-50/50' : ''}
                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`
                    text-sm font-medium size-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-600 text-white' : ''}
                  `}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayAppointments.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                            {dayAppointments.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1 mt-1">
                                    {dayAppointments.slice(0, 3).map((apt, i) => (
                                        <div
                                            key={apt.id || i}
                                            className={`
                        text-[10px] truncate px-1 rounded flex items-center gap-1
                        ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                    apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-neutral-100 text-neutral-600'}
                      `}
                                        >
                                            <Clock className="size-3 flex-shrink-0" />
                                            <span>{apt.startTime}</span>
                                        </div>
                                    ))}
                                    {dayAppointments.length > 3 && (
                                        <div className="text-[10px] text-neutral-400 pl-1">
                                            + {dayAppointments.length - 3} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
