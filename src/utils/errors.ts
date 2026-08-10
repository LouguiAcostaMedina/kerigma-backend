export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: HttpStatusCode, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intente nuevamente más tarde') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS');
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
