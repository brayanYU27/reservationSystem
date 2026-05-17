import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppointmentFilters } from '@/hooks/useAppointmentFilters';
import { appointmentService } from '@/services/appointment.service';
import { businessService } from '@/services/business.service';
import type { Appointment, Employee } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CalendarGrid, type CalendarViewType } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

interface BusinessCalendarViewProps {
  businessId: string;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export function BusinessCalendarView({ businessId, onAppointmentClick }: BusinessCalendarViewProps) {
  const { user } = useAuth();
  const { business } = useBusiness();
  const {
    filters: { selectedDate, selectedEmployeeId },
    setSelectedDate,
    setSelectedEmployeeId,
  } = useAppointmentFilters();
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewType, setViewType] = useState<CalendarViewType>('day');
  const currentDate = selectedDate ?? new Date();

  // Para empleados, fijar su ID desde el inicio
  useEffect(() => {
    if (user?.role === 'EMPLOYEE' || user?.role === 'employee') {
      const employeeId = user?.employeeProfile?.id || user?.id;
      if (employeeId && selectedEmployeeId !== employeeId) {
        setSelectedEmployeeId(employeeId);
      }
    }
  }, [selectedEmployeeId, setSelectedEmployeeId, user?.role, user?.id, user?.employeeProfile?.id]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  const dateRange = useMemo(() => {
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

  const loadEmployees = useCallback(async () => {
    if (!businessId) return;

    try {
      const employeesRes = await businessService.getEmployees(businessId);

      if (!isMountedRef.current) return;

      if (employeesRes.success && employeesRes.data) {
        setEmployees(employeesRes.data.filter((employee) => employee.isActive));
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading employees for agenda:', error);
      if (isMountedRef.current) setEmployees([]);
    }
  }, [businessId]);

  const loadAppointments = useCallback(async () => {
    if (!businessId) return;

    if (isMountedRef.current) setLoading(true);

    try {
      const dateFrom = format(dateRange.from, 'yyyy-MM-dd');
      const dateTo = format(dateRange.to, 'yyyy-MM-dd');

      const appointmentsRes = await appointmentService.getAppointments({
        businessId,
        dateFrom,
        dateTo,
        employeeId: selectedEmployeeId === 'all' ? undefined : selectedEmployeeId,
        page: 1,
        limit: 500,
      });

      if (!isMountedRef.current) return;

      if (appointmentsRes.success && appointmentsRes.data) {
        setAppointments(appointmentsRes.data);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading business agenda:', error);
      if (isMountedRef.current) setAppointments([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [businessId, dateRange.from, dateRange.to, selectedEmployeeId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadEmployees();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadEmployees]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-xl">Agenda visual</CardTitle>
        <CalendarHeader
          activeDate={currentDate}
          range={viewType}
          onRangeChange={setViewType}
          onDateChange={setSelectedDate}
          userRole={user?.role}
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onEmployeeChange={setSelectedEmployeeId}
        />
      </CardHeader>

      <CardContent>
        {employees.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-neutral-500">
            No hay empleados activos para mostrar en la agenda.
          </div>
        ) : (
          <CalendarGrid
            appointments={appointments}
            employees={employees}
            viewType={viewType}
            currentDate={currentDate}
            selectedEmployeeId={selectedEmployeeId}
            businessHours={business?.workingHours}
            loading={loading}
            onAppointmentClick={onAppointmentClick}
          />
        )}
      </CardContent>
    </Card>
  );
}
