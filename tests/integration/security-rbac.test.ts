import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { AuthUser } from '../../src/types/auth';
import { signAccessToken } from '../../src/utils/jwt';

const dashboardService = vi.hoisted(() => ({
  getSpiritualHealth: vi.fn(),
  getDashboardKpis: vi.fn(),
  getGlobalSpiritualHealth: vi.fn(),
  getGlobalDashboardKpis: vi.fn(),
}));

vi.mock('../../src/services/dashboard.service', () => dashboardService);

const app = createApp();

function user(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: 'user-1',
    email: 'user@test.com',
    role: 'leader',
    churchId: 'church-a',
    firstName: 'Ana',
    lastName: 'Pérez',
    ...overrides,
  };
}

const leaderChurchA = user({ id: 'leader-a', email: 'leader@iglesia-a.com', role: 'leader', churchId: 'church-a' });
const directorChurchB = user({
  id: 'dir-b',
  email: 'director@iglesia-b.com',
  role: 'director',
  churchId: 'church-b',
});
const leaderNoChurch = user({ id: 'leader-x', email: 'leader@siniglesia.com', role: 'leader', churchId: null });
const readerNoChurch = user({ id: 'reader-x', email: 'reader@siniglesia.com', role: 'reader', churchId: null });
const superAdminGlobal = user({ id: 'sa-1', email: 'super@global.com', role: 'super_admin', churchId: null });
const superAdminWithChurch = user({ id: 'sa-2', email: 'super2@global.com', role: 'super_admin', churchId: 'church-c' });
const legacyAdminNoChurch = user({ id: 'adm-1', email: 'admin@global.com', role: 'admin', churchId: null });

function authHeader(u: AuthUser): string {
  return `Bearer ${signAccessToken(u)}`;
}

beforeEach(() => {
  dashboardService.getSpiritualHealth.mockReset();
  dashboardService.getDashboardKpis.mockReset();
  dashboardService.getGlobalSpiritualHealth.mockReset();
  dashboardService.getGlobalDashboardKpis.mockReset();

  dashboardService.getSpiritualHealth.mockResolvedValue({ churchId: 'church-a', pillars: {}, goals: [] });
  dashboardService.getDashboardKpis.mockResolvedValue({ churchId: 'church-a', totalMembers: 0 });
  dashboardService.getGlobalSpiritualHealth.mockResolvedValue({ churchId: '__global__', pillars: {}, goals: [] });
  dashboardService.getGlobalDashboardKpis.mockResolvedValue({ churchId: '__global__', totalMembers: 0 });
});

describe('PENTEST: RBAC en /api/v1/dashboard (alcance por churchId del JWT)', () => {
  it('un leader accede solo a los datos de su propia iglesia', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/spiritual-health')
      .set('Authorization', authHeader(leaderChurchA));

    expect(res.status).toBe(200);
    expect(dashboardService.getSpiritualHealth).toHaveBeenCalledWith('church-a');
    expect(dashboardService.getGlobalSpiritualHealth).not.toHaveBeenCalled();
  });

  it('un director accede con su propio churchId (no el de otro)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/kpis')
      .set('Authorization', authHeader(directorChurchB));

    expect(res.status).toBe(200);
    expect(dashboardService.getDashboardKpis).toHaveBeenCalledWith('church-b');
    expect(dashboardService.getDashboardKpis).not.toHaveBeenCalledWith('church-a');
  });

  it('IDOR: un leader NO puede forzar churchId ajeno vía query param', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/spiritual-health?churchId=church-b')
      .set('Authorization', authHeader(leaderChurchA));

    expect(res.status).toBe(200);
    expect(dashboardService.getSpiritualHealth).toHaveBeenCalledWith('church-a');
    expect(dashboardService.getSpiritualHealth).not.toHaveBeenCalledWith('church-b');
  });

  it('un leader sin iglesia asignada recibe 403 (sin acceso global)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/kpis')
      .set('Authorization', authHeader(leaderNoChurch));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(dashboardService.getDashboardKpis).not.toHaveBeenCalled();
    expect(dashboardService.getGlobalDashboardKpis).not.toHaveBeenCalled();
  });

  it('un reader sin iglesia asignada recibe 403', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/spiritual-health')
      .set('Authorization', authHeader(readerNoChurch));

    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN accede al dashboard global en ambos endpoints', async () => {
    const resHealth = await request(app)
      .get('/api/v1/dashboard/spiritual-health')
      .set('Authorization', authHeader(superAdminGlobal));
    expect(resHealth.status).toBe(200);
    expect(dashboardService.getGlobalSpiritualHealth).toHaveBeenCalledTimes(1);

    const resKpis = await request(app)
      .get('/api/v1/dashboard/kpis')
      .set('Authorization', authHeader(superAdminGlobal));
    expect(resKpis.status).toBe(200);
    expect(dashboardService.getGlobalDashboardKpis).toHaveBeenCalledTimes(1);
  });

  it('SUPER_ADMIN conserva acceso global aunque tenga churchId asignado', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/kpis')
      .set('Authorization', authHeader(superAdminWithChurch));

    expect(res.status).toBe(200);
    expect(dashboardService.getGlobalDashboardKpis).toHaveBeenCalled();
    expect(dashboardService.getDashboardKpis).not.toHaveBeenCalled();
  });

  it('fallback: admin sin iglesia (dato heredado) conserva acceso global', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/spiritual-health')
      .set('Authorization', authHeader(legacyAdminNoChurch));

    expect(res.status).toBe(200);
    expect(dashboardService.getGlobalSpiritualHealth).toHaveBeenCalled();
  });

  it('petición sin token devuelve 401', async () => {
    const res = await request(app).get('/api/v1/dashboard/kpis');
    expect(res.status).toBe(401);
  });
});
