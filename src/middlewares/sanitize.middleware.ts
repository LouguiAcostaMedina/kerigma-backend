import type { NextFunction, Request, Response } from 'express';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Campos de credenciales que NUNCA deben ser recortados con trim():
// un espacio al inicio/fin puede ser parte intencional de la contraseña.
const NON_TRIMMABLE_KEYS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'oldPassword',
  'currentPassword',
  'current_password',
  'new_password',
]);

function isNonTrimmableKey(key: string): boolean {
  return NON_TRIMMABLE_KEYS.has(key);
}

function sanitizeString(value: string, key?: string): string {
  const withoutControlChars = value.replace(CONTROL_CHARS, '');
  if (key !== undefined && isNonTrimmableKey(key)) {
    return withoutControlChars;
  }
  return withoutControlChars.trim();
}

function sanitizeValue(value: unknown, key?: string): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value, key);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const objectKey of Object.keys(record)) {
      result[objectKey] = sanitizeValue(record[objectKey], objectKey);
    }
    return result;
  }
  return value;
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body !== undefined && req.body !== null) {
    req.body = sanitizeValue(req.body);
  }
  req.query = sanitizeValue(req.query) as Request['query'];
  req.params = sanitizeValue(req.params) as Request['params'];
  next();
}
