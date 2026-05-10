import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

// ============================================================
// Tipos para el módulo de analíticas (Clean Architecture)
// ============================================================
export interface AppointmentStatusCount {
  status: string;
  count: number;
}

export interface TopServiceStats {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

export interface BusinessStatsMetrics {
  completionRate: number;
  cancellationRate: number;
  averageRevenuePerCompletedAppointment: number;
}

export interface BusinessStatsData {
  businessId: string;
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  appointmentsByStatus: AppointmentStatusCount[];
  topService: TopServiceStats | null;
  generatedAt: string;
  metrics: BusinessStatsMetrics;
}

interface AnalyticsSummary {
  revenue: {
    total: number;
    growth: number;
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
}

interface RevenueReport {
  period: 'week' | 'month' | 'year';
  dataPoints: {
    label: string;
    amount: number;
  }[];
}

interface TopService {
  name: string;
  count: number;
  revenue: number;
}

interface TopEmployee {
  name: string;
  appointments: number;
  rating: number;
}

export const analyticsService = {
  // Obtener resumen de analytics
  async getSummary(
    businessId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<AnalyticsSummary>> {
    return apiClient.get<AnalyticsSummary>(
      `/businesses/${businessId}/analytics/summary?period=${period}`
    );
  },

  // Obtener reporte de ingresos
  async getRevenueReport(
    businessId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<RevenueReport>> {
    return apiClient.get<RevenueReport>(
      `/businesses/${businessId}/analytics/revenue?period=${period}`
    );
  },

  // Obtener servicios más populares
  async getTopServices(
    businessId: string,
    period: 'week' | 'month' | 'year' = 'month',
    limit: number = 5
  ): Promise<ApiResponse<TopService[]>> {
    return apiClient.get<TopService[]>(
      `/businesses/${businessId}/analytics/top-services?period=${period}&limit=${limit}`
    );
  },

  // Obtener empleados destacados
  async getTopEmployees(
    businessId: string,
    period: 'week' | 'month' | 'year' = 'month',
    limit: number = 5
  ): Promise<ApiResponse<TopEmployee[]>> {
    return apiClient.get<TopEmployee[]>(
      `/businesses/${businessId}/analytics/top-employees?period=${period}&limit=${limit}`
    );
  },

  // ✅ Clean Architecture: GetBusinessStatsUseCase
  async getBusinessStats(
    businessId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<ApiResponse<BusinessStatsData>> {
    return apiClient.get<BusinessStatsData>(
      `/analytics/business/${businessId}/stats?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
  },
};

