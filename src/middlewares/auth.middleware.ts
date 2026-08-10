import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../types/auth';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return undefined;
  }
  return header.slice('Bearer '.length).trim();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[ACCESS_TOKEN_COOKIE] ?? extractBearerToken(req);

    if (!token) {
      throw new UnauthorizedError('No autenticado');
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      churchId: payload.churchId,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
}
