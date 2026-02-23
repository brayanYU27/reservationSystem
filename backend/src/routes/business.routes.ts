import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBusinessSchema, updateBusinessSchema } from '../utils/validators.js';
import {
  getAllBusinesses,
  getBusinessById,
  getBusinessBySlug,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusiness,
  getBusinessAvailability,
  getBusinessAppointments,
} from '../controllers/business.controller.js';
import {
  getBusinessServices,
  createService,
  reorderServices,
} from '../controllers/service.controller.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/businesses - Listar todos los negocios
router.get('/', getAllBusinesses);

// GET /api/businesses/search - Buscar negocios
router.get('/search', getAllBusinesses);

// GET /api/businesses/slug/:slug - Obtener por slug
router.get('/slug/:slug', getBusinessBySlug);

// GET /api/businesses/:id - Obtener por ID
router.get('/:id', getBusinessById);

// GET /api/businesses/:id/availability - Disponibilidad
router.get('/:id/availability', getBusinessAvailability);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// GET /api/businesses/my/business - Obtener mi negocio
router.get('/my/business', authenticate, getMyBusiness);

// POST /api/businesses - Crear negocio
router.post('/', authenticate, validate(createBusinessSchema), createBusiness);

// PUT /api/businesses/:id - Actualizar negocio
router.put('/:id', authenticate, validate(updateBusinessSchema), updateBusiness);

// DELETE /api/businesses/:id - Desactivar negocio
router.delete('/:id', authenticate, deleteBusiness);

// GET /api/businesses/:id/employees - Obtener empleados de un negocio
router.get('/:id/employees', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prisma } = await import('../config/database.js');

    const employees = await prisma.employee.findMany({
      where: {
        businessId: id as string,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Formatear respuesta para compatibilidad con frontend
    const formattedEmployees = employees.map(emp => {
      const user = emp.user;
      return {
        ...emp,
        user: user ? {
          ...user,
          name: `${user.firstName} ${user.lastName}`,
        } : null,
      }
    });

    res.json({ success: true, data: formattedEmployees });
  } catch (error) {
    next(error);
  }
});

// GET /api/businesses/:id/services - Obtener servicios de un negocio
router.get('/:id/services', getBusinessServices);

// POST /api/businesses/:id/services - Crear servicio
router.post('/:id/services', authenticate, createService);

// POST /api/businesses/:id/services/reorder - Reordenar servicios
router.post('/:id/services/reorder', authenticate, reorderServices);

// GET /api/businesses/:id/appointments - Obtener citas de un negocio
router.get('/:id/appointments', authenticate, getBusinessAppointments);

// Analytics routes
import * as analyticsController from '../controllers/analytics.controller.js';

// GET /api/businesses/:id/analytics/summary - Obtener resumen de analytics
router.get('/:id/analytics/summary', authenticate, analyticsController.getDashboardSummary);

// GET /api/businesses/:id/analytics/revenue - Obtener reporte de ingresos
router.get('/:id/analytics/revenue', authenticate, analyticsController.getRevenueReport);

// GET /api/businesses/:id/analytics/top-services - Obtener servicios más populares
router.get('/:id/analytics/top-services', authenticate, analyticsController.getTopServices);

// GET /api/businesses/:id/analytics/top-employees - Obtener empleados destacados
router.get('/:id/analytics/top-employees', authenticate, analyticsController.getTopEmployees);

// Gallery routes
import * as galleryController from '../controllers/gallery.controller.js';

// GET /api/businesses/:id/gallery - Obtener galería del negocio
router.get('/:id/gallery', authenticate, galleryController.getBusinessGallery);

// GET /api/businesses/:id/gallery/:imageId - Obtener imagen específica
router.get('/:id/gallery/:imageId', authenticate, galleryController.getGalleryImageById);

// POST /api/businesses/:id/gallery - Agregar imagen a galería
router.post('/:id/gallery', authenticate, galleryController.createGalleryImage);

// PUT /api/businesses/:id/gallery/:imageId - Actualizar imagen
router.put('/:id/gallery/:imageId', authenticate, galleryController.updateGalleryImage);

// DELETE /api/businesses/:id/gallery/:imageId - Eliminar imagen
router.delete('/:id/gallery/:imageId', authenticate, galleryController.deleteGalleryImage);

// PUT /api/businesses/:id/gallery/reorder - Reordenar imágenes
router.put('/:id/gallery-reorder', authenticate, galleryController.reorderGalleryImages);

export default router;

