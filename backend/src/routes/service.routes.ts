import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/service.controller.js';

const router = Router();

// GET /api/services/:id - Obtener servicio por ID
router.get('/:id', getServiceById);

// PATCH /api/services/:id - Actualizar servicio
router.patch('/:id', authenticate, updateService);

// DELETE /api/services/:id - Eliminar servicio
router.delete('/:id', authenticate, deleteService);

export default router;
