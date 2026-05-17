import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Calendar as CalendarIcon, Search, Phone, Mail, CheckCheck, UserCheck, Clock, User, Loader2, List } from 'lucide-react';
import { format, isSameDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppointmentFilters } from '@/hooks/useAppointmentFilters';
import { businessService } from '@/services/business.service';
import { appointmentService } from '@/services/appointment.service';
import { analyticsService } from '@/services/analytics.service';
import { AppointmentCalendar } from './AppointmentCalendar'; // Import Calendar
import type { Appointment, AppointmentsSummary, Employee } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '../ui/utils';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS' | 'CHECKED_IN';

// ✅ Función helper para obtener el nombre del cliente
// Prioridad: guestName > client.firstName + lastName > 'Cliente Sin Nombre'
const getClientName = (appointment: Appointment): string => {
  if (appointment.guestName) return appointment.guestName;
  if (appointment.client?.firstName && appointment.client?.lastName) {
    return `${appointment.client.firstName} ${appointment.client.lastName}`;
  }
  return 'Cliente Sin Nombre';
};

// ✅ Función helper para obtener el nombre del barbero/empleado
const getEmployeeName = (appointment: Appointment): string => {
  if (appointment.employee?.user?.firstName && appointment.employee?.user?.lastName) {
    return `${appointment.employee.user.firstName} ${appointment.employee.user.lastName}`;
  }
  return 'Sin asignar';
};

const parseAppointmentLocalDate = (value: Appointment['date']): Date => {
  const dateVal = value as unknown as (string | Date);
  const dateString = typeof dateVal === 'string'
    ? dateVal.split('T')[0]
    : format(dateVal, 'yyyy-MM-dd');

  return parse(dateString, 'yyyy-MM-dd', new Date());
};

