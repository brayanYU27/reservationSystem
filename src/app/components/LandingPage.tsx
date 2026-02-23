import { useState, useEffect } from 'react';
import { Button, buttonVariants } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Search,
  MapPin,
  Scissors,
  Sparkles,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Shield,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Quote
} from 'lucide-react';
import { businessService } from '@/services/business.service';
import type { Business } from '@/types';
import { useNavigate, Link } from 'react-router-dom';

interface LandingPageProps {
  isAuthenticated?: boolean;
  userRole?: string;
}

export function LandingPage({ isAuthenticated, userRole }: LandingPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await businessService.getAll({ limit: 6 });
      if (response.success && response.data) {
        setFeaturedBusinesses(response.data.businesses);
      }
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { icon: Scissors, name: 'Barberías', count: 156, color: 'bg-neutral-100 text-neutral-900', gradient: 'from-neutral-800 to-black' },
    { icon: Sparkles, name: 'Salones', count: 234, color: 'bg-neutral-100 text-neutral-900', gradient: 'from-neutral-800 to-black' },
    { icon: Sparkles, name: 'Manicure', count: 189, color: 'bg-neutral-100 text-neutral-900', gradient: 'from-neutral-800 to-black' },
    { icon: Sparkles, name: 'Spas', count: 98, color: 'bg-neutral-100 text-neutral-900', gradient: 'from-neutral-800 to-black' },
  ];

  const testimonials = [
    {
      name: 'Carlos Méndez',
      role: 'Dueño de Barbería Premium',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
      content: 'Desde que uso ServiConnect, mis reservaciones aumentaron 45%. La plataforma es intuitiva y mis clientes la aman.',
      rating: 5,
    },
    {
      name: 'María González',
      role: 'Estilista Profesional',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      content: 'Gestionar mi agenda nunca fue tan fácil. Ahorro más de 10 horas a la semana en administración.',
      rating: 5,
    },
    {
      name: 'Roberto Silva',
      role: 'Cliente Frecuente',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
      content: 'Reservar mi corte es súper rápido. Me encanta recibir recordatorios y poder ver el portafolio de mi barbero.',
      rating: 5,
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Agenda Inteligente',
      description: 'Sistema automatizado que optimiza tus horarios',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      title: 'Más Clientes',
      description: 'Acceso a miles de usuarios activos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: TrendingUp,
      title: 'Aumenta Ingresos',
      description: '+40% más reservaciones en promedio',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Shield,
      title: '100% Seguro',
      description: 'Pagos protegidos y datos encriptados',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleSearch = () => {
    navigate('/explore');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-white p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Scissors className="size-6 text-neutral-900" />
              </div>
              <span className="text-white font-bold text-xl">ServiConnect</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/pricing"
                className={buttonVariants({ variant: "ghost", className: "text-white hover:bg-white/10" })}
              >
                Precios
              </Link>
              <Link
                to="/explore"
                className={buttonVariants({ variant: "ghost", className: "text-white hover:bg-white/10" })}
              >
                Explorar
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className={buttonVariants({ variant: "ghost", className: "text-white hover:bg-white/10" })}
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/register"
                    className={buttonVariants({ className: "bg-white text-neutral-900 hover:bg-neutral-100" })}
                  >
                    Registrarse
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link
                  to={userRole === 'BUSINESS_OWNER' ? '/admin' : '/dashboard'}
                  className={buttonVariants({ className: "bg-white text-neutral-900 hover:bg-neutral-100" })}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <section className="relative bg-black text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
            animation: 'slide 20s linear infinite'
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 size-72 bg-neutral-800 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute bottom-20 right-10 size-96 bg-neutral-700 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-6 py-2 text-base backdrop-blur-sm animate-fade-in">
              ✨ La plataforma #1 de reservaciones en México
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl mb-6 font-extrabold leading-tight animate-fade-in-up">
              Tu belleza,
              <br />
              <span className="text-white">
                a un clic
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-200">
              Conecta con los mejores profesionales de belleza. Agenda tu cita en segundos, desde cualquier lugar.
            </p>

            {/* Search Box - Glassmorphism */}
            <Card className="max-w-3xl mx-auto shadow-2xl bg-white/95 backdrop-blur-md border-0 animate-fade-in-up delay-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-400" />
                    <Input
                      placeholder="Busca barbería, salón, spa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-12 h-14 text-base border-0 bg-neutral-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-400" />
                    <Input
                      placeholder="Ciudad o código postal"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-12 h-14 text-base border-0 bg-neutral-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-base font-semibold transition-colors"
                  >
                    Buscar
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto animate-fade-in-up delay-500">
              {[
                { value: '1,200+', label: 'Profesionales' },
                { value: '50K+', label: 'Reservaciones' },
                { value: '4.8★', label: 'Calificación' },
                { value: '24/7', label: 'Disponible' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors">
                  <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-neutral-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slide {
            from { transform: translateX(0); }
            to { transform: translateX(40px); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
          .delay-200 { animation-delay: 0.2s; animation-fill-mode: both; }
          .delay-300 { animation-delay: 0.3s; animation-fill-mode: both; }
          .delay-500 { animation-delay: 0.5s; animation-fill-mode: both; }
          .delay-1000 { animation-delay: 1s; }
        `}</style>
      </section>

      {/* Categories */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Explora por Categoría</h2>
            <p className="text-neutral-600 text-xl">
              Encuentra el servicio perfecto para ti
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="cursor-pointer hover:shadow-2xl transition-all group border-0 overflow-hidden"
                  onClick={() => navigate('/explore')}
                >
                  <div className={`h-2 bg-gradient-to-r ${category.gradient}`} />
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className={`${category.color} size-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="size-10" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{category.name}</h3>
                    <p className="text-sm text-neutral-500">{category.count} disponibles</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Por qué ServiConnect?</h2>
            <p className="text-neutral-600 text-xl">
              La plataforma que transforma tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border-0 shadow-lg hover:shadow-2xl transition-all group">
                  <CardContent className="pt-8 text-center">
                    <div className={`${feature.bgColor} size-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`size-10 ${feature.color}`} />
                    </div>
                    <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                    <p className="text-neutral-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Profesionales Destacados</h2>
            <p className="text-neutral-600 text-xl">
              Los más valorados por nuestra comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="overflow-hidden border-0 shadow-lg">
                  <div className="h-56 bg-neutral-200 animate-pulse" />
                  <CardContent className="pt-6 space-y-3">
                    <div className="h-6 bg-neutral-200 animate-pulse rounded" />
                    <div className="h-4 bg-neutral-200 animate-pulse rounded w-2/3" />
                    <div className="h-4 bg-neutral-200 animate-pulse rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business) => (
                <Card
                  key={business.id}
                  className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border-0 shadow-lg"
                  onClick={() => navigate(`/business/${business.id}`)}
                >
                  <div className="h-56 overflow-hidden bg-neutral-100 relative">
                    {business.coverImage ? (
                      <ImageWithFallback
                        src={business.coverImage}
                        alt={business.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                        <Scissors className="size-20 text-neutral-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm">{business.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1">{business.name}</h3>
                        <p className="text-sm text-neutral-600">{business.category}</p>
                      </div>
                      {business.logo && (
                        <img src={business.logo} alt={business.name} className="size-14 rounded-full object-cover border-2 border-neutral-100" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{business.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-neutral-500">
                        <MapPin className="size-4" />
                        {business.city}
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <Scissors className="size-20 mx-auto mb-6 text-neutral-300" />
                <p className="text-neutral-600 text-xl mb-6">No hay negocios registrados aún</p>
                <Button size="lg" onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700">
                  Sé el primero en registrarte
                </Button>
              </div>
            )}
          </div>

          {featuredBusinesses.length > 0 && (
            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/explore')}
                className="border-2 hover:bg-neutral-100"
              >
                Ver Todos los Profesionales
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
            <p className="text-neutral-600 text-xl">
              Miles de profesionales y clientes satisfechos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-12 relative">
                <Quote className="absolute top-8 left-8 size-12 text-blue-200" />
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-6">
                    <Avatar className="size-20 border-4 border-white shadow-lg">
                      <AvatarImage src={testimonials[currentTestimonial].avatar} />
                      <AvatarFallback>{testimonials[currentTestimonial].name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-xl">{testimonials[currentTestimonial].name}</h4>
                      <p className="text-neutral-600">{testimonials[currentTestimonial].role}</p>
                      <div className="flex gap-1 mt-2">
                        {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                          <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-lg text-neutral-700 leading-relaxed italic">
                    "{testimonials[currentTestimonial].content}"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`size-3 rounded-full transition-all ${idx === currentTestimonial ? 'bg-blue-600 w-8' : 'bg-neutral-300'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Cómo Funciona?</h2>
            <p className="text-neutral-600 text-xl">
              Agenda tu cita en 3 simples pasos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              { step: 1, title: 'Busca', desc: 'Encuentra profesionales cerca de ti', icon: Search },
              { step: 2, title: 'Agenda', desc: 'Selecciona fecha, hora y profesional', icon: Calendar },
              { step: 3, title: 'Disfruta', desc: 'Llega y recibe un servicio de calidad', icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center relative">
                  <div className="bg-black text-white size-24 rounded-3xl flex items-center justify-center text-4xl font-bold mx-auto mb-6 shadow-xl border-2 border-neutral-200">
                    {item.step}
                  </div>
                  <div className="bg-blue-50 size-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="size-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-2xl mb-3">{item.title}</h3>
                  <p className="text-neutral-600 text-lg">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Professionals CTA */}
      <section className="py-20 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2">
                  💼 Para Profesionales
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Haz crecer tu negocio con nosotros
                </h2>
                <p className="text-neutral-300 mb-8 text-lg leading-relaxed">
                  Únete a más de 1,200 profesionales que ya aumentaron sus ingresos con ServiConnect.
                  Sin comisiones el primer mes.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Sistema de agenda inteligente',
                    'Acceso a miles de clientes',
                    'Aumenta tus ingresos hasta 40%',
                    'Panel de control profesional',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="bg-green-500 size-6 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="size-4 text-white" />
                      </div>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-neutral-900 hover:bg-neutral-100 h-14 px-8 text-base"
                    onClick={() => navigate('/register')}
                  >
                    Comenzar Gratis
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-base"
                    onClick={() => navigate('/pricing')}
                  >
                    Ver Precios
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 space-y-6">
                  {[
                    { icon: TrendingUp, title: '+40% Ingresos', desc: 'Promedio de crecimiento', color: 'bg-green-500' },
                    { icon: Users, title: '1,200+ Negocios', desc: 'Ya confían en nosotros', color: 'bg-blue-500' },
                    { icon: Award, title: '4.8★ Calificación', desc: 'De nuestros usuarios', color: 'bg-yellow-500' },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
                        <div className={`${stat.color} size-14 rounded-xl flex items-center justify-center`}>
                          <Icon className="size-7 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{stat.title}</p>
                          <p className="text-sm text-neutral-400">{stat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-black text-white relative overflow-hidden border-t border-neutral-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            ¿Listo para tu siguiente cita?
          </h2>
          <p className="text-xl md:text-2xl text-neutral-400 mb-10 max-w-2xl mx-auto">
            Miles de profesionales esperan por ti. Comienza ahora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 h-16 px-10 text-lg font-semibold"
              onClick={() => navigate('/explore')}
            >
              Explorar Profesionales
              <ArrowRight className="ml-2 size-6" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-neutral-700 text-white hover:bg-neutral-900 h-16 px-10 text-lg font-semibold"
              onClick={() => navigate('/register')}
            >
              Registrar mi Negocio
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="size-6" />
                <span className="font-bold text-lg">ServiConnect</span>
              </div>
              <p className="text-neutral-400 text-sm">
                La plataforma líder de reservaciones para servicios de belleza en México.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link to="/explore" className="hover:text-white transition-colors">Explorar</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Precios</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
            <p>&copy; 2026 ServiConnect. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
