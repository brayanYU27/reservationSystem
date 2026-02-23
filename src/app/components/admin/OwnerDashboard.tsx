import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { businessService } from '@/services/business.service';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Business, Appointment } from '@/types';

interface DashboardSummary {
  today: {
    appointments: number;
    revenue: number;
    newClients: number;
  };
  thisWeek: {
    appointments: number;
    revenue: number;
    averageRating: number;
  };
  thisMonth: {
    appointments: number;
    revenue: number;
    growth: number;
  };
}

interface OwnerDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!isMounted) return;

    try {
      setLoading(true);

      // Cargar negocio
      const businessResponse = await businessService.getMy();
      if (!businessResponse.success || !businessResponse.data) {
        throw new Error('No se pudo cargar la información del negocio');
      }

      const businessData = businessResponse.data;
      if (isMounted) {
        setBusiness(businessData);
      }

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Cargar datos en paralelo
      const [todayAppointmentsRes, weekStatsRes, monthStatsRes] = await Promise.all([
        // 1. Citas de hoy
        businessService.getAppointments(businessData.id, {
          dateFrom: todayStr,
          dateTo: todayStr
        }),
        // 2. Stats semana
        analyticsService.getSummary(businessData.id, 'week'),
        // 3. Stats mes
        analyticsService.getSummary(businessData.id, 'month')
      ]);

      if (isMounted) {
        // Calcular ingresos de hoy (sumar precio de citas confirmadas/completadas)
        const todayAppointments = todayAppointmentsRes.data || [];
        const todayRevenue = todayAppointments
          .filter(apt => apt.status === 'CONFIRMED' || apt.status === 'COMPLETED')
          .reduce((sum, apt) => sum + apt.price, 0);

        // Safely access data or default to 0
        const weekData = weekStatsRes.data;
        const monthData = monthStatsRes.data;

        setSummary({
          today: {
            appointments: todayAppointments.length,
            revenue: todayRevenue,
            newClients: weekData?.clients.new || 0, // Approx
          },
          thisWeek: {
            appointments: weekData?.appointments.total || 0,
            revenue: weekData?.revenue.total || 0,
            averageRating: 4.8, // Mock
          },
          thisMonth: {
            appointments: monthData?.appointments.total || 0,
            revenue: monthData?.revenue.total || 0,
            growth: monthData?.revenue.growth || 0,
          },
        });
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    setIsMounted(true);
    loadDashboardData();

    return () => {
      setIsMounted(false);
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con bienvenida */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Bienvenido, {user?.firstName}! 👋</h2>
          <p className="text-neutral-600 mt-1">
            Aquí está el resumen de {business?.name || 'tu negocio'}
          </p>
        </div>
        <div className="text-right text-sm text-neutral-600">
          <p>{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
          <p className="text-lg font-semibold text-neutral-900">
            {format(new Date(), 'HH:mm')}
          </p>
        </div>
      </div>

      {/* Stats Cards - Hoy */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Hoy</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            onClick={() => onNavigate?.('appointments')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-blue-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Citas de Hoy
              </CardTitle>
              <Calendar className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.today?.appointments || 0}</div>
              <p className="text-xs text-neutral-600">
                Programadas para hoy
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => onNavigate?.('analytics')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-green-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos de Hoy
              </CardTitle>
              <DollarSign className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(summary?.today?.revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-neutral-600">
                MXN
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => onNavigate?.('appointments')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-purple-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Nuevos Clientes
              </CardTitle>
              <Users className="size-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.today?.newClients || 0}</div>
              <p className="text-xs text-neutral-600">
                Primera visita hoy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards - Esta Semana */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Esta Semana</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card
            onClick={() => onNavigate?.('appointments')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-blue-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Citas
              </CardTitle>
              <CheckCircle2 className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.thisWeek?.appointments || 0}</div>
              <p className="text-xs text-neutral-600">
                Esta semana
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => onNavigate?.('analytics')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-green-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Semana
              </CardTitle>
              <TrendingUp className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(summary?.thisWeek?.revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-neutral-600">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => onNavigate?.('analytics')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-yellow-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Calificación
              </CardTitle>
              <Star className="size-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(summary?.thisWeek?.averageRating || 0).toFixed(1)}
              </div>
              <p className="text-xs text-neutral-600">
                Promedio semanal
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => onNavigate?.('analytics')}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-green-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crecimiento
              </CardTitle>
              {(summary?.thisMonth?.growth || 0) >= 0 ? (
                <ArrowUp className="size-4 text-green-600" />
              ) : (
                <ArrowDown className="size-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(summary?.thisMonth?.growth || 0) >= 0 ? '+' : ''}
                {summary?.thisMonth?.growth || 0}%
              </div>
              <p className="text-xs text-neutral-600">
                vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats del Negocio */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => onNavigate?.('staff')}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              Tu Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {business?._count?.employees || 0}
            </div>
            <p className="text-sm text-blue-600">
              Profesionales activos
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
          onClick={() => onNavigate?.('services')}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-5 text-purple-600" />
              Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {business?._count?.services || 0}
            </div>
            <p className="text-sm text-purple-600">
              Servicios ofrecidos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:shadow-lg transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="size-5 text-green-600" />
              Calificación General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {business?.rating.toFixed(1) || '0.0'} ⭐
            </div>
            <p className="text-sm text-green-600">
              {business?.totalReviews || 0} reseñas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestiona tu negocio rápidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => onNavigate?.('reception')}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-neutral-50 hover:border-blue-300 hover:shadow-md transition-all text-left"
            >
              <Calendar className="size-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Nueva Cita</p>
                <p className="text-xs text-neutral-600">Agendar cliente</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('staff')}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-neutral-50 hover:border-purple-300 hover:shadow-md transition-all text-left"
            >
              <Users className="size-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Gestionar Equipo</p>
                <p className="text-xs text-neutral-600">Ver empleados</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('schedule')}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-neutral-50 hover:border-green-300 hover:shadow-md transition-all text-left"
            >
              <Clock className="size-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Horarios</p>
                <p className="text-xs text-neutral-600">Configurar</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('analytics')}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-neutral-50 hover:border-orange-300 hover:shadow-md transition-all text-left"
            >
              <TrendingUp className="size-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">Reportes</p>
                <p className="text-xs text-neutral-600">Ver analytics</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
