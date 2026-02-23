import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/reviews - Crear reseña
router.post('/', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/reviews/:id - Actualizar reseña
router.patch('/:id', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reviews/:id - Eliminar reseña
router.delete('/:id', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/:id/respond - Responder reseña
router.post('/:id/respond', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
