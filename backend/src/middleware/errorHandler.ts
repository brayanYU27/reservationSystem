import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/domain/errors/AppError.js';

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: any;
}

export const globalErrorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// Alias para compatibilidad con imports existentes
export const errorHandler = globalErrorMiddleware;

// Errores comunes
export const notFound = (message: string = 'Recurso no encontrado') => {
  return new AppError(message, 404, 'NOT_FOUND');
};

export const unauthorized = (message: string = 'No autorizado') => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

export const forbidden = (message: string = 'Acceso prohibido') => {
  return new AppError(message, 403, 'FORBIDDEN');
};

export const badRequest = (message: string, details?: any) => {
  return new AppError(message, 400, 'BAD_REQUEST', details);
};

export const conflict = (message: string) => {
  return new AppError(message, 409, 'CONFLICT');
};
