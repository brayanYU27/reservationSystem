import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Search, UserCheck, Clock, Scissors, Phone, Users, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { format, parse, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AuthContext } from '@/contexts/AuthContext';
import { employeeService } from '@/services/employee.service';
import { appointmentService } from '@/services/appointment.service';
import { businessService } from '@/services/business.service';
import type { Employee, Appointment as ApiAppointment, Service } from '@/types';

type BarberStatus = 'available' | 'busy' | 'break';

interface EnrichedEmployee extends Employee {
  status: BarberStatus;
  currentAppointment?: ApiAppointment;
}

interface WalkInForm {
  clientName: string;
  phone: string;
  serviceId: string;
  employeeId: string;
}
export function ReceptionTab() {
  const { user } = useContext(AuthContext);
  const isMountedRef = useRef(true);
  const [employees, setEmployees] = useState<EnrichedEmployee[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWalkInDialog, setShowWalkInDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walkInForm, setWalkInForm] = useState<WalkInForm>({
    clientName: '',
    phone: '',
    serviceId: '',
    employeeId: '',
  });

  const loadReceptionData = useCallback(async () => {
    if (!user) return;

    if (isMountedRef.current) setLoading(true);
    try {
      // Primero obtener el negocio del usuario
      const businessRes = await businessService.getMy();
      if (!isMountedRef.current) return;

      if (!businessRes.success || !businessRes.data) {
        if (isMountedRef.current) toast.error('No se pudo cargar el negocio');
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const businessId = businessRes.data.id;

      // Cargar empleados, citas y servicios en paralelo
      const [employeesRes, appointmentsRes, servicesRes] = await Promise.all([
        employeeService.getByBusiness(businessId),
        appointmentService.getBusinessAppointments(businessId, {
          dateFrom: format(startOfDay(new Date()), 'yyyy-MM-dd'),
          dateTo: format(startOfDay(new Date()), 'yyyy-MM-dd'),
        }),
        businessService.getServices(businessId),
      ]);

      if (!isMountedRef.current) return;

      if (employeesRes.success && employeesRes.data) {
        const now = new Date();
        const enrichedEmployees = employeesRes.data.map(emp => {
          const currentAppointment = appointmentsRes.data?.find(apt => {
            if (apt.employeeId !== emp.id) return false;
            // Verificar si está en servicio o confirmado (que ya llegó)
            if (apt.status !== 'IN_PROGRESS' && apt.status !== 'CONFIRMED') return false;

            const appointmentDate = new Date(apt.date);
            // Asegurarnos que es hoy (comparando YYYY-MM-DD)
            const aptDateString = format(appointmentDate, 'yyyy-MM-dd');
            const todayString = format(now, 'yyyy-MM-dd');


            if (aptDateString !== todayString) return false;

            // Si está IN_PROGRESS, asumimos que es la cita actual
            if (apt.status === 'IN_PROGRESS') return true;

            const start = parse(`${aptDateString} ${apt.startTime}`, 'yyyy-MM-dd HH:mm', appointmentDate);
            // Estimamos fin si no está definido o usamos duración del servicio
            const endTime = apt.endTime || format(new Date(start.getTime() + (apt.duration || 30) * 60000), 'HH:mm');
            const end = parse(`${aptDateString} ${endTime}`, 'yyyy-MM-dd HH:mm', appointmentDate);

            return now >= start && now <= end;
          });

          let status: BarberStatus = 'available';
          if (currentAppointment) {
            status = 'busy';
          }

          return {
            ...emp,
            status,
            currentAppointment,
          };
        });
        if (isMountedRef.current) setEmployees(enrichedEmployees);
      }

      if (appointmentsRes.success && appointmentsRes.data) {
        if (isMountedRef.current) setAppointments(appointmentsRes.data);
      }

      if (servicesRes.success && servicesRes.data) {
        if (isMountedRef.current) setServices(servicesRes.data);
      }
    } catch (error) {
      console.error('Error loading reception data:', error);
      if (isMountedRef.current) toast.error('Error al cargar datos de recepción');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [user]);

  // Cargar datos iniciales
  useEffect(() => {
    isMountedRef.current = true;
    loadReceptionData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadReceptionData]);

  const handleAddWalkIn = async () => {
    if (!walkInForm.clientName || !walkInForm.phone || !walkInForm.serviceId || !walkInForm.employeeId) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!user) return;

    try {
      // Obtener el negocio del usuario
      const businessRes = await businessService.getMy();
      if (!businessRes.success || !businessRes.data) {
        toast.error('No se pudo obtener el negocio');
        return;
      }

      const service = services.find(s => s.id === walkInForm.serviceId);
      if (!service) return;

      // Crear cita walk-in para ahora
      const now = new Date();
      const appointment = await appointmentService.create({
        businessId: businessRes.data.id,
        serviceId: walkInForm.serviceId,
        employeeId: walkInForm.employeeId,
        date: format(now, 'yyyy-MM-dd'),
        startTime: format(now, 'HH:mm'),
        clientNotes: `Walk-in: ${walkInForm.clientName} - ${walkInForm.phone}`,
      });

      if (appointment.success && appointment.data) {
        toast.success(`${walkInForm.clientName} registrado como walk-in`);
        setShowWalkInDialog(false);
        setWalkInForm({ clientName: '', phone: '', serviceId: '', employeeId: '' });
        loadReceptionData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error creating walk-in:', error);
      toast.error('Error al registrar walk-in');
    }
  };

  const handleCheckIn = async (appointment: ApiAppointment) => {
    try {
      const result = await appointmentService.updateStatus(appointment.id, 'confirmed');
      if (result.success) {
        toast.success(`Check-in confirmado para ${appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Cliente'}`);
        loadReceptionData();
      }
    } catch (error) {
      console.error('Error in check-in:', error);
      toast.error('Error al hacer check-in');
    }
  };

  const handleStartService = async (appointment: ApiAppointment) => {
    try {
      const result = await appointmentService.updateStatus(appointment.id, 'in_progress');
      if (result.success) {
        toast.success('Servicio iniciado');
        loadReceptionData();
      }
    } catch (error) {
      console.error('Error starting service:', error);
      toast.error('Error al iniciar servicio');
    }
  };

  const handleCompleteService = async (appointment: ApiAppointment) => {
    try {
      const result = await appointmentService.complete(appointment.id);
      if (result.success) {
        toast.success('Servicio completado');
        loadReceptionData();
      }
    } catch (error) {
      console.error('Error completing service:', error);
      toast.error('Error al completar servicio');
    }
  };

  const handleBarberBreak = (employeeId: string, onBreak: boolean) => {
    // Actualizar estado local del empleado
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, status: onBreak ? 'break' : 'available' }
          : emp
      )
    );
    const employee = employees.find(e => e.id === employeeId);
    toast.success(`${employee?.user?.firstName} ${onBreak ? 'en descanso' : 'disponible nuevamente'}`);
  };

  const getStatusBadge = (status: BarberStatus) => {
    const variants = {
      available: { variant: 'default' as const, label: 'Disponible', color: 'bg-green-500' },
      busy: { variant: 'destructive' as const, label: 'Ocupado', color: 'bg-red-500' },
      break: { variant: 'secondary' as const, label: 'En descanso', color: 'bg-yellow-500' },
    };
    return variants[status];
  };

  const getAppointmentStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Agendada' },
      CONFIRMED: { variant: 'default', label: 'Check-in' },
      IN_PROGRESS: { variant: 'outline', label: 'En progreso' },
      COMPLETED: { variant: 'outline', label: 'Completada' },
      CANCELLED: { variant: 'destructive', label: 'Cancelada' },
      NO_SHOW: { variant: 'destructive', label: 'No show' },
    };
    return variants[status] || variants.PENDING;
  };

  const todayAppointments = appointments.filter(apt => {
    if (!apt.date) return false;
    // Fix: Comparar string ISO directo
    const dateVal = apt.date as unknown as (string | Date);
    const aptDateString = typeof dateVal === 'string'
      ? dateVal.split('T')[0]
      : format(dateVal, 'yyyy-MM-dd');
    const todayString = format(new Date(), 'yyyy-MM-dd');

    return aptDateString === todayString && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';
  });

  const scheduledAppointments = todayAppointments.filter(a => a.status === 'PENDING');
  const checkedInAppointments = todayAppointments.filter(a => a.status === 'CONFIRMED');
  const waitingList = checkedInAppointments.length;

  const filteredAppointments = todayAppointments.filter(apt => {
    const clientName = apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : '';
    const clientPhone = apt.client?.phone || '';
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientPhone.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de actualizar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recepción</h2>
          <p className="text-neutral-600">Gestiona el check-in y flujo de clientes</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadReceptionData}
          disabled={loading}
        >
          <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Barberos Disponibles</CardDescription>
            <CardTitle className="text-3xl">
              {employees.filter(e => e.status === 'available').length}/{employees.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>En Sala de Espera</CardDescription>
            <CardTitle className="text-3xl">{waitingList}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Citas Pendientes Hoy</CardDescription>
            <CardTitle className="text-3xl">{scheduledAppointments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Barbers Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Barberos en Tiempo Real</CardTitle>
          <CardDescription>
            Monitorea la disponibilidad y actividad actual de cada barbero
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No hay empleados registrados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((employee) => {
                const statusConfig = getStatusBadge(employee.status);
                const appointment = employee.currentAppointment;

                return (
                  <Card key={employee.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <Avatar className="size-16">
                            <AvatarImage src={employee.user?.avatar || ''} />
                            <AvatarFallback>
                              {employee.user?.firstName?.[0]}{employee.user?.lastName?.[0] || 'E'}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 size-5 ${statusConfig.color} border-2 border-white rounded-full`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{employee.user?.firstName} {employee.user?.lastName}</h4>
                          <Badge variant={statusConfig.variant} className="mt-1">
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {employee.status === 'busy' && appointment && (
                        <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Scissors className="size-4 text-neutral-600" />
                            <span className="font-medium">Atendiendo a:</span>
                            <span>{appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Cliente'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Clock className="size-4" />
                            <span>{appointment.service?.name || 'Servicio'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <span>
                              {appointment.startTime} - {appointment.endTime || 'En proceso'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleCompleteService(appointment)}
                          >
                            Marcar como Completado
                          </Button>
                        </div>
                      )}

                      {employee.status === 'available' && (
                        <div className="text-sm text-neutral-600 text-center py-2">
                          Listo para atender al siguiente cliente
                        </div>
                      )}

                      {employee.status === 'break' && (
                        <div className="text-sm text-neutral-600 text-center py-2">
                          En descanso
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        {employee.status !== 'busy' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              handleBarberBreak(employee.id, employee.status !== 'break')
                            }
                          >
                            {employee.status === 'break' ? 'Terminar Descanso' : 'Iniciar Descanso'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in and Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Check-in y Cola</CardTitle>
              <CardDescription>
                Registra la llegada de clientes y gestiona la cola de espera
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWalkInDialog(true)}
            >
              Walk-in
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Appointments List */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                {searchTerm ? 'No se encontraron resultados' : 'No hay citas pendientes'}
              </div>
            ) : (
              filteredAppointments.map((appointment) => {
                const employee = employees.find(e => e.id === appointment.employeeId);
                const statusConfig = getAppointmentStatusBadge(appointment.status);

                return (
                  <Card key={appointment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Cliente'}</h4>
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                            {/* Late Indicator */}
                            {(() => {
                              const now = new Date();
                              const [hours, minutes] = appointment.startTime.split(':').map(Number);
                              const aptTime = new Date();
                              aptTime.setHours(hours, minutes, 0, 0);

                              const isLate = now > aptTime && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');

                              if (isLate) {
                                return (
                                  <Badge variant="destructive" className="ml-2 bg-red-600">
                                    Retrasado
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="text-sm text-neutral-600 space-y-1">
                            {appointment.client?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="size-3" />
                                <span>{appointment.client.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Scissors className="size-3" />
                              <span>{appointment.service?.name || 'Servicio'}</span>
                            </div>
                            {employee && (
                              <div className="flex items-center gap-2">
                                <Users className="size-3" />
                                <span>Barbero: {employee.user?.firstName} {employee.user?.lastName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="size-3" />
                              <span>Horario: {appointment.startTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {appointment.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(appointment)}
                            >
                              <UserCheck className="size-4 mr-1" />
                              Check-in
                            </Button>
                          )}
                          {appointment.status === 'CONFIRMED' && (
                            <>
                              {employee?.status === 'available' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartService(appointment)}
                                >
                                  <Scissors className="size-4 mr-1" />
                                  Iniciar Servicio
                                </Button>
                              ) : (
                                <div className="text-xs text-center text-neutral-500 max-w-[120px]">
                                  <AlertCircle className="size-4 mx-auto mb-1" />
                                  Esperando a {employee?.user?.firstName}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Walk-in Dialog */}
      <Dialog open={showWalkInDialog} onOpenChange={setShowWalkInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cliente Walk-in</DialogTitle>
            <DialogDescription>
              Registra a un cliente que llega sin cita previa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="walkin-name">Nombre del Cliente *</Label>
              <Input
                id="walkin-name"
                placeholder="Juan Pérez"
                value={walkInForm.clientName}
                onChange={(e) => setWalkInForm({ ...walkInForm, clientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkin-phone">Teléfono *</Label>
              <Input
                id="walkin-phone"
                type="tel"
                placeholder="55 1234 5678"
                value={walkInForm.phone}
                onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkin-service">Servicio *</Label>
              <Select
                value={walkInForm.serviceId}
                onValueChange={(value) => setWalkInForm({ ...walkInForm, serviceId: value })}
              >
                <SelectTrigger id="walkin-service">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkin-barber">Barbero *</Label>
              <Select
                value={walkInForm.employeeId}
                onValueChange={(value) => setWalkInForm({ ...walkInForm, employeeId: value })}
              >
                <SelectTrigger id="walkin-barber">
                  <SelectValue placeholder="Selecciona un barbero" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => {
                    const isAvailable = employee.status === 'available';
                    return (
                      <SelectItem key={employee.id} value={employee.id} disabled={!isAvailable}>
                        {employee.user?.firstName} {employee.user?.lastName} {!isAvailable && `(${getStatusBadge(employee.status).label})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWalkInDialog(false);
              setWalkInForm({ clientName: '', phone: '', serviceId: '', employeeId: '' });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddWalkIn}>
              <UserCheck className="size-4 mr-2" />
              Registrar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}