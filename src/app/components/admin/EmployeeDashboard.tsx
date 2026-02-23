import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService } from '@/services/appointment.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Timer,
  RefreshCw,
  LogIn,
  Play
} from 'lucide-react';
import { format, isSameDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setRefreshing(true);
      if (!user?.employeeProfile?.id) {
        // Fallback or setup for employee who doesn't have a profile linked yet
        console.warn("Usuario no tiene perfil de empleado vinculado");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log("Cargando citas para empleado:", user.employeeProfile.id);

      const response = await appointmentService.list({
        employeeId: user.employeeProfile.id,
        page: 1,
        limit: 100,
        // Optional: filter by date range if needed, for now getting all to show history/future
      });

      if (response.success && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
      toast.error('Error al cargar las citas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleStatusUpdate = async (id: string, action: 'confirm' | 'check-in' | 'complete' | 'no-show') => {
    try {
      let response;
      switch (action) {
        case 'confirm':
          response = await appointmentService.confirm(id);
          break;
        case 'check-in':
          // Using updateStatus directly as checkIn shortcut might not be in service yet or implies 'CHECKED_IN'
          response = await appointmentService.updateStatus(id, 'CHECKED_IN');
          break;
        case 'complete':
          response = await appointmentService.complete(id);
          break;
        case 'no-show':
          response = await appointmentService.markNoShow(id);
          break;
      }

      if (response?.success) {
        toast.success(`Cita actualizada: ${action}`);
        loadAppointments(); // Reload to see changes
      } else {
        toast.error('No se pudo actualizar la cita');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar la acción');
    }
  };

  // Filtrar citas del día seleccionado
  const todayAppointments = appointments.filter(apt => {
    // Fix: Parse date string as local date to avoid timezone shifts
    const dateVal = apt.date as unknown as (string | Date);
    const dateString = typeof dateVal === 'string'
      ? dateVal.split('T')[0]
      : format(dateVal, 'yyyy-MM-dd');
    const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

    return isSameDay(aptDate, selectedDate) && apt.status !== 'CANCELLED';
  });

  // Próximas citas (futuras)
  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.date) > new Date() && apt.status !== 'CANCELLED'
  ).slice(0, 5);

  // ... (stats calculation remains the same)
  const stats = {
    today: todayAppointments.length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: any }> = {
      CONFIRMED: { variant: 'default', text: 'Confirmada', icon: CheckCircle2 },
      PENDING: { variant: 'secondary', text: 'Pendiente', icon: Timer },
      COMPLETED: { variant: 'outline', text: 'Completada', icon: CheckCircle2 },
      CANCELLED: { variant: 'destructive', text: 'Cancelada', icon: XCircle },
      CHECKED_IN: { variant: 'default', text: 'En Espera', icon: User }, // Or "Llegó"
      IN_PROGRESS: { variant: 'default', text: 'En Proceso', icon: Play },
      NO_SHOW: { variant: 'destructive', text: 'No Asistió', icon: XCircle },
    };
    return variants[status] || variants.PENDING;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Hola, {user?.firstName}! 👋</h2>
          <p className="text-neutral-600 mt-1">
            Aquí están tus citas programadas
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadAppointments} disabled={refreshing}>
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* ... (stats cards remain same) ... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Citas Hoy
            </CardTitle>
            <Calendar className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-neutral-600">
              {format(new Date(), "d 'de' MMMM", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes
            </CardTitle>
            <Timer className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-neutral-600">
              Por confirmar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Confirmadas
            </CardTitle>
            <CheckCircle2 className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <p className="text-xs text-neutral-600">
              Listas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completadas
            </CardTitle>
            <CheckCircle2 className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-neutral-600">
              Total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Citas de Hoy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Citas de Hoy
          </CardTitle>
          <CardDescription>
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-12 mx-auto mb-3 text-neutral-400" />
              <p className="text-neutral-600">No tienes citas programadas para hoy</p>
              <p className="text-sm text-neutral-500 mt-1">Disfruta tu día libre! 🎉</p>
              <Button variant="outline" className="mt-4" onClick={loadAppointments}>
                Actualizar Calendario
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => {
                const statusInfo = getStatusBadge(appointment.status);
                const StatusIcon = statusInfo.icon;

                // Fix: Parse date string as local date to avoid timezone shifts
                const dateVal = appointment.date as unknown as (string | Date);
                const dateString = typeof dateVal === 'string'
                  ? dateVal.split('T')[0]
                  : format(dateVal, 'yyyy-MM-dd');
                const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow bg-white"
                  >
                    {/* Time */}
                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-3 min-w-[80px] w-full md:w-auto">
                      <Clock className="size-4 text-blue-600 mb-1" />
                      <span className="text-lg font-bold text-blue-900">
                        {appointment.startTime}
                      </span>
                      <span className="text-xs text-blue-600">
                        {appointment.duration} min
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {appointment.client?.firstName} {appointment.client?.lastName}
                            <Badge variant={statusInfo.variant} className="ml-2">
                              <StatusIcon className="size-3 mr-1" />
                              {statusInfo.text}
                            </Badge>
                          </h4>
                          <p className="text-sm text-neutral-600">
                            {appointment.service?.name}
                          </p>
                        </div>
                        <div className="text-left md:text-right mt-2 md:mt-0">
                          <p className="font-semibold text-green-600">
                            ${appointment.price}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600 bg-neutral-50 p-2 rounded mb-3">
                        {appointment.client?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3" />
                            <span>{appointment.client.phone}</span>
                          </div>
                        )}
                        {appointment.clientNotes && (
                          <div className="text-xs text-neutral-500 italic">
                            Nota: {appointment.clientNotes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                        {appointment.status === 'PENDING' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(appointment.id, 'confirm')}>
                            Confirmar
                          </Button>
                        )}

                        {(appointment.status === 'CONFIRMED') && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusUpdate(appointment.id, 'check-in')}
                            >
                              <LogIn className="size-4 mr-2" />
                              Recibir (Llegó)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetailsDialog(true);
                              }}
                            >
                              Ver Detalles
                            </Button>
                          </>
                        )}

                        {(appointment.status === 'CHECKED_IN' || appointment.status === 'IN_PROGRESS') && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusUpdate(appointment.id, 'complete')}
                          >
                            <CheckCircle2 className="size-4 mr-2" />
                            Completar Servicio
                          </Button>
                        )}

                        <Button size="sm" variant="ghost">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Citas */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="size-5" />
              Próximas Citas
            </CardTitle>
            <CardDescription>
              Tus siguientes {upcomingAppointments.length} citas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => {
                // Fix: Parse date string as local date to avoid timezone shifts
                const dateVal = appointment.date as unknown as (string | Date);
                const dateString = typeof dateVal === 'string'
                  ? dateVal.split('T')[0]
                  : format(dateVal, 'yyyy-MM-dd');
                const aptDate = parse(dateString, 'yyyy-MM-dd', new Date());

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {appointment.client?.firstName?.[0]}{appointment.client?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {appointment.service?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(aptDate, "d MMM", { locale: es })}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {appointment.startTime}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la reserva
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-neutral-500">Fecha</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-neutral-600" />
                    <span>{format(new Date(selectedAppointment.date), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-neutral-500">Hora</span>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-neutral-600" />
                    <span>{selectedAppointment.startTime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-neutral-500">Servicio</span>
                <div className="font-medium">{selectedAppointment.service?.name}</div>
                <div className="text-sm text-neutral-600">
                  Duración: {selectedAppointment.service?.duration} min - Precio: ${selectedAppointment.service?.price}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-neutral-500">Cliente</span>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-neutral-600" />
                  <span className="font-medium">
                    {selectedAppointment.client?.firstName} {selectedAppointment.client?.lastName}
                  </span>
                </div>
                {selectedAppointment.client?.phone && (
                  <div className="flex items-center gap-2 text-sm text-neutral-600 pl-6">
                    <Phone className="size-3" />
                    <span>{selectedAppointment.client.phone}</span>
                  </div>
                )}
              </div>

              {selectedAppointment.clientNotes && (
                <div className="space-y-1 p-3 bg-neutral-50 rounded-md border">
                  <span className="text-sm font-medium text-neutral-500 block mb-1">Notas del Cliente</span>
                  <p className="text-sm italic">{selectedAppointment.clientNotes}</p>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
