import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { AuthUser } from '../../src/types/auth';
import { signAccessToken } from '../../src/utils/jwt';

const activityService = vi.hoisted(() => ({
  listActivities: vi.fn(),
  getActivity: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
}));

vi.mock('../../src/services/activity.service', () => activityService);

const app = createApp();

function authHeader(user: AuthUser): string {
  return `Bearer ${signAccessToken(user)}`;
}

const superAdmin: AuthUser = { id: 'sa-1', email: 'super@test.com', role: 'super_admin', churchId: null, firstName: 'Super', lastName: 'Admin' };
const admin: AuthUser = { id: 'a1', email: 'admin@test.com', role: 'admin', churchId: 'c1', firstName: 'Admin', lastName: 'User' };
const director: AuthUser = { id: 'd1', email: 'director@test.com', role: 'director', churchId: 'c1', firstName: 'Director', lastName: 'User' };
const leader: AuthUser = { id: 'l1', email: 'leader@test.com', role: 'leader', churchId: 'c1', firstName: 'Leader', lastName: 'User' };
const unauthed: AuthUser = { id: 'u1', email: 'user@test.com', role: 'reader', churchId: 'c1', firstName: 'Reader', lastName: 'User' };

beforeEach(() => {
  activityService.listActivities.mockReset();
  activityService.getActivity.mockReset();
  activityService.createActivity.mockReset();
  activityService.updateActivity.mockReset();
  activityService.deleteActivity.mockReset();
});

describe('GET /api/v1/activities', () => {
  it('rechaza sin token con 401', async () => {
    const res = await request(app).get('/api/v1/activities');
    expect(res.status).toBe(401);
  });

  it('permite a super_admin y retorna paginated envelope', async () => {
    activityService.listActivities.mockResolvedValue({ activities: [], total: 0 });
    const res = await request(app).get('/api/v1/activities').set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('currentPage');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('total');
    expect(activityService.listActivities).toHaveBeenCalledOnce();
  });

  it('permite a admin', async () => {
    activityService.listActivities.mockResolvedValue({ activities: [], total: 0 });
    const res = await request(app).get('/api/v1/activities').set('Authorization', authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(activityService.listActivities).toHaveBeenCalledOnce();
  });

  it('permite a director', async () => {
    activityService.listActivities.mockResolvedValue({ activities: [], total: 0 });
    const res = await request(app).get('/api/v1/activities').set('Authorization', authHeader(director));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('permite a leader', async () => {
    activityService.listActivities.mockResolvedValue({ activities: [], total: 0 });
    const res = await request(app).get('/api/v1/activities').set('Authorization', authHeader(leader));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('retorna datos reales del servicio', async () => {
    const mockActivity = {
      id: 'act-1',
      churchId: 'c1',
      groupId: 'g1',
      groupName: 'Grupo Juventud',
      title: 'Culto de Oración',
      description: 'Reunión semanal de oración',
      eventType: 'worship' as const,
      startDate: new Date('2026-08-20T18:00:00Z'),
      endDate: new Date('2026-08-20T20:00:00Z'),
      location: 'Templo Central',
      recurrence: 'weekly' as const,
      isActive: true,
      createdBy: 'u1',
      creatorName: 'Admin User',
      createdAt: new Date('2026-08-17T10:00:00Z'),
    };
    activityService.listActivities.mockResolvedValue({ activities: [mockActivity], total: 1 });

    const res = await request(app).get('/api/v1/activities').set('Authorization', authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Culto de Oración');
    expect(res.body.total).toBe(1);
  });
});

describe('GET /api/v1/activities/:id', () => {
  it('retorna actividad por ID', async () => {
    const mockActivity = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      churchId: 'c1',
      groupId: null,
      groupName: null,
      title: 'Retiro Espiritual',
      description: null,
      eventType: 'social' as const,
      startDate: new Date('2026-09-01T08:00:00Z'),
      endDate: null,
      location: null,
      recurrence: 'none' as const,
      isActive: true,
      createdBy: 'u1',
      creatorName: 'Admin User',
      createdAt: new Date('2026-08-17T10:00:00Z'),
    };
    activityService.getActivity.mockResolvedValue(mockActivity);

    const res = await request(app).get(`/api/v1/activities/${mockActivity.id}`).set('Authorization', authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Retiro Espiritual');
    expect(activityService.getActivity).toHaveBeenCalledOnce();
  });

  it('rechaza ID no UUID con 422', async () => {
    const res = await request(app).get('/api/v1/activities/not-a-uuid').set('Authorization', authHeader(admin));
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/activities', () => {
  it('crea actividad con datos válidos', async () => {
    const created = {
      id: 'act-2',
      churchId: 'c1',
      groupId: null,
      groupName: null,
      title: 'Estudio Bíblico',
      description: 'Estudio del libro de Romanos',
      eventType: 'study' as const,
      startDate: new Date('2026-08-25T19:00:00Z'),
      endDate: null,
      location: 'Sala 2',
      recurrence: 'none' as const,
      isActive: true,
      createdBy: 'd1',
      creatorName: 'Director User',
      createdAt: new Date(),
    };
    activityService.createActivity.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', authHeader(director))
      .send({
        title: 'Estudio Bíblico',
        eventType: 'study',
        startDate: '2026-08-25T19:00:00Z',
        description: 'Estudio del libro de Romanos',
        location: 'Sala 2',
        recurrence: 'none',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Estudio Bíblico');
    expect(activityService.createActivity).toHaveBeenCalledOnce();
  });

  it('rechaza body inválido', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', authHeader(director))
      .send({ title: '' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(activityService.createActivity).not.toHaveBeenCalled();
  });
});
