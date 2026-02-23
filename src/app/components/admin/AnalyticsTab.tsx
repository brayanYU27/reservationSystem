import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Calendar,
  Star,
  Percent
} from 'lucide-react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { analyticsService } from '../../../services';
import { toast } from 'sonner';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    byPeriod: { label: string; amount: number }[];
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  clients: {
    total: number;
    new: number;
    returning: number;
  };
  topServices: {
    name: string;
    count: number;
    revenue: number;
  }[];
  topEmployees: {
    name: string;
    appointments: number;
    rating: number;
  }[];
}

export function AnalyticsTab() {
  const { business } = useBusiness();
  const isMountedRef = useRef(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    if (business?.id) {
      loadAnalytics();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [business?.id, period]);

  const loadAnalytics = async () => {
    if (!business?.id) return;

    try {
      if (isMountedRef.current) setLoading(true);

      // Cargar datos en paralelo
      const [summaryRes, revenueRes, servicesRes, employeesRes] = await Promise.all([
        analyticsService.getSummary(business.id, period),
        analyticsService.getRevenueReport(business.id, period),
        analyticsService.getTopServices(business.id, period),
        analyticsService.getTopEmployees(business.id, period),
      ]);
      
      if (!isMountedRef.current) return;

      if (summaryRes.success && revenueRes.success && servicesRes.success && employeesRes.success) {
        if (isMountedRef.current) {
          setData({
            revenue: {
              total: summaryRes.data.revenue.total,
              growth: summaryRes.data.revenue.growth,
              byPeriod: revenueRes.data.dataPoints,
            },
            appointments: summaryRes.data.appointments,
            clients: summaryRes.data.clients,
            topServices: servicesRes.data,
            topEmployees: employeesRes.data,
          });
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      if (isMountedRef.current) toast.error('Error al cargar analytics');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Análisis y Reportes</h3>
          <p className="text-neutral-600">Métricas detalladas de tu negocio</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            Semana
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Mes
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('year')}
          >
            Año
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.revenue.total.toLocaleString()}
            </div>
            {data.revenue.growth !== 0 && (
              <div className={`flex items-center text-xs mt-1 ${data.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.revenue.growth > 0 ? (
                  <TrendingUp className="size-3 mr-1" />
                ) : (
                  <TrendingDown className="size-3 mr-1" />
                )}
                {data.revenue.growth > 0 ? '+' : ''}{data.revenue.growth}% vs periodo anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Citas
            </CardTitle>
            <Calendar className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.appointments.total}
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              {data.appointments.completed} completadas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <Users className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.clients.total}
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              {data.clients.new} nuevos este período
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
            <CardDescription>
              {period === 'week' && 'Últimos 7 días'}
              {period === 'month' && 'Últimas 4 semanas'}
              {period === 'year' && 'Últimos 12 meses'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.revenue.byPeriod.map((item, index) => {
                const maxAmount = Math.max(...data.revenue.byPeriod.map(m => m.amount));
                const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm text-neutral-600">
                        ${item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Citas</CardTitle>
            <CardDescription>Distribución del periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-green-600" />
                  <span className="text-sm">Completadas</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{data.appointments.completed}</p>
                  <p className="text-xs text-neutral-600">
                    {data.appointments.total > 0 
                      ? ((data.appointments.completed / data.appointments.total) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-red-600" />
                  <span className="text-sm">Canceladas</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{data.appointments.cancelled}</p>
                  <p className="text-xs text-neutral-600">
                    {data.appointments.total > 0 
                      ? ((data.appointments.cancelled / data.appointments.total) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-orange-600" />
                  <span className="text-sm">No Show</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{data.appointments.noShow}</p>
                  <p className="text-xs text-neutral-600">
                    {data.appointments.total > 0 
                      ? ((data.appointments.noShow / data.appointments.total) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Más Populares</CardTitle>
          <CardDescription>Ranking por cantidad de reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topServices.length > 0 ? (
              data.topServices.map((service, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-neutral-600">{service.count} reservas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${service.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-neutral-600">No hay datos disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados Destacados</CardTitle>
          <CardDescription>Ranking por número de citas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topEmployees.length > 0 ? (
              data.topEmployees.map((employee, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-neutral-600">
                      {employee.appointments} citas
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="size-4 fill-current" />
                    <span className="font-semibold">{employee.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-neutral-600">No hay datos disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

