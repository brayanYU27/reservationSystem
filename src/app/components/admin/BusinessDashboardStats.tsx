import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  DollarSign,
  CheckCircle2,
  Percent,
  Star,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  Scissors,
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBusiness } from '@/contexts/BusinessContext';
import { analyticsService, type BusinessStatsData } from '@/services/analytics.service';

// ============================================================
// Tipos de período de filtro
// ============================================================
type DatePreset = 'today' | 'last7' | 'thisMonth';

interface DateRange {
  from: Date;
  to: Date;
}

const DATE_PRESETS: { key: DatePreset; label: string; icon: React.ReactNode }[] = [
  { key: 'today',     label: 'Hoy',           icon: <CalendarDays className="size-3" /> },
  { key: 'last7',     label: 'Últimos 7 días', icon: <TrendingUp className="size-3" /> },
  { key: 'thisMonth', label: 'Este mes',       icon: <CalendarDays className="size-3" /> },
];

function getDateRange(preset: DatePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'last7':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

// ============================================================
// Skeleton de carga para cada tarjeta
// ============================================================
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-8 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tarjeta individual de KPI
// ============================================================
interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, icon, iconBg, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-green-200 bg-green-50/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600">{title}</CardTitle>
        <div className={`flex items-center justify-center size-9 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Componente principal
// ============================================================
export function BusinessDashboardStats() {
  const { business } = useBusiness();
  const isMountedRef = useRef(true);

  const [preset, setPreset] = useState<DatePreset>('thisMonth');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BusinessStatsData | null>(null);

  const loadStats = useCallback(async () => {
    if (!business?.id) return;

    if (isMountedRef.current) setLoading(true);

    const { from, to } = getDateRange(preset);

    // El interceptor de Axios maneja errores automáticamente con toast
    const res = await analyticsService.getBusinessStats(
      business.id,
      format(from, 'yyyy-MM-dd'),
      format(to, 'yyyy-MM-dd')
    );

    if (!isMountedRef.current) return;

    if (res.success && res.data) {
      setStats(res.data);
    }

    if (isMountedRef.current) setLoading(false);
  }, [business?.id, preset]);

  useEffect(() => {
    isMountedRef.current = true;
    loadStats();
    return () => { isMountedRef.current = false; };
  }, [loadStats]);

  // ============================================================
  // Rango de fechas para mostrar en el header
  // ============================================================
  const { from, to } = getDateRange(preset);
  const dateRangeLabel =
    preset === 'today'
      ? format(from, "d 'de' MMMM yyyy", { locale: es })
      : `${format(from, 'd MMM', { locale: es })} – ${format(to, 'd MMM yyyy', { locale: es })}`;

  // ============================================================
  // Valores calculados para mostrar
  // ============================================================
  const totalRevenueLabel = stats
    ? `$${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : '$0';

  const completionRateLabel = stats
    ? `${stats.metrics.completionRate}%`
    : '0%';

  const completedLabel = stats
    ? String(stats.completedAppointments)
    : '0';

  const topServiceLabel = stats?.topService
    ? stats.topService.serviceName
    : 'Sin datos';

  const topServiceSub = stats?.topService
    ? `${stats.topService.bookings} reservas · $${stats.topService.revenue.toLocaleString('es-MX')}`
    : 'No hay citas en el período';

  return (
    <div className="space-y-5">
      {/* Header con selector de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">KPIs del Negocio</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            {dateRangeLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de período */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-1 gap-1">
            {DATE_PRESETS.map(({ key, label, icon }) => (
              <Button
                key={key}
                size="sm"
                variant={preset === key ? 'default' : 'ghost'}
                className={`h-7 gap-1 text-xs px-2 ${preset === key ? 'shadow-sm' : ''}`}
                onClick={() => setPreset(key)}
              >
                {icon}
                {label}
              </Button>
            ))}
          </div>

          {/* Botón de recarga manual */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={loadStats}
            disabled={loading}
            title="Actualizar datos"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          // Skeletons durante la carga
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* 1. Ingresos Totales */}
            <StatCard
              title="Ingresos Totales"
              value={totalRevenueLabel}
              subtitle={`${stats?.completedAppointments ?? 0} citas completadas`}
              icon={<DollarSign className="size-4 text-green-700" />}
              iconBg="bg-green-100"
              highlight={!!stats?.totalRevenue}
            />

            {/* 2. Citas Completadas */}
            <StatCard
              title="Citas Completadas"
              value={completedLabel}
              subtitle={`de ${stats?.totalAppointments ?? 0} citas en total`}
              icon={<CheckCircle2 className="size-4 text-blue-700" />}
              iconBg="bg-blue-100"
            />

            {/* 3. Tasa de Finalización */}
            <StatCard
              title="Tasa de Finalización"
              value={completionRateLabel}
              subtitle={`${stats?.metrics.cancellationRate ?? 0}% canceladas`}
              icon={<Percent className="size-4 text-purple-700" />}
              iconBg="bg-purple-100"
            />

            {/* 4. Servicio Estrella */}
            <Card className={stats?.topService ? 'border-yellow-200 bg-yellow-50/40' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">
                  Servicio Estrella
                </CardTitle>
                <div className="flex items-center justify-center size-9 rounded-lg bg-yellow-100">
                  {stats?.topService
                    ? <Star className="size-4 text-yellow-700 fill-yellow-400" />
                    : <Scissors className="size-4 text-yellow-700" />
                  }
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight truncate" title={topServiceLabel}>
                  {topServiceLabel}
                </div>
                <p className="text-xs text-neutral-500 mt-1">{topServiceSub}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Desglose de estados (visible solo cuando hay datos) */}
      {!loading && stats && stats.appointmentsByStatus.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Desglose por Estado</CardTitle>
            <CardDescription className="text-xs">
              {stats.totalAppointments} citas en el período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.appointmentsByStatus.map(({ status, count }) => {
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
                const pct = stats.totalAppointments > 0
                  ? Math.round((count / stats.totalAppointments) * 100)
                  : 0;
                return (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cfg.className}`}
                  >
                    <span className={`size-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                    <span className="font-bold">{count}</span>
                    <span className="text-xs opacity-70">({pct}%)</span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Config de colores para badges de estado
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  PENDING:    { label: 'Pendientes',       className: 'bg-yellow-50 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  CONFIRMED:  { label: 'Confirmadas',      className: 'bg-blue-50 text-blue-800 border-blue-200',       dot: 'bg-blue-500' },
  COMPLETED:  { label: 'Completadas',      className: 'bg-green-50 text-green-800 border-green-200',    dot: 'bg-green-500' },
  CANCELLED:  { label: 'Canceladas',       className: 'bg-red-50 text-red-800 border-red-200',          dot: 'bg-red-500' },
  NO_SHOW:    { label: 'No se presentó',   className: 'bg-orange-50 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  IN_PROGRESS:{ label: 'En Progreso',      className: 'bg-purple-50 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  CHECKED_IN: { label: 'En Espera',        className: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
};
