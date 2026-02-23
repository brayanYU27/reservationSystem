import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateTokens, saveRefreshToken, removeRefreshToken, verifyRefreshToken, validateRefreshToken } from '../utils/jwt.js';
import { badRequest, unauthorized, notFound, conflict } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// ============================================
// REGISTRO DE USUARIO
// ============================================
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return next(badRequest(passwordValidation.message!));
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return next(conflict('El email ya está registrado'));
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generar tokens
    const tokens = generateTokens(user);
    await saveRefreshToken(user.id, tokens.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN
// ============================================
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        ownedBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            businessId: true,
            position: true,
          },
        },
      },
    });

    if (!user) {
      return next(unauthorized('Credenciales inválidas'));
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return next(unauthorized('Credenciales inválidas'));
    }

    // Generar tokens
    const tokens = generateTokens(user);
    await saveRefreshToken(user.id, tokens.refreshToken);

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(badRequest('Refresh token es requerido'));
    }

    // Validar que existe en BD
    const isValid = await validateRefreshToken(refreshToken);
    if (!isValid) {
      return next(unauthorized('Refresh token inválido o expirado'));
    }

    // Verificar JWT
    const decoded = verifyRefreshToken(refreshToken);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return next(unauthorized('Usuario no encontrado'));
    }

    // Generar nuevos tokens
    const tokens = generateTokens(user);

    // Remover el token viejo y guardar el nuevo
    await removeRefreshToken(refreshToken);
    await saveRefreshToken(user.id, tokens.refreshToken);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(unauthorized('Refresh token inválido'));
  }
};

// ============================================
// LOGOUT
// ============================================
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await removeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        ownedBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            businessId: true,
            position: true,
          },
        },
      },
    });

    if (!user) {
      return next(notFound('Usuario no encontrado'));
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ACTUALIZAR PERFIL
// ============================================
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return next(badRequest(passwordValidation.message!));
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return next(notFound('Usuario no encontrado'));
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return next(unauthorized('Contraseña actual incorrecta'));
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SOLICITAR RESET DE CONTRASEÑA
// ============================================
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por seguridad, siempre respondemos success aunque el email no exista
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación',
      });
    }

    // TODO: Generar token de reset y enviar email
    // Por ahora solo respondemos
    console.log(`Reset password solicitado para: ${email}`);

    return res.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace de recuperación',
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// CONFIRMAR RESET DE CONTRASEÑA
// ============================================
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    // TODO: Validar token de reset
    // Por ahora esta funcionalidad está pendiente
    console.log('Reset password:', { token, newPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    next(error);
  }
};
