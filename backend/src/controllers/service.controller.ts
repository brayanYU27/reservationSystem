import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createServiceSchema, updateServiceSchema } from '../utils/validators.js';
import { getRequiredBusinessId } from '../middleware/tenant.js';
import { container } from '../infrastructure/container.js';

const { prisma, useCases } = container;
const { createServiceUseCase, updateServiceUseCase } = useCases;

// ============================================
// GET /api/businesses/:id/services
// Obtener todos los servicios de un negocio
// ============================================
export const getBusinessServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: businessId } = req.params as { id: string };

    const services = await prisma.service.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// GET /api/services/:id
// Obtener un servicio por ID
// ============================================
export const getServiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado',
      });
    }

    return res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// POST /api/businesses/:id/services
// Crear nuevo servicio (requiere autenticación)
// ============================================
export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: businessId } = req.params as { id: string };
    const userId = (req as any).userId;

    const parsed = createServiceSchema.parse({
      ...req.body,
      businessId,
    });

    // Verificar que el negocio pertenece al usuario
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado',
      });
    }

    if (business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para agregar servicios a este negocio',
      });
    }

    const service = await createServiceUseCase.execute({
      businessId: parsed.businessId,
      name: parsed.name,
      description: parsed.description,
      category: parsed.category,
      duration: parsed.duration,
      price: parsed.price,
      image: parsed.image,
    });

    return res.status(201).json({
      success: true,
      data: service,
      message: 'Servicio creado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos para crear el servicio',
        details: error.errors,
      });
    }
    return next(error);
  }
};

// ============================================
// PATCH /api/services/:id
// Actualizar servicio (requiere autenticación)
// ============================================
export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: serviceId } = req.params as { id: string };
    const businessId = getRequiredBusinessId(req);

    const parsed = updateServiceSchema.parse({
      ...req.body,
      businessId,
    });

    const updated = await updateServiceUseCase.execute({
      serviceId,
      businessId: parsed.businessId,
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.category !== undefined ? { category: parsed.category } : {}),
        ...(parsed.duration !== undefined ? { duration: parsed.duration } : {}),
        ...(parsed.price !== undefined ? { price: parsed.price } : {}),
        ...(parsed.image !== undefined ? { image: parsed.image } : {}),
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Servicio actualizado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos para actualizar el servicio',
        details: error.errors,
      });
    }
    return next(error);
  }
};

// ============================================
// DELETE /api/services/:id
// Eliminar servicio (soft delete - requiere autenticación)
// ============================================
export const deleteService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    // Verificar que el servicio existe y pertenece al usuario
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado',
      });
    }

    if (service.business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar este servicio',
      });
    }

    // Soft delete
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({
      success: true,
      message: 'Servicio eliminado exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// POST /api/businesses/:id/services/reorder
// Reordenar servicios (requiere autenticación)
// ============================================
export const reorderServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: businessId } = req.params as { id: string };
    const userId = (req as any).userId;
    const { order } = req.body; // array de IDs en el nuevo orden

    // Verificar permisos
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado',
      });
    }

    if (business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para reordenar servicios de este negocio',
      });
    }

    // Actualizar el orden de cada servicio
    await Promise.all(
      order.map((serviceId: string, index: number) =>
        prisma.service.update({
          where: { id: serviceId },
          data: { order: index + 1 },
        })
      )
    );

    return res.json({
      success: true,
      message: 'Servicios reordenados exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};
