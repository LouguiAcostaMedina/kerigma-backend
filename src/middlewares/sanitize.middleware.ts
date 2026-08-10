import type { NextFunction, Request, Response } from 'express';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function sanitizeString(value: string): string {
  return value.replace(CONTROL_CHARS, '').trim();
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      result[key] = sanitizeValue(record[key]);
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
