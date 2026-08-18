import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { AuthUser } from '../../src/types/auth';
import { signAccessToken } from '../../src/utils/jwt';

const dataProtectionService = vi.hoisted(() => ({
  getConsentStatus: vi.fn(),
  recordConsent: vi.fn(),
  exportMemberData: vi.fn(),
  anonymizeMemberData: vi.fn(),
  hardDeleteMember: vi.fn(),
}));

vi.mock('../../src/services/dataProtection.service', () => dataProtectionService);

const app = createApp();

function authHeader(user: AuthUser): string {
  return `Bearer ${signAccessToken(user)}`;
}

const superAdmin: AuthUser = { id: 'sa-1', email: 'super@test.com', role: 'super_admin', churchId: null, firstName: 'Super', lastName: 'Admin' };
const admin: AuthUser = { id: 'a1', email: 'admin@test.com', role: 'admin', churchId: 'c1', firstName: 'Admin', lastName: 'User' };
const director: AuthUser = { id: 'd1', email: 'director@test.com', role: 'director', churchId: 'c1', firstName: 'Director', lastName: 'User' };
const leader: AuthUser = { id: 'l1', email: 'leader@test.com', role: 'leader', churchId: 'c1', firstName: 'Leader', lastName: 'User' };

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

beforeEach(() => {
  Object.values(dataProtectionService).forEach((fn) => fn.mockReset());
});

describe('RBAC en /api/v1/data-protection', () => {
  it('GET /:memberId/consent bloquea a leader con 403', async () => {
    const res = await request(app)
      .get(`/api/v1/data-protection/${VALID_UUID}/consent`)
      .set('Authorization', authHeader(leader));
    expect(res.status).toBe(403);
    expect(dataProtectionService.getConsentStatus).not.toHaveBeenCalled();
  });

  it('GET /:memberId/consent permite a super_admin', async () => {
    dataProtectionService.getConsentStatus.mockResolvedValue({
      consentGiven: true,
      consentDate: new Date(),
      consentVersion: '1.0',
      dataRetentionStatus: 'active',
    });

    const res = await request(app)
      .get(`/api/v1/data-protection/${VALID_UUID}/consent`)
      .set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(dataProtectionService.getConsentStatus).toHaveBeenCalledOnce();
  });

  it('GET /:memberId/consent permite a director', async () => {
    dataProtectionService.getConsentStatus.mockResolvedValue({
      consentGiven: false,
      consentDate: null,
      consentVersion: null,
      dataRetentionStatus: 'active',
    });

    const res = await request(app)
      .get(`/api/v1/data-protection/${VALID_UUID}/consent`)
      .set('Authorization', authHeader(director));
    expect(res.status).toBe(200);
  });

  it('GET / 401 sin token', async () => {
    const res = await request(app).get(`/api/v1/data-protection/${VALID_UUID}/consent`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/data-protection/:memberId/consent', () => {
  it('registra consentimiento con envelope ok', async () => {
    const now = new Date();
    dataProtectionService.recordConsent.mockResolvedValue({ consentGiven: true, consentDate: now });

    const res = await request(app)
      .post(`/api/v1/data-protection/${VALID_UUID}/consent`)
      .set('Authorization', authHeader(superAdmin))
      .send({ consentGiven: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.consentGiven).toBe(true);
  });

  it('422 con payload inválido', async () => {
    const res = await request(app)
      .post(`/api/v1/data-protection/${VALID_UUID}/consent`)
      .set('Authorization', authHeader(superAdmin))
      .send({ consentGiven: 'not-a-boolean' });

    expect(res.status).toBe(422);
    expect(dataProtectionService.recordConsent).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/data-protection/:memberId/data-export', () => {
  it('exporta datos del miembro', async () => {
    const mockData = {
      personalData: { firstName: 'Juan', lastName: 'Perez', email: null, phone: null, dateOfBirth: null, gender: null, maritalStatus: null, address: null, city: null, district: null, occupation: null, education: null, emergencyContact: null },
      membershipData: { groupId: 'g1', groupName: 'Grupo A', baptized: false, baptismDate: null, conversionDate: null, spiritualStatus: 'visitor', joinDate: '2024-01-01', status: 'active', attendanceScore: null, notes: null, tags: null },
      consentData: { consentGiven: true, consentDate: new Date(), consentVersion: '1.0' },
      exportDate: new Date(),
      dataController: 'Sistema de Gestión Misionera',
    };
    dataProtectionService.exportMemberData.mockResolvedValue(mockData);

    const res = await request(app)
      .get(`/api/v1/data-protection/${VALID_UUID}/data-export`)
      .set('Authorization', authHeader(superAdmin));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.personalData.firstName).toBe('Juan');
  });
});

describe('POST /api/v1/data-protection/:memberId/anonymize', () => {
  it('anonimiza datos del miembro', async () => {
    dataProtectionService.anonymizeMemberData.mockResolvedValue({ anonymized: true, memberId: VALID_UUID });

    const res = await request(app)
      .post(`/api/v1/data-protection/${VALID_UUID}/anonymize`)
      .set('Authorization', authHeader(superAdmin));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.anonymized).toBe(true);
  });
});

describe('DELETE /api/v1/data-protection/:memberId/hard-delete', () => {
  it('solo super_admin puede hacer hard delete', async () => {
    dataProtectionService.hardDeleteMember.mockResolvedValue(undefined);

    const resAdmin = await request(app)
      .delete(`/api/v1/data-protection/${VALID_UUID}/hard-delete`)
      .set('Authorization', authHeader(admin));
    expect(resAdmin.status).toBe(403);

    const resSuper = await request(app)
      .delete(`/api/v1/data-protection/${VALID_UUID}/hard-delete`)
      .set('Authorization', authHeader(superAdmin));
    expect(resSuper.status).toBe(200);
    expect(dataProtectionService.hardDeleteMember).toHaveBeenCalledOnce();
  });
});

describe('Validación de UUID en data-protection', () => {
  it('422 con memberId inválido', async () => {
    const res = await request(app)
      .get('/api/v1/data-protection/not-a-uuid/consent')
      .set('Authorization', authHeader(superAdmin));
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
