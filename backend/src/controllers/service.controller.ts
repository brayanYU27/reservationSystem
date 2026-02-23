import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const {
      name,
      description,
      category,
      duration,
      price,
      image,
    } = req.body;

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

    // Obtener el último orden
    const lastService = await prisma.service.findFirst({
      where: { businessId },
      orderBy: { order: 'desc' },
    });

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        category,
        duration: parseInt(duration),
        price: parseFloat(price),
        image,
        order: lastService ? lastService.order + 1 : 1,
      },
    });

    return res.status(201).json({
      success: true,
      data: service,
      message: 'Servicio creado exitosamente',
    });
  } catch (error) {
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
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;
    const {
      name,
      description,
      category,
      duration,
      price,
      image,
      isActive,
    } = req.body;

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
        error: 'No tienes permisos para actualizar este servicio',
      });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(duration && { duration: parseInt(duration) }),
        ...(price && { price: parseFloat(price) }),
        ...(image !== undefined && { image }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Servicio actualizado exitosamente',
    });
  } catch (error) {
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
