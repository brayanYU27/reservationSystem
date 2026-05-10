/**
 * GetBusinessStatsUseCase - Caso de uso para obtener estadísticas de un negocio
 * 
 * Responsabilidades:
 * - Validar que el businessId existe
 * - Validar rango de fechas
 * - Llamar al repositorio con filtros de multi-tenant
 * - Retornar entidad BusinessStats
 */

import { IAnalyticsRepository } from '../domain/IAnalyticsRepository.js';
import { BusinessStats } from '../domain/entities/BusinessStats.js';
import { ResourceNotFoundError, ValidationError } from '../domain/errors/AppError.js';
import { PrismaClient } from '@prisma/client';

export interface GetBusinessStatsInput {
  businessId: string;
  dateFrom: Date;
  dateTo: Date;
}

export class GetBusinessStatsUseCase {
  constructor(
    private analyticsRepository: IAnalyticsRepository,
    private prismaClient: PrismaClient
  ) {}

  async execute(input: GetBusinessStatsInput): Promise<BusinessStats> {
    const { businessId, dateFrom, dateTo } = input;

    // ============================================
    // 1. Validar businessId
    // ============================================
    if (!businessId || businessId.trim() === '') {
      throw new ValidationError('businessId es requerido', {
        field: 'businessId'
      });
    }

    // ============================================
    // 2. Verificar que el negocio existe
    // ============================================
    const business = await this.prismaClient.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    });

    if (!business) {
      throw new ResourceNotFoundError('Negocio no encontrado', {
        businessId
      });
    }

    // ============================================
    // 3. Validar rango de fechas
    // ============================================
    if (!dateFrom || !dateTo) {
      throw new ValidationError('dateFrom y dateTo son requeridos', {
        fields: ['dateFrom', 'dateTo']
      });
    }

    // Convertir a Date si son strings
    const fromDate = typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom;
    const toDate = typeof dateTo === 'string' ? new Date(dateTo) : dateTo;

    if (isNaN(fromDate.getTime())) {
      throw new ValidationError('dateFrom debe ser una fecha válida', {
        field: 'dateFrom',
        value: dateFrom
      });
    }

    if (isNaN(toDate.getTime())) {
      throw new ValidationError('dateTo debe ser una fecha válida', {
        field: 'dateTo',
        value: dateTo
      });
    }

    if (fromDate > toDate) {
      throw new ValidationError('dateFrom no puede ser mayor que dateTo', {
        dateFrom: fromDate,
        dateTo: toDate
      });
    }

    // ============================================
    // 4. Obtener estadísticas del repositorio
    // ============================================
    const stats = await this.analyticsRepository.getBusinessStats({
      businessId,
      dateFrom: fromDate,
      dateTo: toDate
    });

    return stats;
  }
}
