import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import { Calendar as CalendarIcon, Search, Phone, Mail, CheckCheck, UserCheck, X, Clock, User, Loader2, List } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { businessService } from '@/services/business.service';
import { appointmentService } from '@/services/appointment.service';
import { AppointmentCalendar } from './AppointmentCalendar'; // Import Calendar
import type { Appointment } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '../ui/utils';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS' | 'CHECKED_IN';

interface EnrichedAppointment extends Omit<Appointment, 'service'> {
  clientName?: string;
  barberName?: string;
  serviceName?: string;
  service?: {
    name: string;
    duration: number;
    price: number;
  };
  totalPrice?: number;
}

export function AppointmentsTab() {
  const { user } = useAuth();
  const isMountedRef = useRef(true);
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list'); // View state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    if (isMountedRef.current) setLoading(true);
    try {
      const businessRes = await businessService.getMy();
      if (!isMountedRef.current) return;

      if (!businessRes.success || !businessRes.data) {
        toast.error('No se pudo cargar el negocio');
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const businessId = businessRes.data.id;

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const appointmentsRes = await businessService.getAppointments(businessId, {
        dateFrom: format(monthStart, 'yyyy-MM-dd'),
        dateTo: format(monthEnd, 'yyyy-MM-dd'),
      });

      if (!isMountedRef.current) return;

      if (appointmentsRes.success && appointmentsRes.data) {
        const enriched = appointmentsRes.data.map((apt: any) => ({
          ...apt,
          clientName: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : 'Cliente Sin Nombre',
          barberName: apt.employee?.user
            ? `${apt.employee.user.firstName} ${apt.employee.user.lastName}`
            : 'Sin asignar',
          serviceName: apt.service?.name || 'Servicio',
          // Transform employee to match Appointment type
          employee: apt.employee?.user ? {
            name: `${apt.employee.user.firstName} ${apt.employee.user.lastName}`,
            avatar: apt.employee.user.avatar
          } : undefined,
          service: apt.service ? {
            ...apt.service,
            duration: apt.service.duration || 0,
            price: apt.service.price || 0
          } : undefined
        }));

        if (isMountedRef.current) setAppointments(enriched);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      if (isMountedRef.current) toast.error('Error al cargar las citas');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;
    loadAppointments();
    // Ensure selectedDate defaults to today on mount if not set (though useState should handle it)
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [loadAppointments]);

  const filteredAppointments = appointments.filter((apt) => {
    // Fix: Parse date string as local date to avoid timezone shifts
    const dateVal = apt.date as unknown as (string | Date);
    const dateString = typeof dateVal === 'string'
      ? dateVal.split('T')[0]
      : format(dateVal, 'yyyy-MM-dd');
    const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

    const matchesSearch = apt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client?.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;

    // Filter by selected date if a date is selected
    const matchesDate = selectedDate ? isSameDay(aptDate, selectedDate) : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const getStatusBadge = (status: AppointmentStatus) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pendiente' },
      CONFIRMED: { variant: 'default', label: 'Confirmada' },
      COMPLETED: { variant: 'outline', label: 'Completada' },
      CANCELLED: { variant: 'destructive', label: 'Cancelada' },
      NO_SHOW: { variant: 'destructive', label: 'No se presentó' },
      IN_PROGRESS: { variant: 'default', label: 'En Progreso' },
      CHECKED_IN: { variant: 'default', label: 'En Espera' }
    };

    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // const today = startOfDay(new Date());
  const todayAppointments = appointments.filter(
    apt => {
      // Fix: Parse date string as local date to avoid timezone shifts
      const dateVal = apt.date as unknown as (string | Date);
      const dateString = typeof dateVal === 'string'
        ? dateVal.split('T')[0]
        : format(dateVal, 'yyyy-MM-dd');
      const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

      return isSameDay(aptDate, new Date()) &&
        apt.status !== 'CANCELLED';
    }
  );

  const upcomingAppointments = appointments.filter(
    apt => {
      // Fix: Parse date string as local date to avoid timezone shifts
      const dateVal = apt.date as unknown as (string | Date);
      const dateString = typeof dateVal === 'string'
        ? dateVal.split('T')[0]
        : format(dateVal, 'yyyy-MM-dd');
      const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

      // Compare with end of today to show strictly future dates, or just > now
      // If we want "upcoming" to mean future days:
      return aptDate > new Date() && apt.status !== 'CANCELLED';
    }
  );

  const todayRevenue = todayAppointments
    .filter(apt => apt.status === 'COMPLETED')
    .reduce((sum, apt) => sum + (apt.totalPrice || apt.price || 0), 0);

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
            onClick={() => { setView('list'); setSelectedDate(undefined); }}
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
            <CardTitle className="text-3xl">{todayAppointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Próximas Citas</CardDescription>
            <CardTitle className="text-3xl">{upcomingAppointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos Hoy</CardDescription>
            <CardTitle className="text-3xl">
              ${todayRevenue.toLocaleString('es-MX')}
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

              {selectedDate && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(undefined)} title="Limpiar fecha">
                  <X className="h-4 w-4" />
                </Button>
              )}
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
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
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
                    // Fix: Parse date string as local date to avoid timezone shifts
                    const dateVal = appointment.date as unknown as (string | Date);
                    const dateString = typeof dateVal === 'string'
                      ? dateVal.split('T')[0]
                      : format(dateVal, 'yyyy-MM-dd');
                    const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.clientName}</div>
                            <div className="text-sm text-neutral-500 md:hidden">
                              {appointment.client?.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {appointment.client?.phone || 'N/A'}
                            </span>
                            {appointment.client?.email && (
                              <span className="flex items-center gap-1 text-neutral-500">
                                <Mail className="size-3" />
                                {appointment.client.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <User className="size-3" />
                            {appointment.barberName}
                          </span>
                        </TableCell>
                        <TableCell>{appointment.serviceName}</TableCell>
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
                          ${appointment.totalPrice || appointment.price || 0}
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