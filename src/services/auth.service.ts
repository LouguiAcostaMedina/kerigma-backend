import { env } from '../config/env';
import { db, type User } from '../models';
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
  UpdateProfileInput,
} from '../schemas/auth.schema';
import type { AuthUser, Tokens } from '../types/auth';
import {
  signAccessToken,
  signPasswordResetToken,
  signRefreshToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  ConflictError,
  ForbiddenError,
  isAppError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';
import type { UserAttributes } from '../models/User.model';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    churchId: user.churchId,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

function buildTokens(user: User): Tokens {
  const authUser = toAuthUser(user);
  return {
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
    expiresIn: env.jwt.expiresIn,
  };
}

async function recordFailedLogin(user: User): Promise<void> {
  const attempts = user.loginAttempts + 1;
  const updates: Partial<UserAttributes> = { loginAttempts: attempts };
  if (attempts >= MAX_LOGIN_ATTEMPTS && !user.isLocked()) {
    updates.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
  }
  await user.update(updates);
}

export async function login(input: LoginInput): Promise<{ user: User; tokens: Tokens }> {
  try {
    const email = input.email.toLowerCase().trim();
    // Sin `include`: la consulta del usuario solo usa la tabla Users. No hay asociaciones
    // (Role/Church) que referenciar; los alias de models/index.ts no intervienen aquí.
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (user.isLocked()) {
      throw new TooManyRequestsError('Cuenta bloqueada temporalmente por demasiados intentos fallidos');
    }

    if (!user.password) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const isValidPassword = await user.validatePassword(input.password);
    if (!isValidPassword) {
      await recordFailedLogin(user);
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Su cuenta está desactivada. Contacte al administrador');
    }

    if (!user.isApproved) {
      throw new ForbiddenError('Su cuenta está pendiente de aprobación por un administrador');
    }

    await user.update({
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });

    return { user, tokens: buildTokens(user) };
  } catch (error) {
    if (!isAppError(error)) {
      console.error('Error en login service:', error);
    }
    throw error;
  }
}

export async function signup(input: SignupInput): Promise<{ user: User; tokens: Tokens }> {
  const email = input.email.toLowerCase().trim();
  const existing = await db.User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('El email ya está registrado en el sistema');
  }

  const user = await db.User.create({
    email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone && input.phone.trim() !== '' ? input.phone.trim() : null,
    churchId: input.churchId ?? null,
    role: 'reader',
    isApproved: false,
  });

  return { user, tokens: buildTokens(user) };
}

export async function refresh(refreshToken: string): Promise<Tokens> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await db.User.findByPk(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Sesión inválida o expirada');
  }

  return buildTokens(user);
}

export async function getProfile(userId: string): Promise<User> {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }
  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  await user.update({
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone && input.phone.trim() !== '' ? input.phone.trim() : null,
  });

  return user;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ resetToken: string }> {
  const email = input.email.toLowerCase().trim();
  const user = await db.User.findOne({ where: { email } });

  if (!user || !user.isActive) {
    throw new NotFoundError('No existe una cuenta con ese email');
  }

  const resetToken = signPasswordResetToken(user.id);
  return { resetToken };
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  let payload;
  try {
    payload = verifyPasswordResetToken(input.token);
  } catch {
    throw new ValidationError('El enlace de restablecimiento es inválido o ha expirado');
  }

  if (payload.purpose !== 'password_reset') {
    throw new ValidationError('El token no es válido para restablecer la contraseña');
  }

  const user = await db.User.findByPk(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  await user.update({
    password: input.newPassword,
    loginAttempts: 0,
    lockedUntil: null,
  });
}
