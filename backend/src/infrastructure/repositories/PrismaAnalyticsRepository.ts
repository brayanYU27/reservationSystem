/**
 * PrismaAnalyticsRepository - Implementación Prisma de IAnalyticsRepository
 * 
 * Usa agregaciones eficientes de Prisma (_sum, _count, groupBy)
 * para calcular KPIs sin cargar todos los registros en memoria.
 */

import { IAnalyticsRepository, GetBusinessStatsInput, DbClient } from '../../core/domain/IAnalyticsRepository.js';
import { BusinessStats, AppointmentStatusCount, TopService } from '../../core/domain/entities/BusinessStats.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  async getBusinessStats(
    input: GetBusinessStatsInput,
    dbClient?: DbClient
  ): Promise<BusinessStats> {
    // Usar el cliente proporcionado o el singleton de Prisma
    const db = dbClient ?? prisma;

    const { businessId, dateFrom, dateTo } = input;

    // ============================================
    // 1. Ingresos totales por estado COMPLETED
    // ============================================
    const revenueResult = await (db as any).appointment.aggregate({
      where: {
        businessId,
        date: {
          gte: dateFrom,
          lte: dateTo
        },
        status: 'COMPLETED'
      },
      _sum: {
        price: true
      }
    });

    const totalRevenue = revenueResult._sum.price ?? 0;

    // ============================================
    // 2. Total de citas y desglose por estado
    // ============================================
    const appointmentsByStatusResult = await (db as any).appointment.groupBy({
      by: ['status'],
      where: {
        businessId,
        date: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      _count: {
        id: true
      }
    });

    // Mapear a formato esperado y contar totales
    const appointmentsByStatus: AppointmentStatusCount[] = appointmentsByStatusResult.map((result: any) => ({
      status: result.status,
      count: result._count.id
    }));

    const totalAppointments = appointmentsByStatus.reduce((sum, item) => sum + item.count, 0);
    const completedAppointments = appointmentsByStatus.find(item => item.status === 'COMPLETED')?.count ?? 0;
    const cancelledAppointments = appointmentsByStatus.find(item => item.status === 'CANCELLED')?.count ?? 0;

    // ============================================
    // 3. Servicio más popular (por número de reservas)
    // ============================================
    const topServiceResult = await (db as any).appointment.groupBy({
      by: ['serviceId'],
      where: {
        businessId,
        date: {
          gte: dateFrom,
          lte: dateTo
        },
        status: { // Solo contar citas completadas para servicio más popular
          in: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS', 'CHECKED_IN']
        }
      },
      _count: {
        id: true
      },
      _sum: {
        price: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 1 // Solo el top 1
    });

    let topService: TopService | null = null;

    if (topServiceResult.length > 0) {
      const topServiceData = topServiceResult[0];
      
      // Obtener el nombre del servicio
      const service = await (db as any).service.findUnique({
        where: { id: topServiceData.serviceId },
        select: { name: true }
      });

      if (service) {
        topService = {
          serviceId: topServiceData.serviceId,
          serviceName: service.name,
          bookings: topServiceData._count.id,
          revenue: topServiceData._sum.price ?? 0
        };
      }
    }

    // ============================================
    // Crear y retornar entidad BusinessStats
    // ============================================
    return new BusinessStats({
      businessId,
      dateFrom,
      dateTo,
      totalRevenue,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      appointmentsByStatus,
      topService,
      generatedAt: new Date()
    });
  }
}
