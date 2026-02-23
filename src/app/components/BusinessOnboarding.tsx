import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  ChevronRight,
  ChevronLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Scissors,
  CheckCircle2,
  Upload,
  Calendar,
  Loader2,
  Map
} from 'lucide-react';
import { toast } from 'sonner';
import { businessService } from '@/services/business.service';
import { LocationPicker } from './ui/LocationPicker';

interface BusinessOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

export function BusinessOnboarding({ onComplete, onCancel }: BusinessOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Información básica
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Ubicación y contacto
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // Step 3: Redes sociales y horarios
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [schedule, setSchedule] = useState({
    monday: { open: '09:00', close: '19:00', closed: false },
    tuesday: { open: '09:00', close: '19:00', closed: false },
    wednesday: { open: '09:00', close: '19:00', closed: false },
    thursday: { open: '09:00', close: '19:00', closed: false },
    friday: { open: '09:00', close: '19:00', closed: false },
    saturday: { open: '10:00', close: '18:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: true },
  });

  const categories = [
    'Barbería',
    'Salón de Belleza',
    'Manicurista / Nail Salon',
    'Spa / Masajes',
    'Estilista',
    'Centro de Estética',
    'Peluquería',
    'Otro'
  ];

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!businessName || !category || !description) {
          toast.error('Por favor completa todos los campos obligatorios');
          return false;
        }
        return true;
      case 2:
        if (!address || !city || !state || !phone) {
          toast.error('Por favor completa todos los campos obligatorios');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsSubmitting(true);

      // Mapear categoría a enum del backend
      const categoryMap: Record<string, string> = {
        'Barbería': 'BARBERSHOP',
        'Salón de Belleza': 'BEAUTY_SALON',
        'Manicurista / Nail Salon': 'NAILS',
        'Spa / Masajes': 'SPA',
        'Estilista': 'BEAUTY_SALON',
        'Centro de Estética': 'SPA',
        'Peluquería': 'BEAUTY_SALON',
        'Otro': 'OTHER'
      };

      // Convertir horarios al formato esperado
      const workingHours: Record<string, any> = {};
      Object.entries(schedule).forEach(([day, value]) => {
        workingHours[day] = {
          isOpen: !value.closed,
          openTime: !value.closed ? value.open : undefined,
          closeTime: !value.closed ? value.close : undefined,
        };
      });

      const businessData = {
        name: businessName,
        category: categoryMap[category] || 'OTHER',
        description,
        address,
        city,
        state,
        postalCode: postalCode || '00000',
        phone,
        email: email || phone + '@temp.com', // Email temporal si no se proporciona
        whatsapp: whatsapp || undefined,
        website: website || undefined,
        latitude,
        longitude,
        socialMedia: {
          facebook: facebook || undefined,
          instagram: instagram || undefined,
        },
        workingHours,
      };

      console.log('Enviando datos:', businessData); // Para debug

      const response = await businessService.create(businessData);

      if (response.success) {
        toast.success('¡Negocio registrado exitosamente!');
        setTimeout(() => {
          onComplete();
        }, 1000);
      } else {
        const errorMessage = response.error?.message || response.error || 'Error al registrar el negocio';
        console.error('Error de API:', response.error);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error al crear negocio:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar el negocio';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDayClosed = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], closed: !prev[day as keyof typeof prev].closed }
    }));
  };

  const updateScheduleTime = (day: string, field: 'open' | 'close', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value }
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`size-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep >= step
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-200 text-neutral-500'
              }`}
          >
            {currentStep > step ? <CheckCircle2 className="size-5" /> : step}
          </div>
          {index < 3 && (
            <div
              className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-neutral-900' : 'bg-neutral-200'
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-neutral-900 size-12 rounded-full flex items-center justify-center">
                <Scissors className="size-6 text-white" />
              </div>
              <span className="text-2xl font-bold">ServiConnect</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Registra tu Negocio</h1>
            <p className="text-neutral-600">
              Completa el proceso en 4 simples pasos y comienza a recibir clientes
            </p>
          </div>

          {renderStepIndicator()}

          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && 'Información Básica'}
                {currentStep === 2 && 'Ubicación y Contacto'}
                {currentStep === 3 && 'Redes Sociales y Horarios'}
                {currentStep === 4 && 'Confirmación'}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Cuéntanos sobre tu negocio'}
                {currentStep === 2 && 'Dónde te encuentras y cómo contactarte'}
                {currentStep === 3 && 'Horarios de atención y presencia online'}
                {currentStep === 4 && 'Revisa tu información antes de finalizar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Información Básica */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Nombre del Negocio *</Label>
                    <Input
                      id="businessName"
                      placeholder="Ej: Barbería El Clásico"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción del Negocio *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu negocio, servicios y lo que te hace único..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      maxLength={500}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      {description.length}/500 caracteres
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Tip:</strong> Una buena descripción incluye tus servicios principales,
                      años de experiencia y lo que te diferencia de la competencia.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Ubicación y Contacto */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Dirección *</Label>
                    <Input
                      id="address"
                      placeholder="Av. Insurgentes Sur 1234"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input
                        id="city"
                        placeholder="Ciudad de México"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        placeholder="CDMX"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Código Postal</Label>
                      <Input
                        id="postalCode"
                        placeholder="03100"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="55 1234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="55 9876 5432"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@tunegocio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Separator className="my-6" />

                  <LocationPicker
                    lat={latitude}
                    lng={longitude}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </div>
              )}

              {/* Step 3: Redes y Horarios */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Redes Sociales (opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          placeholder="@tunegocio"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          placeholder="@tunegocio"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Sitio Web</Label>
                      <Input
                        id="website"
                        placeholder="https://www.tunegocio.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Horarios de Atención</h3>
                    {days.map((day) => (
                      <div key={day.key} className="flex items-center gap-3">
                        <div className="w-24">
                          <Label className="text-sm">{day.label}</Label>
                        </div>
                        {schedule[day.key as keyof typeof schedule].closed ? (
                          <div className="flex-1">
                            <Badge variant="outline">Cerrado</Badge>
                          </div>
                        ) : (
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={schedule[day.key as keyof typeof schedule].open}
                              onChange={(e) => updateScheduleTime(day.key, 'open', e.target.value)}
                              className="text-sm"
                            />
                            <Input
                              type="time"
                              value={schedule[day.key as keyof typeof schedule].close}
                              onChange={(e) => updateScheduleTime(day.key, 'close', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDayClosed(day.key)}
                        >
                          {schedule[day.key as keyof typeof schedule].closed ? 'Abrir' : 'Cerrar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Confirmación */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                    <CheckCircle2 className="size-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">¡Casi listo!</h3>
                    <p className="text-neutral-600">
                      Revisa la información de tu negocio antes de finalizar
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Información Básica</h4>
                      <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                        <p><strong>Nombre:</strong> {businessName}</p>
                        <p><strong>Categoría:</strong> {category}</p>
                        <p><strong>Descripción:</strong> {description}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Ubicación y Contacto</h4>
                      <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                        <p><strong>Dirección:</strong> {address}, {city}, {state} {postalCode}</p>
                        <p><strong>Teléfono:</strong> {phone}</p>
                        {whatsapp && <p><strong>WhatsApp:</strong> {whatsapp}</p>}
                        {email && <p><strong>Email:</strong> {email}</p>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Horarios</h4>
                      <div className="bg-neutral-50 p-4 rounded-lg space-y-1">
                        {days.map((day) => {
                          const daySchedule = schedule[day.key as keyof typeof schedule];
                          return (
                            <p key={day.key} className="text-sm">
                              <strong>{day.label}:</strong>{' '}
                              {daySchedule.closed
                                ? 'Cerrado'
                                : `${daySchedule.open} - ${daySchedule.close}`}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">
                      📋 <strong>Próximos pasos:</strong> Después de registrarte, podrás agregar
                      servicios, precios, tu equipo de profesionales y fotos de tu negocio desde el
                      panel de administración.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={currentStep === 1 ? onCancel : handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="size-4 mr-2" />
                  {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={handleNext} disabled={isSubmitting}>
                    Siguiente
                    <ChevronRight className="size-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4 mr-2" />
                        Finalizar Registro
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}