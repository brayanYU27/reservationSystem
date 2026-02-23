import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { businessService } from '@/services/business.service';
import type { Business, Service, Employee, BusinessHours, Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MapPin, Star, Clock, Calendar, ChevronLeft, Phone, Globe, Facebook, Instagram, Scissors, Heart } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { BookingModal } from './BookingModal';
import { getGoogleMapsUrl } from '@/lib/mapUtils';

function GalleryItem({ image }: { image: any }) {
    const [likes, setLikes] = useState(image.likes || 0);
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            if (isLiked) {
                setLikes((prev: number) => Math.max(0, prev - 1));
                setIsLiked(false);
                if (image.id) {
                    await businessService.unlikeGalleryImage(image.id);
                }
            } else {
                setLikes((prev: number) => prev + 1);
                setIsLiked(true);
                if (image.id) {
                    await businessService.likeGalleryImage(image.id);
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert state on error
            if (isLiked) {
                setLikes((prev: number) => prev + 1);
                setIsLiked(true);
            } else {
                setLikes((prev: number) => Math.max(0, prev - 1));
                setIsLiked(false);
            }
        }
    };

    return (
        <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-200 relative group">
            <ImageWithFallback
                src={image.url || image}
                alt={image.title || 'Gallery image'}
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 p-4 text-center">

                {image.title && (
                    <h3 className="text-white font-bold text-sm mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {image.title}
                    </h3>
                )}

                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isLiked ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'} backdrop-blur-md`}
                >
                    <Heart className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
                    <span className="text-white text-xs font-bold">{likes}</span>
                </button>
            </div>
        </div>
    );
}

