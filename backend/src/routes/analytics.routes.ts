/**
 * analytics.routes.ts - Rutas para el módulo de analíticas (Clean Architecture)
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getBusinessStats, getAppointmentsSummary } from '../controllers/analytics.controller.js';

const router = Router();

/**
 * GET /api/analytics/business/:businessId/stats
 * 
 * Obtiene KPIs agregados de un negocio en un rango de fechas.
 * 
 * @requires auth - Token JWT válido
 * @param businessId - ID del negocio (multi-tenant)
 * @query dateFrom  - Fecha inicio YYYY-MM-DD
 * @query dateTo    - Fecha fin   YYYY-MM-DD
 */
router.get('/business/:businessId/stats', authenticate, getBusinessStats);

/**
 * GET /api/analytics/appointments/summary
 * 
 * Obtiene KPIs de citas filtradas por fecha, empleado y estado (reutilizable)
 * 
 * @requires auth - Token JWT válido
 * @query businessId - ID del negocio
 * @query dateFrom   - Fecha inicio YYYY-MM-DD
 * @query dateTo     - Fecha fin YYYY-MM-DD
 * @query employeeId - ID del empleado (opcional)
 */
router.get('/appointments/summary', authenticate, getAppointmentsSummary);

export default router;
