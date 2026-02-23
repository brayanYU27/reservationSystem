import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
    Check,
    X,
    TrendingUp,
    Users,
    Calendar,
    BarChart3,
    Sparkles,
    Crown,
    Rocket,
    Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PricingPage() {
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(false);

    const plans = [
        {
            name: 'Gratis',
            description: 'Perfecto para empezar',
            icon: Sparkles,
            price: { monthly: 0, annual: 0 },
            popular: false,
            features: [
                { name: 'Hasta 30 citas/mes', included: true },
                { name: '1 servicio activo', included: true },
                { name: 'Perfil público básico', included: true },
                { name: 'Galería de fotos (5 imágenes)', included: true },
                { name: 'Calendario de disponibilidad', included: true },
                { name: 'Notificaciones por email', included: true },
                { name: 'Gestión de horarios', included: true },
                { name: 'Múltiples servicios', included: false },
                { name: 'Múltiples empleados', included: false },
                { name: 'Estadísticas avanzadas', included: false },
                { name: 'Perfil destacado', included: false },
                { name: 'Soporte prioritario', included: false },
            ],
            cta: 'Comenzar Gratis',
            highlight: false,
        },
        {
            name: 'Profesional',
            description: 'Para negocios en crecimiento',
            icon: Crown,
            price: { monthly: 299, annual: 2990 },
            popular: true,
            features: [
                { name: 'Citas ilimitadas', included: true },
                { name: 'Servicios ilimitados', included: true },
                { name: 'Hasta 5 empleados', included: true },
                { name: 'Galería ilimitada', included: true },
                { name: 'Perfil destacado en búsquedas', included: true },
                { name: 'Estadísticas completas', included: true },
                { name: 'Gestión de staff completa', included: true },
                { name: 'Horarios personalizados', included: true },
                { name: 'Notificaciones email + SMS', included: true },
                { name: 'Reseñas y calificaciones', included: true },
                { name: 'Soporte prioritario', included: true },
                { name: 'Múltiples sucursales', included: false },
            ],
            cta: 'Comenzar Prueba Gratis',
            highlight: true,
        },
        {
            name: 'Enterprise',
            description: 'Para cadenas y franquicias',
            icon: Rocket,
            price: { monthly: 999, annual: 9990 },
            popular: false,
            features: [
                { name: 'Todo ilimitado', included: true },
                { name: 'Empleados ilimitados', included: true },
                { name: 'Múltiples sucursales', included: true },
                { name: 'Panel centralizado', included: true },
                { name: 'Perfil premium destacado', included: true },
                { name: 'Analytics empresarial', included: true },
                { name: 'Gestión multi-ubicación', included: true },
                { name: 'API personalizada', included: true },
                { name: 'Integración WhatsApp Business', included: true },
                { name: 'Soporte 24/7 dedicado', included: true },
                { name: 'Capacitación personalizada', included: true },
                { name: 'Gerente de cuenta dedicado', included: true },
            ],
            cta: 'Contactar Ventas',
            highlight: false,
        },
    ];

    const benefits = [
        {
            icon: TrendingUp,
            title: 'Aumenta tus Ingresos',
            description: 'Negocios reportan +40% más reservaciones en el primer mes',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            icon: Users,
            title: 'Más Clientes',
            description: 'Acceso a miles de clientes activos buscando servicios',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            icon: Calendar,
            title: 'Gestión Automática',
            description: 'Ahorra 10+ horas semanales con automatización inteligente',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            icon: BarChart3,
            title: 'Insights en Tiempo Real',
            description: 'Toma decisiones basadas en datos de tu negocio',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    const clientBenefits = [
        'Reserva en segundos desde cualquier dispositivo',
        'Recordatorios automáticos para no olvidar citas',
        'Historial completo de servicios y pagos',
        'Reseñas verificadas de otros clientes',
        'Cancelación y reprogramación fácil',
        'Ofertas y promociones exclusivas',
    ];

    const getPrice = (plan: typeof plans[0]) => {
        if (plan.price.monthly === 0) return 'Gratis';
        const price = isAnnual ? plan.price.annual / 12 : plan.price.monthly;
        return `$${price.toLocaleString('es-MX')}`;
    };

    const getSavings = (plan: typeof plans[0]) => {
        if (plan.price.monthly === 0) return null;
        const monthlyCost = plan.price.monthly * 12;
        const annualCost = plan.price.annual;
        const savings = monthlyCost - annualCost;
        const percentage = Math.round((savings / monthlyCost) * 100);
        return { amount: savings, percentage };
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
            {/* Header */}
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-6 bg-white/10 text-white border-white/20 px-4 py-1">
                        💎 Planes y Precios
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Elige el plan perfecto para tu negocio
                    </h1>
                    <p className="text-xl text-neutral-300 max-w-2xl mx-auto mb-8">
                        Sin contratos. Sin sorpresas. Cancela cuando quieras.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Label htmlFor="billing-toggle" className={`text-lg ${!isAnnual ? 'text-white font-semibold' : 'text-neutral-400'}`}>
                            Mensual
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                            className="data-[state=checked]:bg-green-500"
                        />
                        <Label htmlFor="billing-toggle" className={`text-lg ${isAnnual ? 'text-white font-semibold' : 'text-neutral-400'}`}>
                            Anual
                        </Label>
                        {isAnnual && (
                            <Badge className="bg-green-500 text-white">
                                Ahorra hasta 17%
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="container mx-auto px-4 -mt-16 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const savings = getSavings(plan);

                        return (
                            <Card
                                key={plan.name}
                                className={`relative overflow-hidden transition-all hover:shadow-2xl ${plan.highlight
                                    ? 'border-2 border-blue-500 shadow-xl scale-105'
                                    : 'hover:scale-105'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold">
                                        ⭐ Más Popular
                                    </div>
                                )}

                                <CardHeader className="text-center pb-8 pt-8">
                                    <div className={`size-16 mx-auto mb-4 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-neutral-100'
                                        }`}>
                                        <Icon className={`size-8 ${plan.highlight ? 'text-white' : 'text-neutral-600'}`} />
                                    </div>
                                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                                    <CardDescription className="text-base">{plan.description}</CardDescription>

                                    <div className="mt-6">
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-5xl font-bold">{getPrice(plan)}</span>
                                            {plan.price.monthly > 0 && (
                                                <span className="text-neutral-500">/mes</span>
                                            )}
                                        </div>
                                        {isAnnual && savings && (
                                            <p className="text-sm text-green-600 font-semibold mt-2">
                                                Ahorras ${savings.amount.toLocaleString('es-MX')} MXN al año
                                            </p>
                                        )}
                                        {!isAnnual && plan.price.monthly > 0 && (
                                            <p className="text-sm text-neutral-500 mt-2">
                                                o ${plan.price.annual.toLocaleString('es-MX')} MXN/año
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <Button
                                        className={`w-full h-12 text-base ${plan.highlight
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                                            : ''
                                            }`}
                                        variant={plan.highlight ? 'default' : 'outline'}
                                        onClick={() => navigate('/register')}
                                    >
                                        {plan.cta}
                                    </Button>

                                    <div className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                {feature.included ? (
                                                    <Check className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <X className="size-5 text-neutral-300 flex-shrink-0 mt-0.5" />
                                                )}
                                                <span className={feature.included ? 'text-neutral-700' : 'text-neutral-400'}>
                                                    {feature.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Benefits for Business */}
            <div className="bg-neutral-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            ¿Por qué elegir ServiConnect?
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Beneficios comprobados para tu negocio
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {benefits.map((benefit, idx) => {
                            const Icon = benefit.icon;
                            return (
                                <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-8">
                                        <div className={`${benefit.bgColor} size-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                                            <Icon className={`size-8 ${benefit.color}`} />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                                        <p className="text-neutral-600 text-sm">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Benefits for Clients */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Beneficios para tus Clientes
                            </h2>
                            <p className="text-xl text-neutral-600">
                                Una experiencia que tus clientes amarán
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clientBenefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg hover:bg-neutral-50 transition-colors">
                                    <div className="bg-blue-100 size-10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Star className="size-5 text-blue-600" />
                                    </div>
                                    <p className="text-neutral-700 pt-1">{benefit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-neutral-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                            Preguntas Frecuentes
                        </h2>

                        <div className="space-y-6">
                            {[
                                {
                                    q: '¿Puedo cambiar de plan en cualquier momento?',
                                    a: 'Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se reflejan inmediatamente.',
                                },
                                {
                                    q: '¿Hay período de prueba?',
                                    a: 'Sí, todos los planes de pago incluyen 14 días de prueba gratis. No se requiere tarjeta de crédito.',
                                },
                                {
                                    q: '¿Qué métodos de pago aceptan?',
                                    a: 'Aceptamos todas las tarjetas de crédito/débito, transferencias bancarias y pagos en OXXO.',
                                },
                                {
                                    q: '¿Puedo cancelar mi suscripción?',
                                    a: 'Sí, puedes cancelar en cualquier momento. No hay penalizaciones ni cargos ocultos.',
                                },
                                {
                                    q: '¿Ofrecen soporte técnico?',
                                    a: 'Sí, todos los planes incluyen soporte. Los planes Pro y Enterprise tienen soporte prioritario.',
                                },
                            ].map((faq, idx) => (
                                <Card key={idx}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{faq.q}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-neutral-600">{faq.a}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        ¿Listo para hacer crecer tu negocio?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                        Únete a más de 1,200 profesionales que ya confían en ServiConnect
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="text-lg px-8 h-14"
                            onClick={() => navigate('/register')}
                        >
                            Comenzar Gratis
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 h-14 bg-transparent text-white border-white hover:bg-white/10"
                            onClick={() => navigate('/explore')}
                        >
                            Ver Demo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
