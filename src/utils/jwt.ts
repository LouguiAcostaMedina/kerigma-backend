import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { env } from '../config/env';
import type { AccessTokenPayload, AuthUser, RefreshTokenPayload } from '../types/auth';
import { AppError, HttpStatus } from './errors';

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      churchId: user.churchId,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn as StringValue,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      algorithm: 'HS256',
    },
  );
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.jwt.secret,
    {
      expiresIn: env.jwt.refreshExpiresIn as StringValue,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      algorithm: 'HS256',
    },
  );
}

export function signPasswordResetToken(userId: string): string {
  return jwt.sign(
    { sub: userId, purpose: 'password_reset' },
    env.jwt.secret,
    {
      expiresIn: '1h',
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      algorithm: 'HS256',
    },
  );
}

export interface PasswordResetPayload extends JwtPayload {
  sub: string;
  purpose: 'password_reset';
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  return verifyToken<PasswordResetPayload>(token, 'refresh');
}

function verifyToken<T extends JwtPayload>(token: string, expectedType: 'access' | 'refresh'): T {
  try {
    const decoded = jwt.verify(token, env.jwt.secret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      algorithms: ['HS256'],
    });

    if (typeof decoded === 'string') {
      throw new AppError('Token inválido', HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    if (expectedType === 'access' && typeof (decoded as AccessTokenPayload).id !== 'string') {
      throw new AppError('Token de acceso inválido', HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    if (expectedType === 'refresh' && typeof (decoded as RefreshTokenPayload).sub !== 'string') {
      throw new AppError('Token de refresco inválido', HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    return decoded as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Token inválido o expirado', HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return verifyToken<AccessTokenPayload>(token, 'access');
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return verifyToken<RefreshTokenPayload>(token, 'refresh');
}
