import { useState, useEffect, useRef } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { businessService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { LoadingButton, ErrorMessage, TimezoneSelector } from '@/components/ui';
import {
  Save,
  Clock,
  DollarSign,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Loader2,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessSettings {
  allowOnlineBooking?: boolean;
  autoConfirm?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number;
  cancellationPolicy?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  reminderTime?: number;
  acceptCash?: boolean;
  acceptCard?: boolean;
  acceptTransfer?: boolean;
}

export function SettingsTab() {
  const { business, refreshBusiness } = useBusiness();
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business Settings
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true);
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [cancellationPolicy, setCancellationPolicy] = useState('Se requiere cancelar con 24 horas de anticipación para evitar cargos');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [timezone, setTimezone] = useState('America/Mexico_City');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('2'); // horas antes

  // Payment Settings
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [acceptTransfer, setAcceptTransfer] = useState(true);

  // Cargar configuración actual del negocio
  useEffect(() => {
    isMountedRef.current = true;

    if (business) {
      const settings = business.settings as BusinessSettings;

      if (isMountedRef.current) {
        // Load timezone from business
        setTimezone(business.timezone || 'America/Mexico_City');

        // Load settings
        if (settings) {
          setAllowOnlineBooking(settings.allowOnlineBooking ?? true);
          setAutoConfirm(settings.autoConfirm ?? true);
          setRequiresDeposit(settings.requiresDeposit ?? false);
          setDepositAmount(String(settings.depositAmount ?? 100));
          setCancellationPolicy(settings.cancellationPolicy ?? 'Se requiere cancelar con 24 horas de anticipación para evitar cargos');
          setEmailNotifications(settings.emailNotifications ?? true);
          setSmsNotifications(settings.smsNotifications ?? false);
          setReminderTime(String(settings.reminderTime ?? 2));
          setAcceptCash(settings.acceptCash ?? true);
          setAcceptCard(settings.acceptCard ?? true);
          setAcceptTransfer(settings.acceptTransfer ?? true);
        }
      }
    }

    return () => { isMountedRef.current = false; };
  }, [business]);

  const handleSaveSettings = async () => {
    if (!business?.id) {
      setError('No se encontró el negocio');
      return;
    }

    if (isMountedRef.current) {
      setSaving(true);
      setError(null);
    }

    try {
      const settingsData: BusinessSettings = {
        allowOnlineBooking,
        autoConfirm,
        requiresDeposit,
        depositAmount: parseFloat(depositAmount) || 0,
        cancellationPolicy,
        emailNotifications,
        smsNotifications,
        reminderTime: parseInt(reminderTime) || 2,
        acceptCash,
        acceptCard,
        acceptTransfer,
      };

      const response = await businessService.update(business.id, {
        settings: settingsData,
        timezone,
      });

      if (!isMountedRef.current) return;

      if (response.success) {
        await refreshBusiness();
        toast.success('Configuración guardada exitosamente');
      } else {
        setError(response.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (isMountedRef.current) {
        setError('Error al guardar la configuración. Por favor, intenta de nuevo.');
      }
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Configuración del Negocio</h3>
          <p className="text-neutral-600">Personaliza la experiencia de tus clientes</p>
        </div>
        <LoadingButton
          onClick={handleSaveSettings}
          loading={saving}
          variant="primary"
        >
          <Save className="size-4 mr-2" />
          Guardar Cambios
        </LoadingButton>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          title="Error al guardar"
          message={error}
          variant="error"
          onRetry={handleSaveSettings}
        />
      )}

      {/* Timezone Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Zona Horaria
          </CardTitle>
          <CardDescription>
            Configura la zona horaria de tu negocio para mostrar las citas correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimezoneSelector
            value={timezone}
            onChange={setTimezone}
          />
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Importante:</strong> Cambiar la zona horaria afectará cómo se muestran todas las citas y horarios en tu negocio.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Configuración de Reservas
          </CardTitle>
          <CardDescription>
            Controla cómo los clientes pueden reservar contigo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Online Booking */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Reservas Online</Label>
              <p className="text-sm text-neutral-600">
                Permite que los clientes reserven desde tu perfil
              </p>
            </div>
            <Switch
              checked={allowOnlineBooking}
              onCheckedChange={setAllowOnlineBooking}
            />
          </div>

          <Separator />

          {/* Auto Confirm */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Confirmación Automática</Label>
              <p className="text-sm text-neutral-600">
                Las citas se confirman automáticamente sin tu aprobación
              </p>
            </div>
            <Switch
              checked={autoConfirm}
              onCheckedChange={setAutoConfirm}
            />
          </div>

          <Separator />

          {/* Deposit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Requiere Depósito</Label>
                <p className="text-sm text-neutral-600">
                  Los clientes deben pagar un depósito para confirmar
                </p>
              </div>
              <Switch
                checked={requiresDeposit}
                onCheckedChange={setRequiresDeposit}
              />
            </div>

            {requiresDeposit && (
              <div className="ml-6 space-y-2">
                <Label>Monto del Depósito (MXN)</Label>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="max-w-xs"
                  min="0"
                  step="10"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Cancellation Policy */}
          <div className="space-y-2">
            <Label>Política de Cancelación</Label>
            <Textarea
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              rows={3}
              placeholder="Describe tu política de cancelación..."
            />
            <p className="text-xs text-neutral-600">
              Esta política se mostrará a los clientes al reservar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Información del Negocio
          </CardTitle>
          <CardDescription>
            Información básica que verán tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Negocio</Label>
              <Input
                value={business?.name || ''}
                disabled
                className="bg-neutral-50"
              />
              <p className="text-xs text-neutral-600">
                Contacta al soporte para cambiar el nombre
              </p>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input
                value={business?.category || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={business?.description || ''}
              disabled
              rows={3}
              className="bg-neutral-50"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={business?.phone || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={business?.email || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={business?.address || ''}
              disabled
              className="bg-neutral-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={business?.city || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={business?.state || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input
                value={business?.postalCode || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Para actualizar la información del negocio, por favor contacta a nuestro equipo de soporte.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Notificaciones por Email</Label>
              <p className="text-sm text-neutral-600">
                Recibe emails sobre nuevas reservas y cambios
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator />

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-base">Notificaciones por SMS</Label>
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </div>
              <p className="text-sm text-neutral-600">
                Recibe SMS sobre citas importantes
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>

          <Separator />

          {/* Reminder Time */}
          <div className="space-y-2">
            <Label>Recordatorio de Citas</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="max-w-[100px]"
              />
              <span className="text-sm text-neutral-600">horas antes de la cita</span>
            </div>
            <p className="text-xs text-neutral-600">
              Tanto tú como el cliente recibirán un recordatorio
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Métodos de Pago
          </CardTitle>
          <CardDescription>
            Indica qué métodos de pago aceptas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-green-600" />
              <Label className="text-base">Efectivo</Label>
            </div>
            <Switch
              checked={acceptCash}
              onCheckedChange={setAcceptCash}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-blue-600" />
              <Label className="text-base">Tarjeta (Débito/Crédito)</Label>
            </div>
            <Switch
              checked={acceptCard}
              onCheckedChange={setAcceptCard}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-purple-600" />
              <Label className="text-base">Transferencia</Label>
            </div>
            <Switch
              checked={acceptTransfer}
              onCheckedChange={setAcceptTransfer}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Shield className="size-5" />
            Privacidad y Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-800">
          <p>✓ Tus datos están protegidos con encriptación de nivel bancario</p>
          <p>✓ Solo tú y tu equipo pueden ver información sensible</p>
          <p>✓ Los clientes solo ven información pública de tu negocio</p>
          <p>✓ Puedes exportar o eliminar tus datos en cualquier momento</p>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-blue-900">Plan Actual: Premium</span>
            <Badge variant="default" className="bg-blue-600">Activo</Badge>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Renovación: 9 de marzo de 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p>✓ Hasta 10 empleados</p>
            <p>✓ Servicios ilimitados</p>
            <p>✓ 1,000 citas por mes</p>
            <p>✓ Reportes y analytics avanzados</p>
            <p>✓ Soporte prioritario</p>
          </div>
          <Button variant="outline" className="mt-4 border-blue-600 text-blue-600">
            Gestionar Suscripción
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
