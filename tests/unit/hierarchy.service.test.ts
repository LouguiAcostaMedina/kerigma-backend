import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAssociation = {
  id: 'a1',
  name: 'Asociación Centro',
  code: 'AC01',
  description: 'Asociación principal',
  country: 'Perú',
  territory: 'Lima',
  presidentId: 'u1',
  phone: '+51999999999',
  email: 'ac@test.com',
  address: 'Av. Principal 123',
  isActive: true,
  createdBy: 'u1',
  createdAt: new Date('2024-01-01'),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockDistrict = {
  id: 'd1',
  associationId: 'a1',
  name: 'Distrito Norte',
  code: 'DN01',
  description: 'Distrito norte',
  territory: 'Norte',
  directorId: 'u2',
  phone: '+51888888888',
  email: 'dn@test.com',
  isActive: true,
  createdBy: 'u1',
  createdAt: new Date('2024-02-01'),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockDb = vi.hoisted(() => ({
  Association: {
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    destroy: vi.fn(),
  },
  District: {
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock('../../src/models', () => ({ db: mockDb }));

import * as hierarchyService from '../../src/services/hierarchy.service';

describe('hierarchy.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssociation.update.mockReset();
    mockAssociation.destroy.mockReset();
    mockDistrict.update.mockReset();
    mockDistrict.destroy.mockReset();
  });

  describe('listAssociations', () => {
    it('returns paginated associations with districtCount', async () => {
      mockDb.Association.findAndCountAll.mockResolvedValue({
        rows: [mockAssociation],
        count: 1,
      });
      mockDb.District.count.mockResolvedValue(3);

      const result = await hierarchyService.listAssociations({
        page: 1,
        limit: 10,
      });

      expect(result.associations).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.associations[0].districtCount).toBe(3);
      expect(result.associations[0].name).toBe('Asociación Centro');
    });
  });

  describe('getAssociation', () => {
    it('returns association by id', async () => {
      mockDb.Association.findByPk.mockResolvedValue(mockAssociation);
      mockDb.District.count.mockResolvedValue(2);

      const result = await hierarchyService.getAssociation('a1');

      expect(result.id).toBe('a1');
      expect(result.districtCount).toBe(2);
    });

    it('throws NotFoundError for nonexistent id', async () => {
      mockDb.Association.findByPk.mockResolvedValue(null);

      await expect(hierarchyService.getAssociation('nonexistent'))
        .rejects.toThrow('Asociación no encontrada');
    });
  });

  describe('createAssociation', () => {
    it('creates and returns association', async () => {
      mockDb.Association.create.mockResolvedValue(mockAssociation);
      mockDb.Association.findByPk.mockResolvedValue(mockAssociation);
      mockDb.District.count.mockResolvedValue(0);

      const result = await hierarchyService.createAssociation('u1', {
        name: 'Asociación Centro',
        country: 'Perú',
      });

      expect(result.name).toBe('Asociación Centro');
      expect(mockDb.Association.create).toHaveBeenCalled();
    });
  });

  describe('updateAssociation', () => {
    it('updates and returns association', async () => {
      const fresh = { ...mockAssociation };
      mockDb.Association.findByPk
        .mockResolvedValueOnce(fresh)
        .mockResolvedValueOnce({ ...fresh, name: 'Asociación Actualizada' });
      mockDb.District.count.mockResolvedValue(0);

      const result = await hierarchyService.updateAssociation('a1', {
        name: 'Asociación Actualizada',
      });

      expect(fresh.update).toHaveBeenCalled();
      expect(result.name).toBe('Asociación Actualizada');
    });
  });

  describe('deleteAssociation', () => {
    it('deletes when no districts', async () => {
      mockDb.Association.findByPk.mockResolvedValue({ ...mockAssociation });
      mockDb.District.count.mockResolvedValue(0);

      await hierarchyService.deleteAssociation('a1');

      expect(mockAssociation.destroy).toHaveBeenCalled();
    });

    it('throws ForbiddenError when has districts', async () => {
      mockDb.Association.findByPk.mockResolvedValue({ ...mockAssociation });
      mockDb.District.count.mockResolvedValue(3);

      await expect(hierarchyService.deleteAssociation('a1'))
        .rejects.toThrow('No se puede eliminar una asociación que tiene distritos');
    });
  });

  describe('listDistricts', () => {
    it('returns paginated districts for an association', async () => {
      mockDb.District.findAndCountAll.mockResolvedValue({
        rows: [mockDistrict],
        count: 1,
      });

      const result = await hierarchyService.listDistricts('a1', {
        page: 1,
        limit: 10,
      });

      expect(result.districts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.districts[0].associationId).toBe('a1');
    });
  });

  describe('getDistrict', () => {
    it('returns district by id', async () => {
      mockDb.District.findByPk.mockResolvedValue(mockDistrict);

      const result = await hierarchyService.getDistrict('d1');

      expect(result.id).toBe('d1');
      expect(result.name).toBe('Distrito Norte');
    });
  });

  describe('createDistrict', () => {
    it('creates when association exists', async () => {
      mockDb.Association.findByPk.mockResolvedValue(mockAssociation);
      mockDb.District.create.mockResolvedValue(mockDistrict);
      mockDb.District.findByPk.mockResolvedValue(mockDistrict);

      const result = await hierarchyService.createDistrict('u1', {
        associationId: 'a1',
        name: 'Distrito Norte',
      });

      expect(result.name).toBe('Distrito Norte');
      expect(mockDb.District.create).toHaveBeenCalled();
    });

    it('throws NotFoundError when association does not exist', async () => {
      mockDb.Association.findByPk.mockResolvedValue(null);

      await expect(hierarchyService.createDistrict('u1', {
        associationId: 'nonexistent',
        name: 'Distrito Norte',
      })).rejects.toThrow('Asociación no encontrada');
    });
  });
});
