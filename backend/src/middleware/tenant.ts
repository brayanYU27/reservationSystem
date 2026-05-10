import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';
import { badRequest } from './errorHandler.js';

type BusinessIdSource = 'jwt' | 'url' | 'body';

interface InjectBusinessIdOptions {
  required?: boolean;
  sources?: BusinessIdSource[];
}

const DEFAULT_SOURCES: BusinessIdSource[] = ['jwt', 'url'];

const getBusinessIdFromUrl = (req: Request): string | undefined => {
  if (typeof req.params.businessId === 'string' && req.params.businessId.trim()) {
    return req.params.businessId;
  }

  // Compatibilidad con rutas /api/businesses/:id
  if (
    req.baseUrl.includes('/businesses') &&
    typeof req.params.id === 'string' &&
    req.params.id.trim()
  ) {
    return req.params.id;
  }

  return undefined;
};

const getBusinessIdFromBody = (req: Request): string | undefined => {
  if (typeof req.body?.businessId === 'string' && req.body.businessId.trim()) {
    return req.body.businessId;
  }
  return undefined;
};

const getBusinessIdFromJwt = async (req: Request): Promise<string | undefined> => {
  if (typeof req.user?.businessId === 'string' && req.user.businessId.trim()) {
    return req.user.businessId;
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return undefined;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    if (!decoded?.userId) return undefined;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        ownedBusiness: { select: { id: true } },
        employeeProfile: { select: { businessId: true } },
      },
    });

    return user?.ownedBusiness?.id || user?.employeeProfile?.businessId;
  } catch {
    return undefined;
  }
};

export const injectBusinessId = (options: InjectBusinessIdOptions = {}) => {
  const { required = true, sources = DEFAULT_SOURCES } = options;

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const fromUrl = sources.includes('url') ? getBusinessIdFromUrl(req) : undefined;
      const fromJwt = sources.includes('jwt') ? await getBusinessIdFromJwt(req) : undefined;
      const fromBody = sources.includes('body') ? getBusinessIdFromBody(req) : undefined;

      const candidates = [fromJwt, fromUrl, fromBody].filter(
        (value): value is string => Boolean(value)
      );

      if (candidates.length > 1) {
        const unique = new Set(candidates);
        if (unique.size > 1) {
          throw badRequest('Conflicto de tenant: businessId no coincide entre JWT/URL');
        }
      }

      const businessId = fromJwt || fromUrl || fromBody;

      if (required && !businessId) {
        throw badRequest('businessId es obligatorio para ejecutar este caso de uso');
      }

      req.businessId = businessId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireBusinessId = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.businessId) {
    return next(badRequest('businessId es obligatorio para ejecutar este caso de uso'));
  }
  next();
};

export const getRequiredBusinessId = (req: Request): string => {
  if (!req.businessId) {
    throw badRequest('businessId es obligatorio para ejecutar este caso de uso');
  }
  return req.businessId;
};
