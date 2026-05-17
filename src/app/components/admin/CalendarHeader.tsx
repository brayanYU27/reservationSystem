import { useMemo } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Employee } from '@/types';
import { Button } from '../ui/button';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export type CalendarRange = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  activeDate: Date;
  range: CalendarRange;
  onRangeChange: (range: CalendarRange) => void;
  onDateChange: (date: Date) => void;
  userRole?: string;
  employees?: Employee[];
  selectedEmployeeId?: string;
  onEmployeeChange?: (employeeId: string | 'all') => void;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEmployeeName(employee: Employee): string {
  const first = employee.user?.firstName?.trim() ?? '';
  const last = employee.user?.lastName?.trim() ?? '';
  const fullName = `${first} ${last}`.trim();
  return fullName || employee.position || 'Empleado';
}

function isManagerRole(role?: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return (
    normalized === 'business_owner' ||
    normalized === 'admin' ||
    normalized === 'manager' ||
    normalized === 'gerente'
  );
}

function formatRangeTitle(activeDate: Date, range: CalendarRange): string {
  if (range === 'day') {
    const day = format(activeDate, 'd', { locale: es });
    const month = capitalize(format(activeDate, 'MMMM', { locale: es }));
    const year = format(activeDate, 'yyyy', { locale: es });
    return `${day} de ${month}, ${year}`;
  }

  if (range === 'month') {
    const month = capitalize(format(activeDate, 'MMMM', { locale: es }));
    const year = format(activeDate, 'yyyy', { locale: es });
    return `${month}, ${year}`;
  }

  const weekStart = startOfWeek(activeDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(activeDate, { weekStartsOn: 1 });

  const startDay = format(weekStart, 'd', { locale: es });
  const endDay = format(weekEnd, 'd', { locale: es });

  if (isSameMonth(weekStart, weekEnd) && isSameYear(weekStart, weekEnd)) {
    const month = capitalize(format(weekStart, 'MMMM', { locale: es }));
    const year = format(weekStart, 'yyyy', { locale: es });
    return `${startDay} - ${endDay} de ${month}, ${year}`;
  }

  if (isSameYear(weekStart, weekEnd)) {
    const startMonth = capitalize(format(weekStart, 'MMMM', { locale: es }));
    const endMonth = capitalize(format(weekEnd, 'MMMM', { locale: es }));
    const year = format(weekStart, 'yyyy', { locale: es });
    return `${startDay} de ${startMonth} - ${endDay} de ${endMonth}, ${year}`;
  }

  const startLabel = `${startDay} de ${capitalize(format(weekStart, 'MMMM, yyyy', { locale: es }))}`;
  const endLabel = `${endDay} de ${capitalize(format(weekEnd, 'MMMM, yyyy', { locale: es }))}`;
  return `${startLabel} - ${endLabel}`;
}

export function CalendarHeader({
  activeDate,
  range,
  onRangeChange,
  onDateChange,
  userRole,
  employees = [],
  selectedEmployeeId = 'all',
  onEmployeeChange,
}: CalendarHeaderProps) {
  const title = useMemo(() => formatRangeTitle(activeDate, range), [activeDate, range]);
  const isEmployee = userRole === 'EMPLOYEE' || userRole === 'employee';
  const showEmployeeFilter = isManagerRole(userRole) && typeof onEmployeeChange === 'function' && !isEmployee;

  const handlePrevious = () => {
    if (range === 'day') {
      onDateChange(subDays(activeDate, 1));
      return;
    }

    if (range === 'week') {
      onDateChange(subWeeks(activeDate, 1));
      return;
    }

    onDateChange(subMonths(activeDate, 1));
  };

  const handleNext = () => {
    if (range === 'day') {
      onDateChange(addDays(activeDate, 1));
      return;
    }

    if (range === 'week') {
      onDateChange(addWeeks(activeDate, 1));
      return;
    }

    onDateChange(addMonths(activeDate, 1));
  };

  const handleRangeChange = (value: string) => {
    if (value === 'day' || value === 'week' || value === 'month') {
      onRangeChange(value);

      if (value === 'week') {
        onDateChange(startOfWeek(activeDate, { weekStartsOn: 1 }));
        return;
      }

      if (value === 'month') {
        onDateChange(startOfMonth(activeDate));
        return;
      }

      onDateChange(activeDate);
    }
  };

  const goToCurrentRange = () => {
    const now = new Date();

    if (range === 'week') {
      onDateChange(startOfWeek(now, { weekStartsOn: 1 }));
      return;
    }

    if (range === 'month') {
      onDateChange(startOfMonth(now));
      return;
    }

    onDateChange(now);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={handleRangeChange}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          <ToggleGroupItem value="day" aria-label="Rango día">Día</ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Rango semana">Semana</ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Rango mes">Mes</ToggleGroupItem>
        </ToggleGroup>

        {showEmployeeFilter && (
          <div className="w-full lg:w-[260px]">
            <Select
              value={selectedEmployeeId}
              onValueChange={(value) => onEmployeeChange?.(value as string | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {getEmployeeName(employee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isEmployee && (
          <div className="text-xs text-neutral-600 px-2 py-1 bg-neutral-100 rounded">
            Viendo solo tus citas
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="size-4" />
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={goToCurrentRange}>
            Hoy
          </Button>

          <Button type="button" variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
      </div>
    </div>
  );
}
