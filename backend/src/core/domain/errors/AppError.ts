export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string = 'Recurso', details?: unknown) {
    super(`${resource} no encontrado`, 404, 'RESOURCE_NOT_FOUND', details);
  }
}

export class BusinessConflictError extends AppError {
  constructor(message: string = 'Conflicto de negocio', details?: unknown) {
    super(message, 409, 'BUSINESS_CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Datos inválidos', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}
