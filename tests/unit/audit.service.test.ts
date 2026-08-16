import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordAudit, recordAuditAsync, sanitizeChanges } from '../../src/services/audit.service';

const models = vi.hoisted(() => ({
  AuditLog: { create: vi.fn() },
}));

vi.mock('../../src/models', () => ({ db: { AuditLog: models.AuditLog } }));

describe('audit.service', () => {
  beforeEach(() => {
    models.AuditLog.create.mockReset();
  });

  describe('sanitizeChanges', () => {
    it('elimina campos sensibles antes de persistir', () => {
      const result = sanitizeChanges({
        name: 'Juan',
        password: 'secreta',
        newPassword: 'otra',
        token: 'abc',
        city: 'Lima',
      });
      expect(result).toEqual({ name: 'Juan', city: 'Lima' });
    });

    it('devuelve null si no hay cambios', () => {
      expect(sanitizeChanges(null)).toBeNull();
      expect(sanitizeChanges(undefined)).toBeNull();
      expect(sanitizeChanges({})).toEqual({});
    });
  });

  describe('recordAudit', () => {
    it('persiste el evento en AuditLogs', async () => {
      models.AuditLog.create.mockResolvedValue({});
      await recordAudit({
        actorUserId: 'u1',
        entity: 'members',
        entityId: 'm1',
        action: 'update',
        changes: { city: 'Lima' },
      });
      expect(models.AuditLog.create).toHaveBeenCalledWith({
        actorUserId: 'u1',
        entity: 'members',
        entityId: 'm1',
        action: 'update',
        changes: { city: 'Lima' },
      });
    });

    it('no lanza errores si la persistencia falla', async () => {
      models.AuditLog.create.mockRejectedValue(new Error('db down'));
      await expect(
        recordAudit({ actorUserId: 'u1', entity: 'users', entityId: 'u2', action: 'delete' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('recordAuditAsync', () => {
    it('dispara el registro sin bloquear', async () => {
      models.AuditLog.create.mockResolvedValue({});
      recordAuditAsync({ actorUserId: 'u1', entity: 'groups', entityId: 'g1', action: 'create' });
      await vi.waitFor(() => expect(models.AuditLog.create).toHaveBeenCalledTimes(1));
    });
  });
});
