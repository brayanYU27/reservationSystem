import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/subscriptions/plans - Planes disponibles
router.get('/plans', async (_req, res, next) => {
  try {
    // TODO: Retornar planes con precios y límites
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// GET /api/businesses/:businessId/subscription - Suscripción actual
router.get('/:businessId/subscription', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/businesses/:businessId/subscription - Crear suscripción
router.post('/:businessId/subscription', authenticate, async (_req, res, next) => {
  try {
    // TODO: Integración con Stripe
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/businesses/:businessId/subscription/upgrade - Upgrade
router.post('/:businessId/subscription/upgrade', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/businesses/:businessId/subscription/cancel - Cancelar
router.post('/:businessId/subscription/cancel', authenticate, async (_req, res, next) => {
  try {
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
