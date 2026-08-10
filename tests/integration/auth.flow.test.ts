import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  churchId: string | null;
  role: 'admin' | 'director' | 'leader' | 'reader';
  isActive: boolean;
  isApproved: boolean;
  loginAttempts: number;
  lockedUntil: Date | null;
  lastLogin: Date | null;
}

const { userRows } = vi.hoisted(() => ({ userRows: [] as StoredUser[] }));

vi.mock('../../src/models', async () => {
  const bcryptNamespace = await import('bcryptjs');

  interface BcryptLike {
    hash(value: string, rounds: number): Promise<string>;
    compare(value: string, hashValue: string): Promise<boolean>;
  }

  const bcryptModule = (bcryptNamespace.default ?? bcryptNamespace) as BcryptLike;

  interface UserInstance {
    id: string;
    email: string;
    password: string;
    role: string;
    churchId: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    isApproved: boolean;
    loginAttempts: number;
    validatePassword(password: string): Promise<boolean>;
    isLocked(): boolean;
    update(fields: Partial<StoredUser>): Promise<UserInstance>;
    getPublicInfo(): {
      id: string;
      email: string;
      role: string;
      churchId: string | null;
      firstName: string;
      lastName: string;
    };
  }

  function createUserInstance(row: StoredUser): UserInstance {
    const instance: UserInstance = {
      get id() {
        return row.id;
      },
      get email() {
        return row.email;
      },
      get password() {
        return row.passwordHash;
      },
      get role() {
        return row.role;
      },
      get churchId() {
        return row.churchId;
      },
      get firstName() {
        return row.firstName;
      },
      get lastName() {
        return row.lastName;
      },
      get isActive() {
        return row.isActive;
      },
      get isApproved() {
        return row.isApproved;
      },
      get loginAttempts() {
        return row.loginAttempts;
      },
      async validatePassword(password: string): Promise<boolean> {
        return bcryptModule.compare(password, row.passwordHash);
      },
      isLocked(): boolean {
        return row.lockedUntil !== null && row.lockedUntil.getTime() > Date.now();
      },
      async update(fields: Partial<StoredUser>): Promise<UserInstance> {
        Object.assign(row, fields);
        return instance;
      },
      getPublicInfo() {
        return {
          id: row.id,
          email: row.email,
          role: row.role,
          churchId: row.churchId,
          firstName: row.firstName,
          lastName: row.lastName,
        };
      },
    };
    return instance;
  }

  const adminHash = await bcryptModule.hash('AdminMisionero2024!', 10);
  userRows.push({
    id: 'user-admin-1',
    email: 'admin@misionero.com',
    passwordHash: adminHash,
    firstName: 'Admin',
    lastName: 'Sistema',
    phone: null,
    churchId: 'church-a',
    role: 'admin',
    isActive: true,
    isApproved: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
  });

  const User = {
    async findOne(opts: { where: { email?: string } }): Promise<UserInstance | null> {
      const row = userRows.find((u) => u.email === opts.where.email);
      return row ? createUserInstance(row) : null;
    },
    async findByPk(id: string): Promise<UserInstance | null> {
      const row = userRows.find((u) => u.id === id);
      return row ? createUserInstance(row) : null;
    },
    async create(data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      churchId: string | null;
      role: string;
      isApproved: boolean;
    }): Promise<UserInstance> {
      const passwordHash = await bcryptModule.hash(data.password, 10);
      const row: StoredUser = {
        id: `user-${userRows.length + 1}`,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        churchId: data.churchId,
        role: data.role as StoredUser['role'],
        isActive: true,
        isApproved: data.isApproved,
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
      };
      userRows.push(row);
      return createUserInstance(row);
    },
  };

  const Church = {
    async findByPk(): Promise<null> {
      return null;
    },
  };

  const db = {
    User,
    Church,
    Group: {},
    Member: {},
    Quarter: {},
    WeeklyMetric: {},
    BibleStudent: {},
    BibleLessonProgress: {},
    DisciplePair: {},
    AttendanceRecord: {},
    QuarterlyGoal: {},
    sequelize: {},
  };

  return { db, User, Church, sequelize: {} };
});

const app = createApp();
const BASE = `${env.apiBasePath}/${env.apiVersion}`;
const LOGIN_URL = `${BASE}/auth/login`;

