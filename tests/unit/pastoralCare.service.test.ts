import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrayerRequest = {
  id: 'pr1',
  churchId: 'c1',
  memberId: 'mem1',
  requesterName: 'María López',
  requesterPhone: '+51999999999',
  requesterEmail: 'maria@test.com',
  subject: 'Oración por salud',
  description: 'Necesito oración para mi familia',
  priority: 'normal' as const,
  status: 'pending' as const,
  assignedTo: 'u1',
  assignee: { firstName: 'Pedro', lastName: 'Ruiz' },
  resolutionNotes: null,
  resolvedAt: null,
  isAnonymous: false,
  isPublic: false,
  createdBy: 'u1',
  createdAt: new Date('2024-01-01'),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockPastoralVisit = {
  id: 'pv1',
  churchId: 'c1',
  memberId: 'mem1',
  visitorName: 'María López',
  visitDate: new Date('2024-03-01'),
  visitType: 'home',
  reason: 'Visita de consuelo',
  notes: 'Visitó a la familia',
  outcome: 'Positivo',
  followUpNeeded: false,
  followUpDate: null,
  followUpNotes: null,
  prayerRequestId: 'pr1',
  conductedBy: 'u1',
  conductor: { firstName: 'Pedro', lastName: 'Ruiz' },
  createdBy: 'u1',
  createdAt: new Date('2024-03-01'),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockDb = vi.hoisted(() => ({
  PrayerRequest: {
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
    count: vi.fn(),
    findOne: vi.fn(),
  },
  PastoralVisit: {
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
    count: vi.fn(),
  },
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../src/models', () => ({ db: mockDb }));

import * as pastoralCareService from '../../src/services/pastoralCare.service';

describe('pastoralCare.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrayerRequest.update.mockReset();
    mockPrayerRequest.destroy.mockReset();
    mockPastoralVisit.update.mockReset();
    mockPastoralVisit.destroy.mockReset();
  });

  describe('listPrayerRequests', () => {
    it('returns paginated results', async () => {
      mockDb.PrayerRequest.findAndCountAll.mockResolvedValue({
        rows: [mockPrayerRequest],
        count: 1,
      });
      mockDb.PastoralVisit.count.mockResolvedValue(2);

      const result = await pastoralCareService.listPrayerRequests('c1', {
        page: 1,
        limit: 10,
      });

      expect(result.prayerRequests).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.prayerRequests[0].subject).toBe('Oración por salud');
      expect(result.prayerRequests[0].visitCount).toBe(2);
    });
  });

  describe('getPrayerRequest', () => {
    it('returns by id', async () => {
      mockDb.PrayerRequest.findByPk.mockResolvedValue(mockPrayerRequest);
      mockDb.PastoralVisit.count.mockResolvedValue(1);

      const result = await pastoralCareService.getPrayerRequest('pr1');

      expect(result.id).toBe('pr1');
      expect(result.requesterName).toBe('María López');
    });

    it('throws NotFoundError', async () => {
      mockDb.PrayerRequest.findByPk.mockResolvedValue(null);

      await expect(pastoralCareService.getPrayerRequest('nonexistent'))
        .rejects.toThrow('Solicitud de oración no encontrada');
    });
  });

  describe('createPrayerRequest', () => {
    it('creates with default priority normal and status pending', async () => {
      mockDb.PrayerRequest.create.mockResolvedValue(mockPrayerRequest);
      mockDb.PrayerRequest.findByPk.mockResolvedValue(mockPrayerRequest);
      mockDb.PastoralVisit.count.mockResolvedValue(0);

      const result = await pastoralCareService.createPrayerRequest('c1', 'u1', {
        requesterName: 'María López',
        subject: 'Oración por salud',
        description: 'Necesito oración',
      });

      expect(result.subject).toBe('Oración por salud');
      expect(mockDb.PrayerRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'normal',
          status: 'pending',
        }),
      );
    });
  });

  describe('updatePrayerRequest', () => {
    it('updates fields', async () => {
      const fresh = { ...mockPrayerRequest };
      mockDb.PrayerRequest.findByPk
        .mockResolvedValueOnce(fresh)
        .mockResolvedValueOnce({ ...fresh, subject: 'Oración actualizada' });
      mockDb.PastoralVisit.count.mockResolvedValue(0);

      const result = await pastoralCareService.updatePrayerRequest('pr1', {
        subject: 'Oración actualizada',
      });

      expect(fresh.update).toHaveBeenCalled();
      expect(result.subject).toBe('Oración actualizada');
    });
  });

  describe('deletePrayerRequest', () => {
    it('deletes', async () => {
      mockDb.PrayerRequest.findByPk.mockResolvedValue({ ...mockPrayerRequest });

      await pastoralCareService.deletePrayerRequest('pr1');

      expect(mockPrayerRequest.destroy).toHaveBeenCalled();
    });
  });

  describe('updatePrayerRequestStatus', () => {
    it('sets status and resolvedAt for answered', async () => {
      mockDb.PrayerRequest.findByPk.mockResolvedValue({ ...mockPrayerRequest });
      mockDb.PastoralVisit.count.mockResolvedValue(0);

      await pastoralCareService.updatePrayerRequestStatus('pr1', 'answered', 'Resuelto');

      expect(mockPrayerRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'answered',
          resolvedAt: expect.any(Date),
          resolutionNotes: 'Resuelto',
        }),
      );
    });
  });

  describe('listPastoralVisits', () => {
    it('returns paginated visits', async () => {
      mockDb.PastoralVisit.findAndCountAll.mockResolvedValue({
        rows: [mockPastoralVisit],
        count: 1,
      });

      const result = await pastoralCareService.listPastoralVisits('c1', {
        page: 1,
        limit: 10,
      });

      expect(result.pastoralVisits).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('createPastoralVisit', () => {
    it('creates visit', async () => {
      mockDb.User.findOne.mockResolvedValue({ id: 'u1' });
      mockDb.PastoralVisit.create.mockResolvedValue(mockPastoralVisit);
      mockDb.PastoralVisit.findByPk.mockResolvedValue(mockPastoralVisit);

      const result = await pastoralCareService.createPastoralVisit('c1', 'u1', {
        visitorName: 'María López',
        visitDate: new Date('2024-03-01'),
        visitType: 'home',
        reason: 'Visita de consuelo',
        conductedBy: 'u1',
      });

      expect(result.visitorName).toBe('María López');
    });

    it('throws if conductor not in church', async () => {
      mockDb.User.findOne.mockResolvedValue(null);

      await expect(pastoralCareService.createPastoralVisit('c1', 'u1', {
        visitorName: 'María López',
        visitDate: new Date('2024-03-01'),
        visitType: 'home',
        reason: 'Visita',
        conductedBy: 'unknown',
      })).rejects.toThrow('El usuario que conducting no pertenece a su iglesia');
    });
  });
});