// ... component code ...
export function BusinessPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);

    const loadBusinessData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await businessService.getById(id);
            if (response.success && response.data) {
                setBusiness(response.data);

                // Check for nested data if available
                const businessData = response.data as any;
                if (businessData.services) setServices(businessData.services);
                if (businessData.employees) setEmployees(businessData.employees);
            }

        } catch (error) {
            console.error('Error loading business:', error);
            toast.error('Error al cargar la información del negocio');
            navigate('/explore');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadBusinessData();
    }, [loadBusinessData]);

    const handleBookService = (serviceId?: string) => {
        if (!user) {
            toast.error('Debes iniciar sesión para reservar');
            navigate('/login', { state: { from: `/business/${id}` } });
            return;
        }
        if (serviceId) setSelectedServiceId(serviceId);
        setIsBookingModalOpen(true);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    if (!business) return null;

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header / Hero Section */}
            <div className="relative h-[300px] md:h-[50vh] min-h-[300px] w-full bg-black">
                <ImageWithFallback
                    src={business.coverImage || 'https://via.placeholder.com/1200x400'}
                    alt={business.name}
                    className="w-full h-full object-cover object-center opacity-60"
                />

                {/* Navbar Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        {/* Logo placeholder if needed */}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/explore')}
                            className="bg-black/30 text-white hover:bg-black/50 border-none backdrop-blur-sm"
                        >
                            <ChevronLeft className="size-4 mr-1" />
                            Volver
                        </Button>
                        {user?.role === 'ADMIN' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/admin')}
                                className="bg-black/30 text-white hover:bg-black/50 border-none backdrop-blur-sm"
                            >
                                Panel Admin
                            </Button>
                        )}
                    </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 mb-2 text-sm opacity-90">
                                    <MapPin className="size-4" />
                                    <span>{business.city}, {business.state} • {business.address}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">{business.name}</h1>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold">{(business.rating || 0).toFixed(1)}</span>
                                        <span className="opacity-80">({business.totalReviews || 0} reseñas)</span>
                                    </div>
                                    <Badge variant="secondary" className="text-sm font-normal bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-none">
                                        {business.category}
                                    </Badge>
                                </div>

                                <p className="text-lg opacity-90 line-clamp-2 max-w-xl">
                                    {business.description}
                                </p>
                            </div>

                            {/* CTA Box */}
                            <Card className="w-full md:w-auto min-w-[300px] bg-white/10 backdrop-blur-md border-white/20 text-white shadow-xl">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold mb-2">Reserva tu cita ahora</h3>
                                    <p className="text-sm opacity-80 mb-4">Atención profesional con los mejores barberos de la ciudad</p>
                                    <Button
                                        size="lg"
                                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold"
                                        onClick={() => handleBookService()}
                                    >
                                        Agendar Cita
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 space-y-16">

                {/* Team Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-neutral-900">Nuestros Profesionales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(employees || []).map(employee => (
                            <Card key={employee.id} className="overflow-hidden hover:shadow-lg transition-all border-none shadow-sm">
                                <CardContent className="p-0 flex items-center gap-4 p-4">
                                    <Avatar className="size-16 border-2 border-white shadow-sm">
                                        <AvatarImage src={employee.avatar} className="object-cover object-center" />
                                        <AvatarFallback className="bg-neutral-100 text-neutral-500 text-xl font-bold">
                                            {employee.position?.charAt(0) || 'P'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-lg text-neutral-900">Profesional</h3>
                                        <p className="text-sm text-neutral-500">{employee.position}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                            <span className="text-xs font-medium">{employee.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Services Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-neutral-900">Nuestros Servicios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(services || []).map(service => (
                            <Card key={service.id} className="group hover:border-black transition-colors cursor-pointer" onClick={() => handleBookService(service.id)}>
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                            <Scissors className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{service.name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3.5" />
                                                    {service.duration} min
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-lg mb-1">${service.price} MXN</span>
                                        <Button size="sm" variant="ghost" className="h-8 text-xs hover:bg-black hover:text-white">
                                            Reservar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Gallery Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-neutral-900">Nuestro Trabajo</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(business.gallery && business.gallery.length > 0 ? business.gallery : [
                            { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80', likes: 0, title: 'Corte Clásico' },
                            { url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80', likes: 0, title: 'Barba y Bigote' },
                            { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80', likes: 0, title: 'Estilo Moderno' },
                            { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80', likes: 0, title: 'Tratamiento Facial' }
                        ]).map((image: any, index: number) => (
                            <GalleryItem key={image.id || index} image={image} />
                        ))}
                    </div>
                </section>

                {/* Reviews Section Placeholder */}
                <section className="bg-neutral-50 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-8 text-center text-neutral-900">Lo que dicen nuestros clientes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(business.reviews && business.reviews.length > 0 ? business.reviews : []).map((review: Review) => (
                            <Card key={review.id} className="border-none shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                className={`size-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-neutral-600 mb-6 italic">"{review.comment}"</p>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarImage src={review.client?.avatar} />
                                            <AvatarFallback>
                                                {review.client?.firstName?.charAt(0) || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm">{review.client?.firstName} {review.client?.lastName}</p>
                                            <p className="text-xs text-neutral-500">Cliente Verificado</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {(!business.reviews || business.reviews.length === 0) && (
                            <div className="col-span-3 text-center text-neutral-500 py-8">
                                No hay reseñas disponibles todavía.
                            </div>
                        )}
                    </div>
                </section>

                {/* FAQ / Info Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Preguntas Frecuentes</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {(business.faqs && business.faqs.length > 0 ? business.faqs : []).map((faq: { question: string; answer: string }, index: number) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                            {(!business.faqs || business.faqs.length === 0) && (
                                <div className="text-neutral-500 py-4">
                                    No hay preguntas frecuentes disponibles.
                                </div>
                            )}
                        </Accordion>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-6">Ubicación y Contacto</h2>
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="p-6 space-y-6">
                                <div className="flex gap-4">
                                    <MapPin className="size-6 text-neutral-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="font-bold mb-1">Ubicación</h3>
                                        <p className="text-neutral-600 text-sm mb-2">
                                            {business.address}, {business.city}, {business.state}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full sm:w-auto"
                                            onClick={() => window.open(getGoogleMapsUrl(business.address, business.city, business.latitude, business.longitude), '_blank')}
                                        >
                                            <MapPin className="size-4 mr-2" />
                                            Ver en Google Maps
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Phone className="size-6 text-neutral-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold mb-1">Teléfono</h3>
                                        <p className="text-neutral-600 text-sm">{business.phone}</p>
                                        {business.whatsapp && <p className="text-neutral-600 text-sm">WhatsApp: {business.whatsapp}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Clock className="size-6 text-neutral-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold mb-1">Horario</h3>
                                        <div className="space-y-1">
                                            {(business.workingHours || []).map((h: any, i: number) => (
                                                <div key={i} className="text-sm text-neutral-600 flex justify-between w-48">
                                                    <span className="capitalize">{h.day.slice(0, 3)}</span>
                                                    <span>{h.isOpen ? `${h.open} - ${h.close}` : 'Cerrado'}</span>
                                                </div>
                                            )).slice(0, 3)}
                                            {(!business.workingHours || business.workingHours.length === 0) && (
                                                <p className="text-sm text-neutral-500 italic">Horario no disponible</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex gap-2">
                                        {business.socialMedia?.facebook && (
                                            <Button variant="outline" className="w-full" onClick={() => window.open(business.socialMedia?.facebook, '_blank')}>
                                                <Facebook className="size-4 mr-2" />
                                                Facebook
                                            </Button>
                                        )}
                                        {business.socialMedia?.instagram && (
                                            <Button variant="outline" className="w-full" onClick={() => window.open(business.socialMedia?.instagram, '_blank')}>
                                                <Instagram className="size-4 mr-2" />
                                                Instagram
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>

            {/* Booking Modal */}
            {
                business && (
                    <BookingModal
                        open={isBookingModalOpen}
                        onOpenChange={setIsBookingModalOpen}
                        businessId={business.id}
                        businessName={business.name}
                        services={services}
                        employees={employees}
                        preSelectedServiceId={selectedServiceId}
                    />
                )
            }
        </div >
    );
}
