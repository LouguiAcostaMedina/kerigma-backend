import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMinistry = {
  id: 'm1',
  churchId: 'c1',
  name: 'Ministerio de Jóvenes',
  description: 'Jóvenes activos',
  category: 'youth',
  leaderId: 'u1',
  leader: { firstName: 'Carlos', lastName: 'García' },
  meetingSchedule: 'Viernes 7pm',
  isActive: true,
  createdBy: 'u1',
  createdAt: new Date('2024-01-01'),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockAssignment = {
  id: 'ma1',
  ministryId: 'm1',
  memberId: 'mem1',
  member: { firstName: 'Juan', lastName: 'Pérez' },
  role: 'Líder',
  startDate: new Date('2024-01-01'),
  endDate: null,
  notes: null,
  isActive: true,
  createdBy: 'u1',
  createdAt: new Date('2024-01-01'),
  update: vi.fn(),
};

const mockDb = vi.hoisted(() => ({
  Ministry: {
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    destroy: vi.fn(),
  },
  MinistryAssignment: {
    count: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
  },
  User: {
    findOne: vi.fn(),
  },
  Member: {
    findByPk: vi.fn(),
  },
}));

vi.mock('../../src/models', () => ({ db: mockDb }));

import * as ministryService from '../../src/services/ministry.service';

describe('ministry.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMinistry.update.mockReset();
    mockMinistry.destroy.mockReset();
    mockAssignment.update.mockReset();
  });

  describe('listMinistries', () => {
    it('returns paginated ministries with assignmentCount', async () => {
      mockDb.Ministry.findAndCountAll.mockResolvedValue({
        rows: [mockMinistry],
        count: 1,
      });
      mockDb.MinistryAssignment.count.mockResolvedValue(5);

      const result = await ministryService.listMinistries('c1', {
        page: 1,
        limit: 10,
      });

      expect(result.ministries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.ministries[0].assignmentCount).toBe(5);
      expect(result.ministries[0].name).toBe('Ministerio de Jóvenes');
      expect(result.ministries[0].leaderName).toBe('Carlos García');
    });
  });

  describe('getMinistry', () => {
    it('returns ministry by id', async () => {
      mockDb.Ministry.findByPk.mockResolvedValue(mockMinistry);
      mockDb.MinistryAssignment.count.mockResolvedValue(3);

      const result = await ministryService.getMinistry('m1');

      expect(result.id).toBe('m1');
      expect(result.assignmentCount).toBe(3);
    });

    it('throws NotFoundError', async () => {
      mockDb.Ministry.findByPk.mockResolvedValue(null);

      await expect(ministryService.getMinistry('nonexistent'))
        .rejects.toThrow('Ministerio no encontrado');
    });
  });

  describe('createMinistry', () => {
    it('creates and returns ministry', async () => {
      mockDb.Ministry.create.mockResolvedValue(mockMinistry);
      mockDb.Ministry.findByPk.mockResolvedValue(mockMinistry);
      mockDb.MinistryAssignment.count.mockResolvedValue(0);

      const result = await ministryService.createMinistry('c1', 'u1', {
        name: 'Ministerio de Jóvenes',
        category: 'youth',
      });

      expect(result.name).toBe('Ministerio de Jóvenes');
      expect(mockDb.Ministry.create).toHaveBeenCalled();
    });

    it('throws NotFoundError if leader not in church', async () => {
      mockDb.User.findOne.mockResolvedValue(null);

      await expect(ministryService.createMinistry('c1', 'u1', {
        name: 'Ministerio',
        category: 'youth',
        leaderId: 'unknown',
      })).rejects.toThrow('El líder indicado no pertenece a su iglesia');
    });
  });

  describe('deleteMinistry', () => {
    it('deletes when no assignments', async () => {
      mockDb.Ministry.findByPk.mockResolvedValue({ ...mockMinistry });
      mockDb.MinistryAssignment.count.mockResolvedValue(0);

      await ministryService.deleteMinistry('m1');

      expect(mockMinistry.destroy).toHaveBeenCalled();
    });

    it('throws ValidationError when has assignments', async () => {
      mockDb.Ministry.findByPk.mockResolvedValue({ ...mockMinistry });
      mockDb.MinistryAssignment.count.mockResolvedValue(2);

      await expect(ministryService.deleteMinistry('m1'))
        .rejects.toThrow('No se puede eliminar un ministerio que tiene asignaciones activas');
    });
  });

  describe('assignMember', () => {
    it('creates assignment', async () => {
      mockDb.Ministry.findByPk.mockResolvedValue(mockMinistry);
      mockDb.Member.findByPk.mockResolvedValue({ id: 'mem1' });
      mockDb.MinistryAssignment.findOne.mockResolvedValue(null);
      mockDb.MinistryAssignment.create.mockResolvedValue(mockAssignment);
      mockDb.MinistryAssignment.findByPk.mockResolvedValue(mockAssignment);

      const result = await ministryService.assignMember('m1', 'mem1', 'Líder', 'u1');

      expect(result.role).toBe('Líder');
      expect(mockDb.MinistryAssignment.create).toHaveBeenCalled();
    });

    it('throws if member already assigned', async () => {
      mockDb.Ministry.findByPk.mockResolvedValue(mockMinistry);
      mockDb.Member.findByPk.mockResolvedValue({ id: 'mem1' });
      mockDb.MinistryAssignment.findOne.mockResolvedValue(mockAssignment);

      await expect(ministryService.assignMember('m1', 'mem1', 'Líder', 'u1'))
        .rejects.toThrow('El miembro ya está asignado a este ministerio');
    });
  });

  describe('removeAssignment', () => {
    it('soft-deactivates assignment', async () => {
      mockDb.MinistryAssignment.findByPk.mockResolvedValue({ ...mockAssignment });

      await ministryService.removeAssignment('ma1');

      expect(mockAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('listAssignments', () => {
    it('returns active assignments', async () => {
      mockDb.MinistryAssignment.findAll.mockResolvedValue([mockAssignment]);

      const result = await ministryService.listAssignments('m1');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('Líder');
    });
  });
});
