import { useMemo } from 'react';
import {
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, AppointmentStatus, BusinessHours, Employee } from '@/types';

export type CalendarViewType = 'day' | 'week' | 'month';

interface CalendarGridProps {
  appointments: Appointment[];
  employees: Employee[];
  currentDate: Date;
  viewType: CalendarViewType;
  selectedEmployeeId?: string | 'all';
  businessHours?: BusinessHours[];
  loading?: boolean;
  pixelsPerHour?: number;
  onAppointmentClick?: (appointment: Appointment) => void;
}

type AppointmentColor = {
  bg: string;
  border: string;
  text: string;
};

const STATUS_COLORS: Record<AppointmentStatus, AppointmentColor> = {
  PENDING: { bg: 'bg-yellow-100/90', border: 'border-yellow-300', text: 'text-yellow-900' },
  CONFIRMED: { bg: 'bg-blue-100/90', border: 'border-blue-300', text: 'text-blue-900' },
  COMPLETED: { bg: 'bg-green-100/90', border: 'border-green-300', text: 'text-green-900' },
  CANCELLED: { bg: 'bg-red-100/90', border: 'border-red-300', text: 'text-red-900' },
  NO_SHOW: { bg: 'bg-orange-100/90', border: 'border-orange-300', text: 'text-orange-900' },
  IN_PROGRESS: { bg: 'bg-purple-100/90', border: 'border-purple-300', text: 'text-purple-900' },
  CHECKED_IN: { bg: 'bg-indigo-100/90', border: 'border-indigo-300', text: 'text-indigo-900' },
};

