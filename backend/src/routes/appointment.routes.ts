import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { createAppointment, getMyAppointments, updateAppointmentStatus, cancelAppointment, listAppointments } from '../controllers/appointment.controller.js';

const router = Router();

// POST /api/appointments - Crear cita
router.post('/', optionalAuthenticate, createAppointment);
// GET /api/appointments - Listar citas (con filtros)
router.get('/', authenticate, listAppointments);

// GET /api/appointments/me - Mis citas (como cliente)
router.get('/me', authenticate, getMyAppointments);

// GET /api/appointments/:id - Obtener cita
router.get('/:id', authenticate, async (_req, res, next) => {
  try {
    // TODO: Implementar getAppointmentById si es necesario
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/status - Actualizar estado
router.patch('/:id/status', authenticate, updateAppointmentStatus);

// POST /api/appointments/:id/cancel - Cancelar cita
router.post('/:id/cancel', authenticate, cancelAppointment);

// POST /api/appointments/:id/reschedule - Reprogramar
router.post('/:id/reschedule', authenticate, async (_req, res, next) => {
  try {
    // TODO: Implementar reprogramación real
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
