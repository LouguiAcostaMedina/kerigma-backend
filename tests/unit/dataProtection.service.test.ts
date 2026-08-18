import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMember = {
  id: 'm1',
  firstName: 'Juan',
  lastName: 'Perez',
  email: 'juan@test.com',
  phone: '+51999999999',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  maritalStatus: 'married',
  address: 'Av. Principal 123',
  city: 'Lima',
  district: 'San Isidro',
  occupation: 'Ingeniero',
  education: 'university',
  emergencyContact: { name: 'Maria', phone: '+51888888888' },
  groupId: 'g1',
  group: { id: 'g1', name: 'Grupo A' },
  baptized: true,
  baptismDate: '2020-01-01',
  conversionDate: '2019-01-01',
  spiritualStatus: 'mature',
  joinDate: '2020-01-01',
  status: 'active',
  attendanceScore: 90,
  notes: 'Test notes',
  tags: ['test'],
  consentGiven: true,
  consentDate: new Date('2024-01-01'),
  consentVersion: '1.0',
  consentIp: '127.0.0.1',
  dataRetentionStatus: 'active',
  isActive: true,
  update: vi.fn(),
  destroy: vi.fn(),
  toJSON() {
    return { ...this };
  },
};

const mockDb = vi.hoisted(() => ({
  Member: {
    findByPk: vi.fn(),
  },
}));

vi.mock('../../src/models', () => ({ db: mockDb }));

import * as dataProtectionService from '../../src/services/dataProtection.service';

describe('dataProtection.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMember.update.mockReset();
    mockMember.destroy.mockReset();
  });

  describe('exportMemberData', () => {
    it('exporta todos los datos personales del miembro', async () => {
      mockDb.Member.findByPk.mockResolvedValue(mockMember);

      const result = await dataProtectionService.exportMemberData('m1');

      expect(result.personalData.firstName).toBe('Juan');
      expect(result.personalData.lastName).toBe('Perez');
      expect(result.membershipData.groupName).toBe('Grupo A');
      expect(result.consentData.consentGiven).toBe(true);
      expect(result.dataController).toBe('Sistema de Gestión Misionera');
    });

    it('lanza NotFoundError si el miembro no existe', async () => {
      mockDb.Member.findByPk.mockResolvedValue(null);

      await expect(dataProtectionService.exportMemberData('nonexistent'))
        .rejects.toThrow('Miembro no encontrado');
    });

    it('lanza ValidationError si ya fue anonimizado', async () => {
      mockDb.Member.findByPk.mockResolvedValue({ ...mockMember, dataRetentionStatus: 'anonymized' });

      await expect(dataProtectionService.exportMemberData('m1'))
        .rejects.toThrow('ya han sido anonimizados');
    });
  });

  describe('anonymizeMemberData', () => {
    it('anonimiza todos los campos personales', async () => {
      mockDb.Member.findByPk.mockResolvedValue({ ...mockMember });

      const result = await dataProtectionService.anonymizeMemberData('m1');

      expect(result.anonymized).toBe(true);
      expect(mockMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'ELIMINADO',
          lastName: 'ELIMINADO',
          dataRetentionStatus: 'anonymized',
          isActive: false,
        }),
      );
    });

    it('lanza ValidationError si ya está anonimizado', async () => {
      mockDb.Member.findByPk.mockResolvedValue({ ...mockMember, dataRetentionStatus: 'anonymized' });

      await expect(dataProtectionService.anonymizeMemberData('m1'))
        .rejects.toThrow('ya han sido anonimizados');
    });
  });

  describe('recordConsent', () => {
    it('registra consentimiento con IP', async () => {
      mockDb.Member.findByPk.mockResolvedValue({ ...mockMember });

      const result = await dataProtectionService.recordConsent('m1', true, '127.0.0.1');

      expect(result.consentGiven).toBe(true);
      expect(result.consentDate).toBeInstanceOf(Date);
      expect(mockMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          consentGiven: true,
          consentIp: '127.0.0.1',
          consentVersion: '1.0',
        }),
      );
    });

    it('lanza NotFoundError si el miembro no existe', async () => {
      mockDb.Member.findByPk.mockResolvedValue(null);

      await expect(dataProtectionService.recordConsent('nonexistent', true, null))
        .rejects.toThrow('Miembro no encontrado');
    });
  });

  describe('getConsentStatus', () => {
    it('retorna el estado de consentimiento', async () => {
      mockDb.Member.findByPk.mockResolvedValue({
        consentGiven: true,
        consentDate: new Date(),
        consentVersion: '1.0',
        dataRetentionStatus: 'active',
      });

      const result = await dataProtectionService.getConsentStatus('m1');

      expect(result.consentGiven).toBe(true);
      expect(result.dataRetentionStatus).toBe('active');
    });
  });
});
