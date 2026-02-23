import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LoadingButton, SkeletonLoader } from '@/components/ui';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check, User, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { businessService } from '@/services/business.service';
import { getGoogleMapsUrl } from '@/lib/mapUtils';
import { appointmentService } from '@/services/appointment.service';
import { toast } from 'sonner';
import type { Service, Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface BookingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    businessId: string;
    businessName: string;
    services: Service[];
    employees: Employee[];
    preSelectedServiceId?: string;
}

type Step = 'service' | 'professional' | 'date' | 'guest-info' | 'confirm' | 'success';

export function BookingModal({
    open,
    onOpenChange,
    businessId,
    businessName,
    services,
    employees,
    preSelectedServiceId
}: BookingModalProps) {
    const { user } = useAuth();

    const [step, setStep] = useState<Step>('service');
    const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(preSelectedServiceId);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('any');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

    // Guest State
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [booking, setBooking] = useState(false);
    const [business, setBusiness] = useState<any>(null);

    // Fetch business details for map link
    useEffect(() => {
        if (open && businessId) {
            businessService.getById(businessId).then(res => {
                if (res.success) setBusiness(res.data);
            });
        }
    }, [open, businessId]);

    useEffect(() => {
        if (open) {
            if (preSelectedServiceId) {
                setSelectedServiceId(preSelectedServiceId);
                setStep('professional');
            } else {
                setStep('service');
                setSelectedServiceId(undefined);
            }
            setSelectedEmployeeId('any');
            setSelectedDate(new Date());
            setSelectedTime(undefined);
            setAvailableSlots([]);
        }
    }, [open, preSelectedServiceId]);

    useEffect(() => {
        if (step === 'date' && selectedDate && selectedServiceId) {
            loadAvailability();
        }
    }, [step, selectedDate, selectedEmployeeId, selectedServiceId]);

    const loadAvailability = async () => {
        if (!selectedDate || !selectedServiceId) return;

        setLoadingSlots(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await businessService.getAvailability(
                businessId,
                dateStr,
                selectedServiceId,
                selectedEmployeeId === 'any' ? undefined : selectedEmployeeId
            );

            if (response.success && response.data) {
                setAvailableSlots(response.data);
                if ((response as any).debug) {
                    console.log('DEBUG:', (response as any).debug);
                    // toast.info(JSON.stringify((response as any).debug));
                }
            } else {
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Error loading availability:', error);
            toast.error('Error al cargar horarios');
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedServiceId || !selectedDate || !selectedTime) return;

        setBooking(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await appointmentService.create({
                businessId,
                serviceId: selectedServiceId,
                employeeId: selectedEmployeeId === 'any' ? undefined : selectedEmployeeId,
                date: dateStr,
                startTime: selectedTime,
                guestName: !user ? guestName : undefined,
                guestEmail: !user ? guestEmail : undefined,
                guestPhone: !user ? guestPhone : undefined,
            });

            if (response.success) {
                // toast.success('¡Reserva confirmada con éxito!'); // Moved to UI feedback
                setStep('success');
                // onOpenChange(false); // Validated by user request to show success screen
            } else {
                toast.error(response.error?.message || 'Error al procesar la reserva');
            }
        } catch (error) {
            console.error('Error booking:', error);
            toast.error('Ocurrió un error al reservar');
        } finally {
            setBooking(false);
        }
    };

    const selectedService = services.find(s => s.id === selectedServiceId);
    // Employee matching logic is tricky if 'any' is selected. 
    // If specific employee selected, find them.

    const canProceed = () => {
        if (step === 'service' && !selectedServiceId) return false;
        if (step === 'date' && !selectedTime) return false;
        if (step === 'guest-info' && (!guestName || !guestEmail || !guestPhone)) return false;
        return true;
    };

    const nextStep = () => {
        if (step === 'service' && selectedServiceId) setStep('professional');
        else if (step === 'professional') setStep('date');
        else if (step === 'date' && selectedTime) {
            if (user) {
                setStep('confirm');
            } else {
                setStep('guest-info');
            }
        }
        else if (step === 'guest-info') {
            if (guestName && guestEmail && guestPhone) setStep('confirm');
            else toast.error('Por favor completa tus datos');
        }
    };

    const prevStep = () => {
        if (step === 'confirm') {
            if (user) setStep('date');
            else setStep('guest-info');
        }
        else if (step === 'guest-info') setStep('date');
        else if (step === 'date') setStep('professional');
        else if (step === 'professional') {
            if (preSelectedServiceId) onOpenChange(false);
            else setStep('service');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b bg-neutral-50">
                    <DialogTitle>Reservar Cita</DialogTitle>
                    <DialogDescription>
                        {businessName}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    {/* Progress Indicator (Optional) */}

                    {step === 'service' && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Selecciona un servicio</h3>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                    {services.map(service => (
                                        <div
                                            key={service.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedServiceId === service.id ? 'border-black bg-neutral-50' : 'hover:border-neutral-300'}`}
                                            onClick={() => setSelectedServiceId(service.id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="font-medium">{service.name}</div>
                                                <div className="font-semibold">${service.price}</div>
                                            </div>
                                            <div className="text-sm text-neutral-500 mt-1">
                                                {service.duration} min
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {step === 'professional' && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Selecciona un profesional</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className={`p-3 rounded-lg border cursor-pointer flex flex-col items-center gap-2 text-center transition-colors ${selectedEmployeeId === 'any' ? 'border-black bg-neutral-50' : 'hover:border-neutral-300'}`}
                                    onClick={() => setSelectedEmployeeId('any')}
                                >
                                    <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center">
                                        <User className="size-6 text-neutral-500" />
                                    </div>
                                    <span className="font-medium text-sm">Cualquiera</span>
                                    <span className="text-xs text-neutral-500">Máxima disponibilidad</span>
                                </div>
                                {employees.map(employee => (
                                    <div
                                        key={employee.id}
                                        className={`p-3 rounded-lg border cursor-pointer flex flex-col items-center gap-2 text-center transition-colors ${selectedEmployeeId === employee.id ? 'border-black bg-neutral-50' : 'hover:border-neutral-300'}`}
                                        onClick={() => setSelectedEmployeeId(employee.id)}
                                    >
                                        <Avatar className="size-12">
                                            <AvatarImage src={employee.avatar} />
                                            <AvatarFallback>{employee.position?.charAt(0) || 'P'}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">
                                            {/* User name not available directly in Employee object in some contexts, assuming structure */}
                                            Profesional
                                        </span>
                                        <span className="text-xs text-neutral-500">{employee.specialties[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'date' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-2 block">Fecha</label>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        className="rounded-md border mx-auto"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-2 block">Horas disponibles</label>
                                    <ScrollArea className="h-[280px]">
                                        {loadingSlots ? (
                                            <div className="space-y-2">
                                                <SkeletonLoader variant="list" count={6} className="h-10" />
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="text-center py-8 text-neutral-500 text-sm">
                                                No hay horarios disponibles para esta fecha.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {availableSlots.map((slot) => (
                                                    <Button
                                                        key={slot.time}
                                                        variant={selectedTime === slot.time ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setSelectedTime(slot.time)}
                                                        disabled={!slot.available}
                                                        className={`w-full ${!slot.available ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''}`}
                                                    >
                                                        {slot.time}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'guest-info' && (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <h3 className="font-semibold text-lg text-center mb-4">Tus Datos</h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="guestName">Nombre Completo</Label>
                                    <Input
                                        id="guestName"
                                        placeholder="Ej. Juan Pérez"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="guestEmail">Correo Electrónico</Label>
                                    <Input
                                        id="guestEmail"
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="guestPhone">Teléfono</Label>
                                    <Input
                                        id="guestPhone"
                                        type="tel"
                                        placeholder="Ej. +52 123 456 7890"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && selectedService && selectedDate && selectedTime && (
                        <div className="space-y-4">
                            <div className="bg-neutral-50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Servicio</span>
                                    <span className="font-medium">{selectedService.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Profesional</span>
                                    <span className="font-medium">{selectedEmployeeId === 'any' ? 'Cualquiera' : 'Profesional seleccionado'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Fecha</span>
                                    <span className="font-medium">{format(selectedDate, 'd MMM yyyy', { locale: es })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Hora</span>
                                    <span className="font-medium">{selectedTime}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${selectedService.price}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <Check className="size-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold">¡Reserva Generada!</h3>
                            <p className="text-neutral-600 max-w-xs">
                                Tu reserva ha sido generada exitosamente. Espera la confirmación del negocio.
                            </p>
                            {business && business.address && business.city && (
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={() => window.open(getGoogleMapsUrl(business.address, business.city), '_blank')}
                                >
                                    <MapPin className="size-4 mr-2" />
                                    Cómo llegar
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-2 border-t bg-neutral-50 flex-row justify-between sm:justify-between">
                    {step === 'success' ? (
                        <div className="w-full flex justify-end">
                            <Button key="close-btn" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                                Cerrar
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full justify-between items-center">
                            {step !== 'service' ? (
                                <Button key="back-btn" variant="ghost" onClick={prevStep} disabled={booking}>
                                    <ChevronLeft className="size-4 mr-1" />
                                    Atrás
                                </Button>
                            ) : (
                                <div key="spacer" />
                            )}

                            {step === 'confirm' ? (
                                <LoadingButton
                                    key="confirm-btn"
                                    onClick={handleConfirmBooking}
                                    loading={booking}
                                    variant="default"
                                >
                                    Confirmar Reserva
                                </LoadingButton>
                            ) : (
                                <LoadingButton
                                    key="next-btn"
                                    onClick={nextStep}
                                    loading={false}
                                    disabled={!canProceed()}
                                    variant="default"
                                >
                                    Continuar
                                    <ChevronRight className="size-4 ml-2" />
                                </LoadingButton>
                            )}
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