function extractCookies(res: request.Response): string[] {
  const setCookie = res.headers['set-cookie'];
  return Array.isArray(setCookie) ? (setCookie as string[]) : [];
}

function findCookie(cookies: string[], name: string): string | undefined {
  return cookies.find((cookie) => cookie.startsWith(`${name}=`));
}

function cookieHeader(cookie: string): string {
  return cookie.split(';')[0];
}

describe('flujo de autenticación (integración)', () => {
  it('login emite access_token y refresh_token con HttpOnly y SameSite=lax', async () => {
    const res = await request(app).post(LOGIN_URL).send({
      email: 'admin@misionero.com',
      password: 'AdminMisionero2024!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@misionero.com');

    const cookies = extractCookies(res);
    const accessCookie = findCookie(cookies, 'access_token');
    const refreshCookie = findCookie(cookies, 'refresh_token');

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    expect(accessCookie!.toLowerCase()).toContain('httponly');
    expect(accessCookie!.toLowerCase()).toContain('samesite=lax');
    expect(refreshCookie!.toLowerCase()).toContain('httponly');
    expect(refreshCookie!.toLowerCase()).toContain('samesite=lax');
  });

  it('credenciales inválidas devuelven 401', async () => {
    const res = await request(app).post(LOGIN_URL).send({
      email: 'admin@misionero.com',
      password: 'ClaveIncorrecta!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('accede a /auth/me usando la cookie access_token', async () => {
    const login = await request(app).post(LOGIN_URL).send({
      email: 'admin@misionero.com',
      password: 'AdminMisionero2024!',
    });
    const accessCookie = findCookie(extractCookies(login), 'access_token');

    const res = await request(app).get(`${BASE}/auth/me`).set('Cookie', cookieHeader(accessCookie!));

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe('user-admin-1');
    expect(res.body.data.user.churchId).toBe('church-a');
  });

  it('/auth/me sin cookie devuelve 401', async () => {
    const res = await request(app).get(`${BASE}/auth/me`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('refresh renueva la sesión y el access_token nuevo es funcional', async () => {
    const login = await request(app).post(LOGIN_URL).send({
      email: 'admin@misionero.com',
      password: 'AdminMisionero2024!',
    });
    const oldRefresh = findCookie(extractCookies(login), 'refresh_token');

    const res = await request(app)
      .post(`${BASE}/auth/refresh`)
      .set('Cookie', cookieHeader(oldRefresh!));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const newRefresh = findCookie(extractCookies(res), 'refresh_token');
    const newAccess = findCookie(extractCookies(res), 'access_token');
    expect(newRefresh).toBeDefined();
    expect(newAccess).toBeDefined();
    expect(newRefresh!.toLowerCase()).toContain('httponly');

    const me = await request(app).get(`${BASE}/auth/me`).set('Cookie', cookieHeader(newAccess!));
    expect(me.status).toBe(200);
    expect(me.body.data.user.id).toBe('user-admin-1');
  });

  it('logout limpia las cookies de sesión', async () => {
    const login = await request(app).post(LOGIN_URL).send({
      email: 'admin@misionero.com',
      password: 'AdminMisionero2024!',
    });
    const cookies = extractCookies(login);
    const cookieHeaderValue = cookies.map(cookieHeader).join('; ');

    const res = await request(app).post(`${BASE}/auth/logout`).set('Cookie', cookieHeaderValue);

    expect(res.status).toBe(200);
    const cleared = extractCookies(res);
    expect(findCookie(cleared, 'access_token')).toContain('access_token=;');
    expect(findCookie(cleared, 'refresh_token')).toContain('refresh_token=;');
  });

  it('signup crea la cuenta y un usuario sin aprobar no puede iniciar sesión', async () => {
    const signup = await request(app).post(`${BASE}/auth/signup`).send({
      email: 'nuevo@misionero.com',
      password: 'Clave2024!',
      firstName: 'Nuevo',
      lastName: 'Miembro',
      phone: '999888777',
    });

    expect(signup.status).toBe(201);
    expect(signup.body.data.user.email).toBe('nuevo@misionero.com');
    expect(findCookie(extractCookies(signup), 'access_token')).toBeDefined();

    const login = await request(app).post(LOGIN_URL).send({
      email: 'nuevo@misionero.com',
      password: 'Clave2024!',
    });
    expect(login.status).toBe(403);
    expect(login.body.error).toBe('FORBIDDEN');
  });
});
