import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  emailSchema,
  resetPasswordSchema,
} from '../utils/validators.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// POST /api/auth/register - Registro de usuario
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login - Inicio de sesión
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh - Refrescar token
router.post('/refresh', authController.refreshToken);

// POST /api/auth/password-reset/request - Solicitar reset de contraseña
router.post('/password-reset/request', validate(emailSchema), authController.requestPasswordReset);

// POST /api/auth/password-reset/confirm - Confirmar reset de contraseña
router.post('/password-reset/confirm', validate(resetPasswordSchema), authController.resetPassword);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// GET /api/auth/me - Obtener usuario actual
router.get('/me', authenticate, authController.getCurrentUser);

// PATCH /api/auth/profile - Actualizar perfil
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticate, authController.logout);

export default router;
