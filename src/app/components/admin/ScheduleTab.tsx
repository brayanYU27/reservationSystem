import { useState, useEffect, useRef } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { businessService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Clock, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DaySchedule {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

const timeOptions = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];

const daysOfWeek = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export function ScheduleTab() {
  const { business, refreshBusiness } = useBusiness();
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: true, openTime: '09:00', closeTime: '19:00' },
    tuesday: { enabled: true, openTime: '09:00', closeTime: '19:00' },
    wednesday: { enabled: true, openTime: '09:00', closeTime: '19:00' },
    thursday: { enabled: true, openTime: '09:00', closeTime: '19:00' },
    friday: { enabled: true, openTime: '09:00', closeTime: '19:00' },
    saturday: { enabled: true, openTime: '10:00', closeTime: '18:00' },
    sunday: { enabled: false, openTime: '10:00', closeTime: '15:00' },
  });

  const [appointmentInterval, setAppointmentInterval] = useState('30');
  const [advanceBookingDays, setAdvanceBookingDays] = useState('30');

  // Cargar horarios del negocio
  useEffect(() => {
    isMountedRef.current = true;
    
    if (business?.workingHours && Array.isArray(business.workingHours)) {
      const newSchedule: WeekSchedule = {};
      
      business.workingHours.forEach((wh: any) => {
        newSchedule[wh.day] = {
          enabled: wh.isOpen || false,
          openTime: wh.open || '09:00',
          closeTime: wh.close || '19:00',
        };
      });
      
      if (isMountedRef.current) setSchedule(newSchedule);
    }

    // Cargar configuración
    if (business?.settings) {
      const settings = business.settings as any;
      if (settings.bookingAdvanceDays) {
        if (isMountedRef.current) setAdvanceBookingDays(String(settings.bookingAdvanceDays));
      }
    }
    
    return () => { isMountedRef.current = false; };
  }, [business]);

  const handleToggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const handleTimeChange = (day: string, type: 'openTime' | 'closeTime', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  const handleSaveSchedule = async () => {
    if (!business?.id) {
      toast.error('No se encontró el negocio');
      return;
    }

    try {
      setSaving(true);

      // Convertir schedule al formato del backend
      const workingHours = Object.entries(schedule).map(([day, data]) => ({
        day,
        isOpen: data.enabled,
        open: data.openTime,
        close: data.closeTime,
      }));

      const response = await businessService.update(business.id, {
        workingHours,
        settings: {
          ...business.settings,
          bookingAdvanceDays: parseInt(advanceBookingDays),
        },
      } as any);

      if (response.success) {
        await refreshBusiness();
        toast.success('Horario actualizado correctamente');
      }
    } catch (error: any) {
      console.error('Error guardando horario:', error);
      toast.error(error.message || 'Error al actualizar el horario');
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = () => {
    const mondaySchedule = schedule.monday;
    const newSchedule = { ...schedule };
    
    Object.keys(newSchedule).forEach(day => {
      if (day !== 'sunday') {
        newSchedule[day] = { ...mondaySchedule };
      }
    });
    
    setSchedule(newSchedule);
    toast.success('Horario aplicado a todos los días hábiles');
  };

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-neutral-500 text-lg">No tienes un negocio registrado</p>
        <p className="text-sm text-neutral-400 mt-2">
          Necesitas registrar un negocio para configurar horarios
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Define los parámetros generales para las reservaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="interval">Intervalo entre citas</Label>
              <Select value={appointmentInterval} onValueChange={setAppointmentInterval}>
                <SelectTrigger id="interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500">
                Tiempo mínimo entre cada reservación
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance-booking">Días de anticipación máxima</Label>
              <Select value={advanceBookingDays} onValueChange={setAdvanceBookingDays}>
                <SelectTrigger id="advance-booking">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500">
                Con cuánta anticipación pueden reservar los clientes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Horario Semanal</CardTitle>
              <CardDescription>
                Configura tus horarios de atención para cada día
              </CardDescription>
            </div>
            <Button variant="outline" onClick={applyToAll}>
              <Calendar className="size-4 mr-2" />
              Aplicar a todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {daysOfWeek.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between sm:justify-start sm:w-40">
                  <Label htmlFor={`${key}-toggle`} className="font-semibold">
                    {label}
                  </Label>
                  <Switch
                    id={`${key}-toggle`}
                    checked={schedule[key].enabled}
                    onCheckedChange={() => handleToggleDay(key)}
                  />
                </div>

                {schedule[key].enabled ? (
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Clock className="size-4 text-neutral-500" />
                      <Select
                        value={schedule[key].openTime}
                        onValueChange={(value) => handleTimeChange(key, 'openTime', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <span className="text-neutral-500">a</span>

                    <div className="flex items-center gap-2 flex-1">
                      <Select
                        value={schedule[key].closeTime}
                        onValueChange={(value) => handleTimeChange(key, 'closeTime', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <Badge variant="secondary" className="sm:ml-auto">Cerrado</Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSchedule} size="lg" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Horarios</CardTitle>
          <CardDescription>
            Vista previa de tus horarios de atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daysOfWeek.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <span className="font-medium">{label}</span>
                {schedule[key].enabled ? (
                  <span className="text-sm text-neutral-600">
                    {schedule[key].openTime} - {schedule[key].closeTime}
                  </span>
                ) : (
                  <Badge variant="secondary">Cerrado</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
