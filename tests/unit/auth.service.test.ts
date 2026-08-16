import { describe, expect, it, vi, beforeEach } from 'vitest';
import { env } from '../../src/config/env';
import {
  forgotPassword,
  getProfile,
  login,
  refresh,
  resetPassword,
  signup,
  updateProfile,
} from '../../src/services/auth.service';

const mocks = vi.hoisted(() => {
  const userFindOne = vi.fn();
  const userFindByPk = vi.fn();
  const userCreate = vi.fn();
  const signAccessToken = vi.fn();
  const signRefreshToken = vi.fn();
  const signPasswordResetToken = vi.fn();
  const verifyRefreshToken = vi.fn();
  const verifyPasswordResetToken = vi.fn();
  const sendEmail = vi.fn();
  const buildPasswordResetEmail = vi.fn();
  return {
    userFindOne,
    userFindByPk,
    userCreate,
    signAccessToken,
    signRefreshToken,
    signPasswordResetToken,
    verifyRefreshToken,
    verifyPasswordResetToken,
    sendEmail,
    buildPasswordResetEmail,
  };
});

vi.mock('../../src/models', () => ({
  db: {
    User: {
      findOne: mocks.userFindOne,
      findByPk: mocks.userFindByPk,
      create: mocks.userCreate,
    },
  },
}));

vi.mock('../../src/utils/jwt', () => ({
  signAccessToken: mocks.signAccessToken,
  signRefreshToken: mocks.signRefreshToken,
  signPasswordResetToken: mocks.signPasswordResetToken,
  verifyRefreshToken: mocks.verifyRefreshToken,
  verifyPasswordResetToken: mocks.verifyPasswordResetToken,
}));

vi.mock('../../src/services/email.service', () => ({
  sendEmail: mocks.sendEmail,
  buildPasswordResetEmail: mocks.buildPasswordResetEmail,
}));

interface UserLike {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  churchId: string | null;
  isActive: boolean;
  isApproved: boolean;
  loginAttempts: number;
  lockedUntil: Date | null;
  lastLogin: Date | null;
  validatePassword(password: string): Promise<boolean>;
  isLocked(): boolean;
  update(values: Record<string, unknown>): Promise<UserLike>;
}

function makeUser(overrides: Partial<UserLike> = {}): UserLike {
  const base: UserLike = {
    id: 'user-1',
    email: 'usuario@test.com',
    password: 'HashDePrueba',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'leader',
    phone: null,
    churchId: 'church-1',
    isActive: true,
    isApproved: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    validatePassword: vi.fn(async (password: string) => password === 'ClaveCorrecta1'),
    isLocked: () => false,
    update: vi.fn(async function (this: UserLike, values: Record<string, unknown>) {
      Object.assign(this, values);
      return this;
    }),
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signAccessToken.mockReturnValue('access-token');
  mocks.signRefreshToken.mockReturnValue('refresh-token');
  mocks.signPasswordResetToken.mockReturnValue('reset-token');
  mocks.verifyRefreshToken.mockReturnValue({ sub: 'user-1', email: 'usuario@test.com' });
  mocks.verifyPasswordResetToken.mockReturnValue({ sub: 'user-1', purpose: 'password_reset' });
  mocks.buildPasswordResetEmail.mockReturnValue({
    to: 'usuario@test.com',
    subject: 'Restablece tu contraseña',
    text: 'enlace',
  });
  mocks.sendEmail.mockResolvedValue(undefined);
});