export function AppointmentsTab() {
  const { business } = useBusiness();
  const {
    filters: { selectedDate, selectedEmployeeId, searchTerm, filterStatus },
    setSelectedDate,
    setSelectedEmployeeId,
    setSearchTerm,
    setFilterStatus,
  } = useAppointmentFilters();
  const isMountedRef = useRef(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  
  // ✅ KPIs centralizados desde el servicio
  const [kpis, setKpis] = useState<AppointmentsSummary>({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    revenue: 0,
  });

  const loadEmployees = useCallback(async () => {
    if (!business) return;

    try {
      const employeesRes = await businessService.getEmployees(business.id);

      if (!isMountedRef.current) return;

      if (employeesRes.success && employeesRes.data) {
        setEmployees(employeesRes.data.filter((employee) => employee.isActive));
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      if (isMountedRef.current) setEmployees([]);
    }
  }, [business]);

  const loadAppointments = useCallback(async (targetDate?: Date, employeeId?: string) => {
    if (!business) return;

    if (isMountedRef.current) setLoading(true);
    try {
      const dateToLoad = targetDate ?? new Date();
      const isoDate = format(dateToLoad, 'yyyy-MM-dd');

      const appointmentsRes = await businessService.getAppointments(business.id, {
        dateFrom: isoDate,
        dateTo: isoDate,
        employeeId: employeeId && employeeId !== 'all' ? employeeId : undefined,
      });

      if (!isMountedRef.current) return;

      if (appointmentsRes.success && appointmentsRes.data) {
        if (isMountedRef.current) setAppointments(appointmentsRes.data);
      } else if (isMountedRef.current) {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      if (isMountedRef.current) toast.error('Error al cargar las citas');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [business]);

  // ✅ Cargar KPIs del servicio centralizado
  const loadKpis = useCallback(async (targetDate?: Date, employeeId?: string) => {
    if (!business) return;

    if (isMountedRef.current) setKpisLoading(true);
    try {
      const dateToLoad = targetDate ?? new Date();
      const isoDate = format(dateToLoad, 'yyyy-MM-dd');

      const kpisRes = await analyticsService.getAppointmentsSummary(
        business.id,
        isoDate,
        isoDate,
        employeeId && employeeId !== 'all' ? employeeId : undefined
      );

      if (!isMountedRef.current) return;

      if (kpisRes.success && kpisRes.data) {
        if (isMountedRef.current) setKpis(kpisRes.data);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
      // No mostrar error al usuario, solo registrar
    } finally {
      if (isMountedRef.current) setKpisLoading(false);
    }
  }, [business]);

  useEffect(() => {
    isMountedRef.current = true;

    loadEmployees();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadEmployees]);

  useEffect(() => {
    const activeDate = selectedDate ?? new Date();
    if (!selectedDate) {
      setSelectedDate(activeDate);
      return;
    }
    loadAppointments(activeDate, selectedEmployeeId);
    loadKpis(activeDate, selectedEmployeeId);
  }, [selectedDate, selectedEmployeeId, loadAppointments, loadKpis, setSelectedDate]);

  const filteredAppointments = appointments.filter((apt) => {
    // ✅ Usar helpers para obtener nombres basados en nueva estructura
    const clientName = getClientName(apt);
    
    // Parse date string as local date to avoid timezone shifts
    const aptDate = parseAppointmentLocalDate(apt.date);

    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client?.phone?.includes(searchTerm) ||
      apt.guestPhone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesEmployee = selectedEmployeeId === 'all' || apt.employeeId === selectedEmployeeId;

    // Filter by selected date if a date is selected
    const matchesDate = selectedDate ? isSameDay(aptDate, selectedDate) : true;

    return matchesSearch && matchesStatus && matchesEmployee && matchesDate;
  });

  // ✅ KPIs sincronizados con la API centralizada
  const displayKpis = {
    total: kpis.totalAppointments,
    upcoming: kpis.upcomingAppointments,
    revenue: kpis.revenue,
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    if (isMountedRef.current) setUpdatingId(id);
    try {
      const response = await appointmentService.updateStatus(id, status);
      if (!isMountedRef.current) return;

      if (response.success) {
        if (isMountedRef.current) {
          setAppointments(prev =>
            prev.map(apt => apt.id === id ? { ...apt, status } : apt)
          );
        }

        const statusMessages: Record<string, string> = {
          CONFIRMED: 'Cita confirmada',
          COMPLETED: 'Cita marcada como completada',
          CANCELLED: 'Cita cancelada',
          PENDING: 'Cita marcada como pendiente',
          NO_SHOW: 'Cliente marcado como no presentado',
          IN_PROGRESS: 'Cita en progreso',
          CHECKED_IN: 'Cliente registrado'
        };

        if (isMountedRef.current) toast.success(statusMessages[status]);
      } else {
        if (isMountedRef.current) toast.error('Error al actualizar el estado de la cita');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      if (isMountedRef.current) toast.error('Error al actualizar la cita');
    } finally {
      if (isMountedRef.current) setUpdatingId(prev => (prev === id ? null : prev));
    }
  };

  const handleCancelAppointment = async () => {
    if (selectedAppointment) {
      await updateAppointmentStatus(selectedAppointment.id, 'CANCELLED');
      setShowCancelDialog(false);
      setSelectedAppointment(null);
    }
  };

  // ✅ Badges mejorados con colores Tailwind específicos
  const getStatusBadge = (status: AppointmentStatus) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      PENDING: { 
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        label: 'Pendiente' 
      },
      CONFIRMED: { 
        className: 'bg-blue-100 text-blue-800 border border-blue-200', 
        label: 'Confirmada' 
      },
      COMPLETED: { 
        className: 'bg-green-100 text-green-800 border border-green-200', 
        label: 'Completada' 
      },
      CANCELLED: { 
        className: 'bg-red-100 text-red-800 border border-red-200', 
        label: 'Cancelada' 
      },
      NO_SHOW: { 
        className: 'bg-orange-100 text-orange-800 border border-orange-200', 
        label: 'No se presentó' 
      },
      IN_PROGRESS: { 
        className: 'bg-purple-100 text-purple-800 border border-purple-200', 
        label: 'En Progreso' 
      },
      CHECKED_IN: { 
        className: 'bg-indigo-100 text-indigo-800 border border-indigo-200', 
        label: 'En Espera' 
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Citas</h2>
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className={view === 'list' ? 'shadow-sm' : ''}
          >
            <List className="size-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={view === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('calendar')}
            className={view === 'calendar' ? 'shadow-sm' : ''}
          >
            <CalendarIcon className="size-4 mr-2" />
            Calendario
          </Button>
        </div>
      </div>

      {/* Stats Cards - Always show if not in calendar view (or maybe even then?) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Citas de Hoy</CardDescription>
            <CardTitle className="text-3xl">
              {kpisLoading ? '...' : displayKpis.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Próximas Citas</CardDescription>
            <CardTitle className="text-3xl">
              {kpisLoading ? '...' : displayKpis.upcoming}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos Hoy</CardDescription>
            <CardTitle className="text-3xl">
              ${kpisLoading ? '...' : displayKpis.revenue.toLocaleString('es-MX')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {view === 'calendar' && (
        <div className="mb-6">
          <AppointmentCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedDate
                  ? `Citas del ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                  : 'Todas las citas'
                }
              </CardTitle>
              <CardDescription>
                {filteredAppointments.length} citas encontradas
              </CardDescription>
            </div>
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Filtrar por fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar por empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.user?.firstName && employee.user?.lastName
                      ? `${employee.user.firstName} ${employee.user.lastName}`
                      : employee.position || 'Empleado'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                <SelectItem value="COMPLETED">Completadas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
                <SelectItem value="NO_SHOW">No se presentó</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointments Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead>Barbero</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead className="hidden sm:table-cell">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                      {selectedDate
                        ? 'No hay citas para esta fecha'
                        : 'No se encontraron citas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => {
                    // ✅ Usar helpers para obtener nombres
                    const clientName = getClientName(appointment);
                    const employeeName = getEmployeeName(appointment);
                    const serviceName = appointment.service?.name || 'Servicio';
                    const servicePrice = appointment.service?.price || appointment.price || 0;
                    
                    // Parse date string as local date to avoid timezone shifts
                    const dateVal = appointment.date as unknown as (string | Date);
                    const dateString = typeof dateVal === 'string'
                      ? dateVal.split('T')[0]
                      : format(dateVal, 'yyyy-MM-dd');
                    const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());
                    
                    // Obtener contacto: guestEmail/guestPhone si es invitado, sino client
                    const contactEmail = appointment.guestEmail || appointment.client?.email;
                    const contactPhone = appointment.guestPhone || appointment.client?.phone;

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{clientName}</div>
                            <div className="text-sm text-neutral-500 md:hidden">
                              {contactPhone || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {contactPhone || 'N/A'}
                            </span>
                            {contactEmail && (
                              <span className="flex items-center gap-1 text-neutral-500">
                                <Mail className="size-3" />
                                {contactEmail}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <User className="size-3" />
                            {employeeName}
                          </span>
                        </TableCell>
                        <TableCell>{serviceName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="size-3" />
                              {format(aptDate, 'd MMM yyyy', { locale: es })}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-neutral-500">
                              <Clock className="size-3" />
                              {appointment.startTime}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          ${servicePrice.toLocaleString('es-MX')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {appointment.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Confirmar"
                                disabled={updatingId === appointment.id}
                                onClick={() => updateAppointmentStatus(appointment.id, 'CONFIRMED')}
                              >
                                {updatingId === appointment.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <UserCheck className="size-4" />
                                )}
                                <span className="hidden sm:inline ml-1">Confirmar</span>
                              </Button>
                            )}
                            {appointment.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Completar"
                                disabled={updatingId === appointment.id}
                                onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                              >
                                {updatingId === appointment.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <CheckCheck className="size-4" />
                                )}
                                <span className="hidden sm:inline ml-1">Completar</span>
                              </Button>
                            )}
                            {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Cancelar"
                                disabled={updatingId === appointment.id}
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowCancelDialog(true);
                                }}
                              >
                                <X className="size-4" />
                                <span className="hidden sm:inline ml-1">Cancelar</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita de {selectedAppointment?.clientName}.
              El cliente deberá ser notificado sobre la cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAppointment}>
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}