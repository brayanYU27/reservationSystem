import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService } from '@/services/appointment.service';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  History,
  Heart,
  User,
  Bell,
  RefreshCw
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getGoogleMapsUrl } from '@/lib/mapUtils';

export function ClientView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadAppointments();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadAppointments(true); // Silent refresh
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, []);

  const loadAppointments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const response = await appointmentService.getMyAppointments();
      if (isMountedRef.current && response.success && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await appointmentService.cancel(selectedAppointment.id);
      if (response.success) {
        toast.success('Cita cancelada exitosamente');
        setAppointments(prev => prev.map(apt =>
          apt.id === selectedAppointment.id ? { ...apt, status: 'CANCELLED' } : apt
        ));
        setShowCancelDialog(false);
        setShowDetailsDialog(false); // Close details if open
      } else {
        toast.error('No se pudo cancelar la cita');
      }
    } catch (error) {
      console.error('Error cancelando cita:', error);
      toast.error('Error al intentar cancelar');
    }
  };

  const openDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const openCancel = (appointment: Appointment, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent opening details if clicked on card
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  // Separar citas próximas y pasadas  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Separar citas próximas y pasadas
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Ajuste de zona horaria: Comparamos fechas calendario, no timestamps UTC directos
  const today = startOfDay(new Date());

  // Helper para convertir la fecha UTC de la BD a fecha local del mismo día calendario
  const getLocalDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    // Extraer componentes UTC para reconstruir en local sin shift
    // Ojo: si la fecha ya viene como string YYYY-MM-DD es más fácil
    // Asumimos formato ISO de Prisma
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    return new Date(year, month, day);
  };

  // Sort upcoming: soonest first
  const allUpcomingAppointments = appointments
    .filter(apt => {
      const aptDate = getLocalDate(apt.date);
      // Si es hoy, verificamos hora?? Por ahora simple: si es hoy o futuro
      // isBefore(aptDate, today) -> true si aptDate < today. 
      // Queremos aptDate >= today.
      return !isBefore(aptDate, today) && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
    })
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  // Mostrar solo 3 si no está expandido
  const displayedUpcomingAppointments = showAllUpcoming
    ? allUpcomingAppointments
    : allUpcomingAppointments.slice(0, 3);

  // Sort past: most recent first
  const pastAppointments = appointments
    .filter(apt => {
      const aptDate = getLocalDate(apt.date);
      return isBefore(aptDate, today) || apt.status === 'COMPLETED' || apt.status === 'CANCELLED';
    })
    .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime())
    .slice(0, 5); // Solo mostrar las últimas 5

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; className?: string }> = {
      CONFIRMED: { variant: 'default', text: 'Confirmada', className: 'bg-green-600 hover:bg-green-700' },
      PENDING: { variant: 'secondary', text: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
      COMPLETED: { variant: 'outline', text: 'Completada', className: 'text-neutral-500' },
      CANCELLED: { variant: 'destructive', text: 'Cancelada', className: '' },
      NO_SHOW: { variant: 'destructive', text: 'No Asistió', className: '' },
    };
    return variants[status] || variants.PENDING;
  };

  const handleExplore = () => {
    navigate('/explore');
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header - Mobile optimized */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-neutral-600">Hola,</p>
              <h1 className="text-xl font-bold">{user?.firstName}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadAppointments()}
                disabled={refreshing}
                className={refreshing ? 'animate-spin' : ''}
              >
                <RefreshCw className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile First */}
      <div className="p-4">
        <Button
          onClick={handleExplore}
          size="lg"
          className="w-full h-14 text-lg shadow-lg"
        >
          <Plus className="size-5 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Próximas Citas</h2>
          {allUpcomingAppointments.length > 3 && (
            <button
              className="text-sm text-blue-600 font-medium"
              onClick={() => setShowAllUpcoming(!showAllUpcoming)}
            >
              {showAllUpcoming ? 'Ver menos' : 'Ver todas'}
            </button>
          )}
        </div>

        {allUpcomingAppointments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="size-12 mx-auto mb-3 text-neutral-400" />
              <p className="text-neutral-600 mb-4">No tienes citas programadas</p>
              <Button onClick={handleExplore} variant="outline">
                <Search className="size-4 mr-2" />
                Explorar Servicios
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedUpcomingAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetails(appointment)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Business Logo */}
                    <div className="flex-shrink-0">
                      <div className="size-16 rounded-lg overflow-hidden bg-neutral-100">
                        <img
                          src={appointment.business?.logo || 'https://via.placeholder.com/400'}
                          alt={appointment.business?.name || 'Negocio'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base truncate">
                            {appointment.business?.name || 'Negocio'}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {appointment.service?.name || 'Servicio'}
                          </p>
                        </div>
                        <Badge
                          variant={getStatusBadge(appointment.status).variant}
                          className={`ml-2 ${getStatusBadge(appointment.status).className}`}
                        >
                          {getStatusBadge(appointment.status).text}
                        </Badge>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4" />
                          <span>{format(new Date(appointment.date), 'd MMM', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="size-4" />
                          <span>{appointment.startTime}</span>
                        </div>
                      </div>

                      {/* Address */}
                      {appointment.business && (
                        <div className="flex items-start gap-1 text-xs text-neutral-500 mb-3">
                          <MapPin className="size-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {appointment.business.address}, {appointment.business.city}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(appointment);
                          }}
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => openCancel(appointment, e)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExplore}>
            <CardContent className="p-4 text-center">
              <div className="size-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                <Search className="size-6 text-blue-600" />
              </div>
              <p className="text-xs font-medium">Explorar</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="size-12 mx-auto mb-2 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="size-6 text-pink-600" />
              </div>
              <p className="text-xs font-medium">Favoritos</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="size-12 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                <History className="size-6 text-purple-600" />
              </div>
              <p className="text-xs font-medium">Historial</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="px-4 pb-20">
          <h2 className="text-lg font-semibold mb-3">Historial Reciente</h2>
          <div className="space-y-2">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{appointment.business?.name || 'Negocio'}</p>
                      <p className="text-sm text-neutral-600">{appointment.service?.name || 'Servicio'}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {format(new Date(appointment.date), "d 'de' MMMM", { locale: es })} • {getStatusBadge(appointment.status).text}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Calificar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-10 md:hidden">
        <div className="grid grid-cols-4 gap-1">
          <button className="flex flex-col items-center py-3 text-neutral-900">
            <Calendar className="size-5 mb-1" />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button className="flex flex-col items-center py-3 text-neutral-500" onClick={handleExplore}>
            <Search className="size-5 mb-1" />
            <span className="text-xs">Explorar</span>
          </button>
          <button className="flex flex-col items-center py-3 text-neutral-500">
            <Heart className="size-5 mb-1" />
            <span className="text-xs">Favoritos</span>
          </button>
          <button className="flex flex-col items-center py-3 text-neutral-500">
            <User className="size-5 mb-1" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de tu reserva.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`p-3 rounded-lg text-center font-medium border ${selectedAppointment.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-100' :
                selectedAppointment.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                  selectedAppointment.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-neutral-50 text-neutral-700'
                }`}>
                {getStatusBadge(selectedAppointment.status).text}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="bg-neutral-100 p-2 rounded-md">
                    <MapPin className="size-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedAppointment.business?.name}</p>
                    <p className="text-sm text-neutral-600">{selectedAppointment.business?.address}</p>
                    <p className="text-sm text-neutral-600">{selectedAppointment.business?.city}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-blue-600 text-xs mt-1"
                      onClick={() => {
                        if (selectedAppointment.business?.address && selectedAppointment.business?.city) {
                          window.open(
                            getGoogleMapsUrl(
                              selectedAppointment.business.address,
                              selectedAppointment.business.city,
                              selectedAppointment.business.latitude,
                              selectedAppointment.business.longitude
                            ),
                            '_blank'
                          );
                        }
                      }}
                    >
                      Ver en mapa
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-neutral-100 p-2 rounded-md">
                    <Calendar className="size-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {format(new Date(selectedAppointment.date), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {selectedAppointment.startTime} - {selectedAppointment.endTime || 'Calculando...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-neutral-100 p-2 rounded-md">
                    <User className="size-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedAppointment.service?.name}</p>
                    <p className="text-sm text-neutral-600">
                      Profesional: {selectedAppointment.employee?.user?.firstName || 'Cualquiera'}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Duración: {selectedAppointment.service?.duration} min
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border mt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">${selectedAppointment.price || selectedAppointment.service?.price}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 justify-end sm:justify-end">
            {(selectedAppointment?.status === 'PENDING' || selectedAppointment?.status === 'CONFIRMED') && (
              <Button
                variant="destructive"
                onClick={() => {
                  // Switch to cancel dialog
                  setShowCancelDialog(true);
                  // Details dialog stays open in background or close it? 
                  // UX choice: Close details, enable cancel.
                  // But Dialog/AlertDialog stacking can be tricky.
                  // Let's close details.
                  // setShowDetailsDialog(false); 
                }}
              >
                Cancelar Cita
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará tu cita para {selectedAppointment?.service?.name} el {selectedAppointment && format(new Date(selectedAppointment.date), 'd MMM', { locale: es })}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAppointment} className="bg-red-600 hover:bg-red-700">
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
