import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { AuthUser } from '../../src/types/auth';
import { signAccessToken } from '../../src/utils/jwt';

const userService = vi.hoisted(() => ({
  listUsers: vi.fn(),
  listRoles: vi.fn(),
}));

vi.mock('../../src/services/user.service', () => userService);

const app = createApp();

function authHeader(user: AuthUser): string {
  return `Bearer ${signAccessToken(user)}`;
}

const superAdmin: AuthUser = { id: 'sa-1', email: 'super@test.com', role: 'super_admin', churchId: null, firstName: 'A', lastName: 'B' };
const leader: AuthUser = { id: 'u1', email: 'lider@test.com', role: 'leader', churchId: 'c1', firstName: 'A', lastName: 'B' };

beforeEach(() => {
  userService.listUsers.mockReset();
  userService.listRoles.mockReset();
  userService.listUsers.mockResolvedValue({ users: [], total: 0 });
});

describe('GET /api/v1/catalog', () => {
  it('devuelve el catálogo completo con envelope ok', async () => {
    const res = await request(app).get('/api/v1/catalog').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles.entries).toContainEqual({ value: 'leader', label: 'Líder' });
    expect(res.body.data.churchStatuses.labels.active).toBe('Activa');
  });

  it('devuelve un catálogo específico por nombre', async () => {
    const res = await request(app).get('/api/v1/catalog/studentStatuses').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.data.values).toEqual(['enrolled', 'active', 'completed', 'dropped', 'suspended', 'graduated']);
  });

  it('404 para catálogos inexistentes', async () => {
    const res = await request(app).get('/api/v1/catalog/inexistente').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('401 sin token', async () => {
    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(401);
  });
});

describe('RBAC en /api/v1/users', () => {
  it('GET /roles está disponible para cualquier usuario autenticado', async () => {
    const res = await request(app).get('/api/v1/users/roles').set('Authorization', authHeader(leader));
    expect(res.status).toBe(200);
    expect(res.body.data.values).toEqual(['super_admin', 'admin', 'director', 'leader', 'reader']);
  });

  it('GET / bloquea a un leader con 403 (requiere super_admin/admin/director)', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', authHeader(leader));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(userService.listUsers).not.toHaveBeenCalled();
  });

  it('GET / permite a un super_admin y delega en el servicio', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(userService.listUsers).toHaveBeenCalledOnce();
  });
});
