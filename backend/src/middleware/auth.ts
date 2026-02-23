import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';
import { unauthorized } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    businessId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw unauthorized('Token no proporcionado');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        ownedBusiness: {
          select: { id: true },
        },
        employeeProfile: {
          select: { businessId: true },
        },
      },
    });

    if (!user) {
      throw unauthorized('Usuario no encontrado');
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.ownedBusiness?.id || user.employeeProfile?.businessId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(unauthorized('Token inválido'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(unauthorized('Token expirado'));
    }
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        ownedBusiness: { select: { id: true } },
        employeeProfile: { select: { businessId: true } },
      },
    });

    if (user) {
      req.userId = user.id;
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.ownedBusiness?.id || user.employeeProfile?.businessId,
      };
    }

    next();
  } catch (error) {
    // Si el token es inválido o expirado, continuamos como invitado
    // O podríamos lanzar error si queremos ser estrictos con tokens malos.
    // Para UX, si el token expiró, mejor que falle o que pida login?
    // Si es "optional", asumimos que si falla auth, es guest.
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(unauthorized('No tienes permisos para acceder a este recurso'));
    }
    next();
  };
};

export const requireBusinessOwner = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const businessId = req.params.businessId || req.body.businessId;

    if (!businessId) {
      return next(unauthorized('ID de negocio no proporcionado'));
    }

    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: req.userId,
      },
    });

    if (!business) {
      return next(unauthorized('No eres el propietario de este negocio'));
    }

    next();
  } catch (error) {
    next(error);
  }
};