function parseAppointmentDate(value: Appointment['date']): Date {
  const dateValue = value as unknown as string | Date;
  const dateString = typeof dateValue === 'string' ? dateValue.split('T')[0] : format(dateValue, 'yyyy-MM-dd');
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

function getEmployeeName(employee: Employee): string {
  const first = employee.user?.firstName?.trim() ?? '';
  const last = employee.user?.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  return full || employee.position || 'Empleado';
}

function getClientName(appointment: Appointment): string {
  if (appointment.guestName) return appointment.guestName;
  const first = appointment.client?.firstName?.trim() ?? '';
  const last = appointment.client?.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  return full || 'Cliente';
}

function getDurationInMinutes(appointment: Appointment): number {
  if (typeof appointment.duration === 'number' && appointment.duration > 0) {
    return appointment.duration;
  }

  if (appointment.endTime) {
    const start = parse(appointment.startTime, 'HH:mm', new Date());
    const end = parse(appointment.endTime, 'HH:mm', new Date());
    const diff = differenceInMinutes(end, start);
    if (diff > 0) return diff;
  }

  return 30;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

const DAY_ORDER: Array<BusinessHours['day']> = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function CalendarGrid({
  appointments,
  employees,
  currentDate,
  viewType,
  selectedEmployeeId = 'all',
  businessHours = [],
  loading = false,
  pixelsPerHour = 60,
  onAppointmentClick,
}: CalendarGridProps) {
  const scheduleForDay = useMemo(() => {
    const dayKey = DAY_ORDER[getDay(currentDate)] ?? 'monday';
    return businessHours.find((item) => item.day === dayKey);
  }, [businessHours, currentDate]);

  const scheduleBounds = useMemo(() => {
    const openDays = businessHours.filter((item) => item.isOpen);

    if (viewType === 'day') {
      if (!scheduleForDay) {
        return { openMinutes: 9 * 60, closeMinutes: 21 * 60, isClosed: false };
      }

      if (!scheduleForDay.isOpen) {
        return { openMinutes: 9 * 60, closeMinutes: 21 * 60, isClosed: true };
      }

      return {
        openMinutes: timeToMinutes(scheduleForDay.open),
        closeMinutes: timeToMinutes(scheduleForDay.close),
        isClosed: false,
      };
    }

    if (openDays.length === 0) {
      return { openMinutes: 9 * 60, closeMinutes: 21 * 60, isClosed: false };
    }

    return {
      openMinutes: Math.min(...openDays.map((item) => timeToMinutes(item.open))),
      closeMinutes: Math.max(...openDays.map((item) => timeToMinutes(item.close))),
      isClosed: false,
    };
  }, [businessHours, scheduleForDay, viewType]);

  const { openMinutes, closeMinutes, isClosed } = scheduleBounds;

  const pxPerMinute = pixelsPerHour / 60;
  const totalHeight = Math.max((closeMinutes - openMinutes) * pxPerMinute, pixelsPerHour);
  const isDayView = viewType === 'day';

  const activeRange = useMemo(() => {
    if (viewType === 'week') {
      return {
        from: startOfWeek(currentDate, { weekStartsOn: 1 }),
        to: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }

    if (viewType === 'month') {
      return {
        from: startOfMonth(currentDate),
        to: endOfMonth(currentDate),
      };
    }

    return {
      from: currentDate,
      to: currentDate,
    };
  }, [currentDate, viewType]);

  const visibleEmployees = useMemo(() => {
    if (selectedEmployeeId !== 'all') {
      return employees.filter((employee) => employee.id === selectedEmployeeId);
    }

    return employees;
  }, [employees, selectedEmployeeId]);

  const rangeAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (!appointment.employeeId) return false;

      if (selectedEmployeeId !== 'all' && appointment.employeeId !== selectedEmployeeId) {
        return false;
      }

      const appointmentDate = parseAppointmentDate(appointment.date);
      return appointmentDate >= activeRange.from && appointmentDate <= activeRange.to;
    });
  }, [activeRange.from, activeRange.to, appointments, selectedEmployeeId]);

  const appointmentsByEmployee = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    visibleEmployees.forEach((employee) => {
      map.set(employee.id, []);
    });

    // Layout de Día: columnas por empleado para currentDate
    rangeAppointments.forEach((appointment) => {
      if (!isSameDay(parseAppointmentDate(appointment.date), currentDate)) return;

      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      if (startMinutes < openMinutes || startMinutes >= closeMinutes) return;

      const bucket = map.get(appointment.employeeId as string);
      if (!bucket) return;
      bucket.push(appointment);
    });

    for (const [, employeeAppointments] of map) {
      employeeAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return map;
  }, [closeMinutes, currentDate, openMinutes, rangeAppointments, visibleEmployees]);

  const hasAppointmentsInRange = rangeAppointments.length > 0;

  const hourSlots = useMemo(() => {
    const slots: number[] = [];

    for (let minutes = openMinutes; minutes <= closeMinutes; minutes += 60) {
      slots.push(minutes);
    }

    return slots;
  }, [closeMinutes, openMinutes]);

  const halfHourSlots = useMemo(() => {
    const slots: number[] = [];

    for (let minutes = openMinutes; minutes < closeMinutes; minutes += 30) {
      slots.push(minutes);
    }

    return slots;
  }, [closeMinutes, openMinutes]);

  const gridEmployees = visibleEmployees.length > 0 ? visibleEmployees : [{ id: 'empty' } as Employee];

  const emptyLabel =
    viewType === 'month'
      ? 'No hay citas para este mes'
      : viewType === 'week'
        ? 'No hay citas para esta semana'
        : 'No hay citas para este día';

  return (
    <div className="space-y-3">
      {!loading && isDayView && isClosed && (
        <p className="text-sm text-neutral-500">El negocio está cerrado en el día seleccionado.</p>
      )}

      {!loading && !hasAppointmentsInRange && (
        <p className="text-sm text-neutral-500">{emptyLabel}</p>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <div
          className="grid min-w-[880px]"
          style={{ gridTemplateColumns: `88px repeat(${Math.max(gridEmployees.length, 1)}, minmax(180px, 1fr))` }}
        >
          <div className="border-b bg-white" />
          {gridEmployees.map((employee) => (
            <div key={employee.id} className="border-b border-l bg-white px-3 py-2 text-sm font-medium text-neutral-700">
              {employee.id === 'empty' ? 'Empleado' : getEmployeeName(employee)}
            </div>
          ))}

          <div className="relative bg-white">
            <div className="relative" style={{ height: `${totalHeight}px` }}>
              {hourSlots.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-neutral-300 px-2 text-xs text-neutral-500"
                  style={{ top: `${(hour - openMinutes) * pxPerMinute}px` }}
                >
                  <span className="-translate-y-1/2 inline-block bg-white pr-1">
                    {format(new Date(2000, 0, 1, Math.floor(hour / 60), hour % 60), 'h:mm a', { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {gridEmployees.map((employee) => (
            <div key={`col-${employee.id}`} className="relative border-l bg-white">
              <div className="relative" style={{ height: `${totalHeight}px` }}>
                {/* Líneas principales por hora */}
                {hourSlots.map((hour) => (
                  <div
                    key={`${employee.id}-${hour}`}
                    className="absolute inset-x-0 border-t border-neutral-200"
                    style={{ top: `${(hour - openMinutes) * pxPerMinute}px` }}
                  />
                ))}

                {/* Líneas secundarias cada 30 min (estilo cuaderno) */}
                {halfHourSlots.map((slot) => (
                  <div
                    key={`${employee.id}-half-${slot}`}
                    className="absolute inset-x-0 border-t border-dashed border-neutral-100"
                    style={{ top: `${(slot - openMinutes) * pxPerMinute}px` }}
                  />
                ))}

                {loading && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-neutral-100/80 via-neutral-50 to-neutral-100/80" />
                )}

                {!loading && employee.id !== 'empty' && isDayView &&
                  (appointmentsByEmployee.get(employee.id) ?? []).map((appointment) => {
                    const [hour, minute] = appointment.startTime.split(':').map(Number);
                    const startInMinutes = hour * 60 + minute;

                    const top = Math.max((startInMinutes - openMinutes) * pxPerMinute, 0);

                    // height = (Duración en minutos / 60) * pixeles_por_hora
                    const duration = getDurationInMinutes(appointment);
                    const height = Math.max((duration / 60) * pixelsPerHour, 22);

                    const palette = STATUS_COLORS[appointment.status] ?? STATUS_COLORS.PENDING;

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => onAppointmentClick?.(appointment)}
                        className={[
                          'absolute left-1 right-1 rounded-md border px-2 py-1 text-left shadow-sm',
                          'transition hover:shadow-md',
                          palette.bg,
                          palette.border,
                          palette.text,
                        ].join(' ')}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${appointment.startTime} • ${getClientName(appointment)}`}
                      >
                        <p className="truncate text-xs font-semibold">{getClientName(appointment)}</p>
                        <p className="truncate text-[11px] opacity-90">{appointment.service?.name ?? 'Servicio'}</p>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
