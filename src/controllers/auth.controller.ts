import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';
import { db } from '../models';
import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshInput,
  ResetPasswordInput,
  SignupInput,
  UpdateProfileInput,
} from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, type Tokens } from '../types/auth';
import { ok } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/errors';

function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) {
    return 24 * 60 * 60 * 1000;
  }
  const amount = Number.parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return amount * 1000;
  }
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
  };
}

function setAuthCookies(res: Response, tokens: Tokens): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationToMs(env.jwt.expiresIn),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationToMs(env.jwt.refreshExpiresIn),
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions());
}

export async function login(req: Request, res: Response): Promise<void> {
  const { user, tokens } = await authService.login(req.body as LoginInput);
  setAuthCookies(res, tokens);
  res.status(200).json(ok({ user: user.getPublicInfo() }, 'Inicio de sesión exitoso'));
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { user, tokens } = await authService.signup(req.body as SignupInput);
  setAuthCookies(res, tokens);
  res.status(201).json(ok({ user: user.getPublicInfo() }, 'Registro exitoso'));
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const cookies = req.cookies as Record<string, string> | undefined;
  const cookieToken = cookies?.[REFRESH_TOKEN_COOKIE];

  const body = req.body as RefreshInput | undefined;
  const refreshToken = cookieToken ?? body?.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedError('Sesión expirada. Inicie sesión nuevamente');
  }

  const tokens = await authService.refresh(refreshToken);
  setAuthCookies(res, tokens);
  res.status(200).json(ok({ expiresIn: tokens.expiresIn }, 'Sesión renovada'));
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookies(res);
  res.status(200).json(ok(null, 'Sesión cerrada'));
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const user = await authService.getProfile(req.user.id);
  const church = user.churchId ? await db.Church.findByPk(user.churchId) : null;

  res.status(200).json(
    ok({
      user: user.getPublicInfo(),
      church: church ? { id: church.id, name: church.name, city: church.city, state: church.state } : null,
    }),
  );
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const user = await authService.updateProfile(req.user.id, req.body as UpdateProfileInput);
  res.status(200).json(ok({ user: user.getPublicInfo() }, 'Perfil actualizado exitosamente'));
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { resetToken } = await authService.forgotPassword(req.body as ForgotPasswordInput);
  res.status(200).json(
    ok({ resetToken }, 'Si el email existe, recibirá un enlace para restablecer su contraseña'),
  );
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body as ResetPasswordInput);
  res.status(200).json(ok(null, 'Contraseña restablecida exitosamente'));
}
