import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { AuthUser } from '../../src/types/auth';
import { signAccessToken } from '../../src/utils/jwt';

const auditQueryService = vi.hoisted(() => ({
  listAuditLogs: vi.fn(),
  getAuditLogById: vi.fn(),
  getAuditStats: vi.fn(),
}));

vi.mock('../../src/services/auditQuery.service', () => auditQueryService);

const app = createApp();

function authHeader(user: AuthUser): string {
  return `Bearer ${signAccessToken(user)}`;
}

const superAdmin: AuthUser = { id: 'sa-1', email: 'super@test.com', role: 'super_admin', churchId: null, firstName: 'Super', lastName: 'Admin' };
const admin: AuthUser = { id: 'a1', email: 'admin@test.com', role: 'admin', churchId: 'c1', firstName: 'Admin', lastName: 'User' };
const director: AuthUser = { id: 'd1', email: 'director@test.com', role: 'director', churchId: 'c1', firstName: 'Director', lastName: 'User' };
const leader: AuthUser = { id: 'l1', email: 'leader@test.com', role: 'leader', churchId: 'c1', firstName: 'Leader', lastName: 'User' };

beforeEach(() => {
  auditQueryService.listAuditLogs.mockReset();
  auditQueryService.getAuditLogById.mockReset();
  auditQueryService.getAuditStats.mockReset();
});

describe('RBAC en /api/v1/audit-logs', () => {
  it('GET / bloquea a leader con 403 (requiere super_admin/admin)', async () => {
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', authHeader(leader));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(auditQueryService.listAuditLogs).not.toHaveBeenCalled();
  });

  it('GET / bloquea a director con 403', async () => {
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', authHeader(director));
    expect(res.status).toBe(403);
    expect(auditQueryService.listAuditLogs).not.toHaveBeenCalled();
  });

  it('GET / permite a super_admin y delega en el servicio', async () => {
    auditQueryService.listAuditLogs.mockResolvedValue({ logs: [], total: 0, page: 1 });
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(auditQueryService.listAuditLogs).toHaveBeenCalledOnce();
  });

  it('GET / permite a admin', async () => {
    auditQueryService.listAuditLogs.mockResolvedValue({ logs: [], total: 0, page: 1 });
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', authHeader(admin));
    expect(res.status).toBe(200);
    expect(auditQueryService.listAuditLogs).toHaveBeenCalledOnce();
  });

  it('GET / 401 sin token', async () => {
    const res = await request(app).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
    expect(auditQueryService.listAuditLogs).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/audit-logs (listado)', () => {
  it('devuelve paginated envelope con los logs', async () => {
    const mockLogs = [
      { id: '1', entity: 'users', entityId: 'u1', action: 'create', actorUserId: 'sa-1', actorName: 'Super Admin', actorEmail: 'super@test.com', changes: { email: 'new@test.com' }, createdAt: new Date() },
    ];
    auditQueryService.listAuditLogs.mockResolvedValue({ logs: mockLogs, total: 1, page: 1 });

    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.currentPage).toBe(1);
  });

  it('pasa los query params al servicio', async () => {
    auditQueryService.listAuditLogs.mockResolvedValue({ logs: [], total: 0, page: 1 });

    await request(app)
      .get('/api/v1/audit-logs?entity=members&action=create&limit=10&page=2')
      .set('Authorization', authHeader(superAdmin));

    expect(auditQueryService.listAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'members', action: 'create', limit: 10, page: 2 }),
    );
  });
});

describe('GET /api/v1/audit-logs/stats', () => {
  it('devuelve stats con envelope ok', async () => {
    const mockStats = { totalLogs: 100, recentLogs24h: 5, byAction: [], byEntity: [], topActors: [] };
    auditQueryService.getAuditStats.mockResolvedValue(mockStats);

    const res = await request(app).get('/api/v1/audit-logs/stats').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalLogs).toBe(100);
    expect(auditQueryService.getAuditStats).toHaveBeenCalledWith(30);
  });

  it('pasa days query param al servicio', async () => {
    auditQueryService.getAuditStats.mockResolvedValue({ totalLogs: 0, recentLogs24h: 0, byAction: [], byEntity: [], topActors: [] });

    await request(app)
      .get('/api/v1/audit-logs/stats?days=7')
      .set('Authorization', authHeader(superAdmin));

    expect(auditQueryService.getAuditStats).toHaveBeenCalledWith(7);
  });
});

describe('GET /api/v1/audit-logs/:id', () => {
  it('devuelve el detalle de un log con envelope ok', async () => {
    const mockLog = { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', entity: 'members', entityId: 'm1', action: 'create', actorUserId: 'sa-1', actorName: 'Super Admin', actorEmail: 'super@test.com', changes: null, createdAt: new Date() };
    auditQueryService.getAuditLogById.mockResolvedValue(mockLog);

    const res = await request(app).get('/api/v1/audit-logs/a1b2c3d4-e5f6-7890-abcd-ef1234567890').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('400 con UUID inválido', async () => {
    const res = await request(app).get('/api/v1/audit-logs/not-a-uuid').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('propaga NotFoundError del servicio', async () => {
    auditQueryService.getAuditLogById.mockRejectedValue(new (await import('../../src/utils/errors')).NotFoundError('No encontrado'));

    const res = await request(app).get('/api/v1/audit-logs/00000000-0000-0000-0000-000000000000').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
