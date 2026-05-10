import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { injectBusinessId, requireBusinessId } from '../middleware/tenant.js';
import {
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/service.controller.js';

const router = Router();

// GET /api/services/:id - Obtener servicio por ID
router.get('/:id', getServiceById);

// PATCH /api/services/:id - Actualizar servicio
router.patch('/:id', authenticate, injectBusinessId({ required: true, sources: ['jwt', 'url', 'body'] }), requireBusinessId, updateService);

// DELETE /api/services/:id - Eliminar servicio
router.delete('/:id', authenticate, injectBusinessId({ required: true, sources: ['jwt', 'url', 'body'] }), requireBusinessId, deleteService);

export default router;