describe('auth.service - login', () => {
  it('inicia sesión con credenciales válidas, resetea intentos y devuelve tokens', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValue(user);

    const result = await login({ email: 'USUARIO@TEST.com', password: 'ClaveCorrecta1' });

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ loginAttempts: 0, lockedUntil: null }),
    );
    expect(result.user.id).toBe('user-1');
    expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: env.jwt.expiresIn });
  });

  it('rechaza contraseña incorrecta e incrementa loginAttempts', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValue(user);

    await expect(login({ email: 'usuario@test.com', password: 'ClaveIncorrecta' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ loginAttempts: 1 }));
  });

  it('bloquea la cuenta al llegar a 5 intentos fallidos (lockedUntil)', async () => {
    const user = makeUser({ loginAttempts: 4 });
    mocks.userFindOne.mockResolvedValue(user);

    await expect(login({ email: 'usuario@test.com', password: 'ClaveIncorrecta' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ loginAttempts: 5, lockedUntil: expect.any(Date) }),
    );
  });

  it('rechaza una cuenta bloqueada con TooManyRequestsError', async () => {
    const user = makeUser({
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      isLocked: () => true,
    });
    mocks.userFindOne.mockResolvedValue(user);

    await expect(login({ email: 'usuario@test.com', password: 'ClaveCorrecta1' })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });
  });

  it('rechaza un usuario pendiente de aprobación con ForbiddenError', async () => {
    const user = makeUser({ isApproved: false });
    mocks.userFindOne.mockResolvedValue(user);

    await expect(login({ email: 'usuario@test.com', password: 'ClaveCorrecta1' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('rechaza un usuario inactivo con ForbiddenError', async () => {
    const user = makeUser({ isActive: false });
    mocks.userFindOne.mockResolvedValue(user);

    await expect(login({ email: 'usuario@test.com', password: 'ClaveCorrecta1' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('rechaza un email inexistente con UnauthorizedError', async () => {
    mocks.userFindOne.mockResolvedValue(null);

    await expect(login({ email: 'noexiste@test.com', password: 'ClaveCorrecta1' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});

describe('auth.service - signup', () => {
  it('crea el usuario con rol reader y pendiente de aprobación', async () => {
    mocks.userFindOne.mockResolvedValue(null);
    const user = makeUser({ role: 'reader', isApproved: false });
    mocks.userCreate.mockResolvedValue(user);

    const result = await signup({
      email: 'NUEVO@test.com',
      password: 'ClaveCorrecta1',
      firstName: 'Nuevo',
      lastName: 'Miembro',
      phone: ' 999888777 ',
    });

    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nuevo@test.com', role: 'reader', isApproved: false, phone: '999888777' }),
    );
    expect(result.user.role).toBe('reader');
  });

  it('lanza ConflictError si el email ya está registrado', async () => {
    mocks.userFindOne.mockResolvedValue(makeUser());

    await expect(
      signup({ email: 'usuario@test.com', password: 'ClaveCorrecta1', firstName: 'A', lastName: 'B' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('auth.service - refresh', () => {
  it('renueva los tokens con un refresh token válido', async () => {
    mocks.userFindByPk.mockResolvedValue(makeUser());

    const tokens = await refresh('refresh-token');

    expect(mocks.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.expiresIn).toBe(env.jwt.expiresIn);
  });

  it('lanza UnauthorizedError si el usuario no existe o está inactivo', async () => {
    mocks.userFindByPk.mockResolvedValue(null);
    await expect(refresh('refresh-token')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    mocks.userFindByPk.mockResolvedValue(makeUser({ isActive: false }));
    await expect(refresh('refresh-token')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('auth.service - getProfile', () => {
  it('devuelve el usuario del id solicitado', async () => {
    const user = makeUser();
    mocks.userFindByPk.mockResolvedValue(user);

    const result = await getProfile('user-1');

    expect(result.id).toBe('user-1');
    expect(mocks.userFindByPk).toHaveBeenCalledWith('user-1');
  });

  it('lanza UnauthorizedError si el usuario no existe', async () => {
    mocks.userFindByPk.mockResolvedValue(null);

    await expect(getProfile('user-inexistente')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('auth.service - updateProfile', () => {
  it('actualiza nombre, apellido y teléfono del usuario', async () => {
    const user = makeUser();
    mocks.userFindByPk.mockResolvedValue(user);

    const result = await updateProfile('user-1', {
      firstName: 'María',
      lastName: 'Gómez',
      phone: '987654321',
    });

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'María', lastName: 'Gómez', phone: '987654321' }),
    );
    expect(result.firstName).toBe('María');
  });

  it('lanza UnauthorizedError si el usuario no existe', async () => {
    mocks.userFindByPk.mockResolvedValue(null);

    await expect(
      updateProfile('user-inexistente', { firstName: 'María', lastName: 'Gómez' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('auth.service - forgotPassword', () => {
  it('envía el email de restablecimiento cuando el usuario existe', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValue(user);

    await forgotPassword({ email: 'usuario@test.com' });

    expect(mocks.signPasswordResetToken).toHaveBeenCalledWith('user-1');
    expect(mocks.buildPasswordResetEmail).toHaveBeenCalledWith(
      'usuario@test.com',
      expect.stringContaining(`${env.cors.frontendUrl}/reset-password/reset-token`),
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('no envía email para un email inexistente (respuesta genérica)', async () => {
    mocks.userFindOne.mockResolvedValue(null);

    await forgotPassword({ email: 'noexiste@test.com' });

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('no envía email si la cuenta está inactiva', async () => {
    mocks.userFindOne.mockResolvedValue(makeUser({ isActive: false }));

    await forgotPassword({ email: 'usuario@test.com' });

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

describe('auth.service - resetPassword', () => {
  it('restablece la contraseña con un token válido y limpia intentos/bloqueo', async () => {
    const user = makeUser();
    mocks.userFindByPk.mockResolvedValue(user);

    await resetPassword({ token: 'token-valido', newPassword: 'NuevaClave1' });

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'NuevaClave1', loginAttempts: 0, lockedUntil: null }),
    );
  });

  it('lanza ValidationError con un token inválido o expirado', async () => {
    mocks.verifyPasswordResetToken.mockImplementation(() => {
      throw new Error('Token inválido o expirado');
    });

    await expect(resetPassword({ token: 'token-invalido', newPassword: 'NuevaClave1' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('lanza ValidationError si el token no es de password_reset', async () => {
    mocks.verifyPasswordResetToken.mockReturnValue({ sub: 'user-1', purpose: 'access' });

    await expect(resetPassword({ token: 'token-otro', newPassword: 'NuevaClave1' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('lanza UnauthorizedError si el usuario no existe', async () => {
    mocks.userFindByPk.mockResolvedValue(null);

    await expect(resetPassword({ token: 'token-valido', newPassword: 'NuevaClave1' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
