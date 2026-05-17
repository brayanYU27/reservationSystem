import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener resumen de analytics del dashboard
 */
export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = id as string;
    const { period = 'month' } = req.query as { period?: 'week' | 'month' | 'year' };

    // Calcular fechas según el período
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // year
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Ingresos totales del período
    const revenueData = await prisma.appointment.aggregate({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      _sum: {
        price: true,
      },
    });

    // Total de citas del período
    const totalAppointments = await prisma.appointment.count({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Citas completadas
    const completedAppointments = await prisma.appointment.count({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
    });

    // Citas canceladas
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CANCELLED',
      },
    });

    // Citas no show
    const noShowAppointments = await prisma.appointment.count({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'NO_SHOW',
      },
    });

    // Total de clientes únicos
    const uniqueClients = await prisma.appointment.findMany({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        clientId: true,
      },
      distinct: ['clientId'],
    });

    // Clientes nuevos (primera cita en este período)
    const newClients = await prisma.appointment.groupBy({
      by: ['clientId'],
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _min: {
        date: true,
      },
    });

    const newClientsCount = newClients.filter(client => {
      return client._min?.date && client._min.date >= startDate;
    }).length;

    res.json({
      success: true,
      data: {
        revenue: {
          total: revenueData._sum?.price || 0,
          growth: 0, // TODO: Calcular vs período anterior
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
        },
        clients: {
          total: uniqueClients.length,
          new: newClientsCount,
          returning: uniqueClients.length - newClientsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener reporte de ingresos por período
 */
export const getRevenueReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = id as string;
    const { period = 'month' } = req.query as { period?: 'week' | 'month' | 'year' };

    const now = new Date();
    let dataPoints: { label: string; amount: number }[] = [];

    if (period === 'week') {
      // Últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const revenue = await prisma.appointment.aggregate({
          where: {
            businessId: businessId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: 'COMPLETED',
          },
          _sum: {
            price: true,
          },
        });

        dataPoints.push({
          label: startOfDay.toLocaleDateString('es-ES', { weekday: 'short' }),
          amount: revenue._sum?.price || 0,
        });
      }
    } else if (period === 'month') {
      // Últimas 4 semanas
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);

        const revenue = await prisma.appointment.aggregate({
          where: {
            businessId: businessId,
            date: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
          _sum: {
            price: true,
          },
        });

        dataPoints.push({
          label: `Sem ${4 - i}`,
          amount: revenue._sum?.price || 0,
        });
      }
    } else {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const revenue = await prisma.appointment.aggregate({
          where: {
            businessId: businessId,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            status: 'COMPLETED',
          },
          _sum: {
            price: true,
          },
        });

        dataPoints.push({
          label: date.toLocaleDateString('es-ES', { month: 'short' }),
          amount: revenue._sum?.price || 0,
        });
      }
    }

    res.json({
      success: true,
      data: {
        period,
        dataPoints,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener servicios más populares
 */
export const getTopServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = id as string;
    const { period = 'month', limit = '5' } = req.query as { period?: 'week' | 'month' | 'year'; limit?: string };

    // Calcular fechas según el período
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Obtener servicios con conteo y revenue
    const servicesData = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      _count: {
        _all: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
      take: parseInt(limit),
    });

    // Obtener nombres de servicios
    const serviceIds = servicesData.map(s => s.serviceId);
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const serviceMap = new Map(services.map(s => [s.id, s.name]));

    const topServices = servicesData.map(s => ({
      name: serviceMap.get(s.serviceId) || 'Servicio desconocido',
      count: s._count?._all || 0,
      revenue: s._sum?.price || 0,
    }));

    res.json({
      success: true,
      data: topServices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener empleados más destacados
 */
export const getTopEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = id as string;
    const { period = 'month', limit = '5' } = req.query as { period?: 'week' | 'month' | 'year'; limit?: string };

    // Calcular fechas según el período
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Obtener empleados con conteo de citas
    const employeesData = await prisma.appointment.groupBy({
      by: ['employeeId'],
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
        employeeId: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          employeeId: 'desc',
        },
      },
      take: parseInt(limit),
    });

    // Obtener datos de empleados con ratings
    const employeeIds = employeesData
      .map(e => e.employeeId)
      .filter((id): id is string => id !== null);
      
    const employees = await prisma.user.findMany({
      where: {
        id: {
          in: employeeIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Obtener ratings de reviews del negocio (no por empleado individual)
    const reviews = await prisma.review.groupBy({
      by: ['businessId'],
      where: {
        businessId: businessId,
      },
      _avg: {
        rating: true,
      },
    });

    const employeeMap = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    const avgRating = reviews[0]?._avg?.rating || 4.5; // Rating promedio del negocio

    const topEmployees = employeesData
      .filter(e => e.employeeId !== null)
      .map(e => ({
        name: employeeMap.get(e.employeeId!) || 'Empleado desconocido',
        appointments: e._count?._all || 0,
        rating: avgRating, // Usar el rating promedio del negocio
      }));

    res.json({
      success: true,
      data: topEmployees,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Clean Architecture: GetBusinessStatsUseCase
// ============================================================
import { container } from '../infrastructure/container.js';

/**
 * GET /api/analytics/business/:businessId/stats
 * 
 * Obtiene KPIs agregados de un negocio (Camino B / Clean Architecture)
 * 
 * Query params:
 *   - dateFrom: string (YYYY-MM-DD)
 *   - dateTo:   string (YYYY-MM-DD)
 */
export const getBusinessStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const businessId = req.params.businessId as string;
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los parámetros dateFrom y dateTo son requeridos',
          details: { required: ['dateFrom', 'dateTo'] }
        }
      });
      return;
    }

    const fromDate = new Date(String(dateFrom));
    const toDate = new Date(String(dateTo));
    toDate.setHours(23, 59, 59, 999); // Fin del día

    const stats = await container.useCases.getBusinessStatsUseCase.execute({
      businessId,
      dateFrom: fromDate,
      dateTo: toDate
    });

    res.json({
      success: true,
      data: stats.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/appointments/summary
 * 
 * Obtiene KPIs de citas filtradas por fecha y empleado (reutilizable en componentes)
 * 
 * @requires auth - Token JWT válido
 * @query businessId - ID del negocio
 * @query dateFrom   - Fecha inicio YYYY-MM-DD
 * @query dateTo     - Fecha fin YYYY-MM-DD
 * @query employeeId - ID del empleado (opcional)
 */
export const getAppointmentsSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { businessId, dateFrom, dateTo, employeeId } = req.query as {
      businessId?: string;
      dateFrom?: string;
      dateTo?: string;
      employeeId?: string;
    };

    if (!businessId || !dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: 'businessId, dateFrom, dateTo son requeridos'
      });
      return;
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);

    // Base where clause
    const whereClause: any = {
      businessId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Agregar filtro de empleado si se proporciona
    if (employeeId) {
      // Soportar tanto Employee.id como User.id
      const employee = await prisma.employee.findFirst({
        where: { OR: [{ id: employeeId }, { userId: employeeId }] },
        select: { id: true }
      });
      
      if (employee) {
        whereClause.employeeId = employee.id;
      } else {
        whereClause.employeeId = '__NO_MATCH__';
      }
    }

    // Obtener todas las citas para análisis detallado
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        price: true,
        date: true,
      },
    });

    // Calcular KPIs
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const upcomingAppointments = appointments.filter(a => {
      return new Date(a.date) > new Date() && a.status !== 'CANCELLED';
    }).length;
    const revenue = appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (a.price || 0), 0);

    res.json({
      success: true,
      data: {
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        revenue,
      },
    });
  } catch (error) {
    next(error);
  }
};
