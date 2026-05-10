/**
 * IAnalyticsRepository - Interfaz para repositorio de analíticas
 * 
 * Define los contratos para obtener estadísticas agregadas de un negocio.
 * Usa DbClient para soportar transacciones.
 */

import { BusinessStats } from '../entities/BusinessStats';
import { PrismaClient, Prisma } from '@prisma/client';

// Tipo para soportar tanto cliente directo como transacciones
export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface GetBusinessStatsInput {
  businessId: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface IAnalyticsRepository {
  /**
   * Obtiene estadísticas agregadas de un negocio en un rango de fechas
   * 
   * @param input - { businessId, dateFrom, dateTo }
   * @param dbClient - Cliente Prisma (opcional, para transacciones)
   * @returns BusinessStats con KPIs agregados
   */
  getBusinessStats(
    input: GetBusinessStatsInput,
    dbClient?: DbClient
  ): Promise<BusinessStats>;
}
