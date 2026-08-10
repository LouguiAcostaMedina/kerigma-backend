import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotFoundError, ValidationError } from '../../src/utils/errors';
import {
  closeQuarterlyGoal,
  createQuarterlyGoal,
  listQuarterlyGoalsByGroup,
  listQuarterlyGoalsByQuarter,
} from '../../src/services/goal.service';

const mocks = vi.hoisted(() => {
  const quarterFindOne = vi.fn();
  const groupFindOne = vi.fn();
  const quarterlyGoalFindOne = vi.fn();
  const quarterlyGoalCreate = vi.fn();
  const quarterlyGoalFindAll = vi.fn();
  const invalidateDashboardCache = vi.fn();
  return {
    quarterFindOne,
    groupFindOne,
    quarterlyGoalFindOne,
    quarterlyGoalCreate,
    quarterlyGoalFindAll,
    invalidateDashboardCache,
  };
});

vi.mock('../../src/models', () => ({
  db: {
    Quarter: { findOne: mocks.quarterFindOne },
    Group: { findOne: mocks.groupFindOne },
    QuarterlyGoal: {
      findOne: mocks.quarterlyGoalFindOne,
      create: mocks.quarterlyGoalCreate,
      findAll: mocks.quarterlyGoalFindAll,
    },
  },
}));

vi.mock('../../src/services/redis.service', () => ({
  invalidateDashboardCache: mocks.invalidateDashboardCache,
}));

interface QuarterlyGoalLike {
  status: string;
  targetValue: string;
  currentValue: string;
  achievedValue: string | null;
  update(fields: {
    achievedValue?: string;
    currentValue?: string;
    status?: string;
    updatedBy?: string;
  }): Promise<QuarterlyGoalLike>;
  reload(opts?: unknown): Promise<QuarterlyGoalLike>;
}

function makeGoal(initial: {
  status: string;
  targetValue: string;
  currentValue?: string;
  achievedValue?: string | null;
}): QuarterlyGoalLike {
  const goal: QuarterlyGoalLike = {
    status: initial.status,
    targetValue: initial.targetValue,
    currentValue: initial.currentValue ?? '0.00',
    achievedValue: initial.achievedValue ?? null,
    update: vi.fn(async (fields) => {
      if (fields.achievedValue !== undefined) goal.achievedValue = fields.achievedValue;
      if (fields.currentValue !== undefined) goal.currentValue = fields.currentValue;
      if (fields.status !== undefined) goal.status = fields.status;
      return goal;
    }),
    async reload() {
      return this;
    },
  };
  return goal;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('goal.service', () => {
  describe('createQuarterlyGoal', () => {
    it('lanza NotFoundError si el trimestre no pertenece a la iglesia', async () => {
      mocks.quarterFindOne.mockResolvedValue(null);

      await expect(
        createQuarterlyGoal('church-1', 'user-1', {
          quarterId: 'q1',
          goalType: 'mision',
          title: '10 estudios',
          targetValue: 10,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si el grupo no pertenece a la iglesia', async () => {
      mocks.quarterFindOne.mockResolvedValue({ id: 'q1' });
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(
        createQuarterlyGoal('church-1', 'user-1', {
          quarterId: 'q1',
          groupId: 'group-1',
          goalType: 'mision',
          title: '10 estudios',
          targetValue: 10,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanza ValidationError si la fecha de inicio es posterior a la fecha límite', async () => {
      mocks.quarterFindOne.mockResolvedValue({ id: 'q1' });

      await expect(
        createQuarterlyGoal('church-1', 'user-1', {
          quarterId: 'q1',
          goalType: 'mision',
          title: '10 estudios',
          targetValue: 10,
          startDate: '2026-03-31',
          dueDate: '2026-03-01',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('crea la meta con valores por defecto e invalida la caché', async () => {
      mocks.quarterFindOne.mockResolvedValue({ id: 'q1' });
      mocks.quarterlyGoalCreate.mockImplementation(async () => makeGoal({ status: 'not_started', targetValue: '10.00' }));

      const result = await createQuarterlyGoal('church-1', 'user-1', {
        quarterId: 'q1',
        goalType: 'mision',
        title: '10 estudios',
        targetValue: 10,
      });

      expect(mocks.quarterlyGoalCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          churchId: 'church-1',
          quarterId: 'q1',
          groupId: null,
          goalType: 'mision',
          title: '10 estudios',
          targetValue: '10.00',
          currentValue: '0.00',
          achievedValue: null,
          unit: null,
          status: 'not_started',
          startDate: null,
          dueDate: null,
          createdBy: 'user-1',
          updatedBy: 'user-1',
        }),
      );
      expect(mocks.invalidateDashboardCache).toHaveBeenCalledWith('church-1');
      expect(result.status).toBe('not_started');
    });

    it('valida el grupo cuando se indica uno', async () => {
      mocks.quarterFindOne.mockResolvedValue({ id: 'q1' });
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.quarterlyGoalCreate.mockImplementation(async () => makeGoal({ status: 'not_started', targetValue: '5.00' }));

      await createQuarterlyGoal('church-1', 'user-1', {
        quarterId: 'q1',
        groupId: 'group-1',
        goalType: 'comunion',
        title: '5 visitas',
        targetValue: 5,
        unit: 'visitas',
      });

      expect(mocks.groupFindOne).toHaveBeenCalledWith({ where: { id: 'group-1', churchId: 'church-1' } });
      expect(mocks.quarterlyGoalCreate).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: 'group-1', unit: 'visitas' }),
      );
    });
  });

  describe('closeQuarterlyGoal', () => {
    it('lanza NotFoundError si la meta no existe en la iglesia', async () => {
      mocks.quarterlyGoalFindOne.mockResolvedValue(null);

      await expect(closeQuarterlyGoal('church-1', 'goal-1', 'user-1', { achievedValue: 10 })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('lanza ValidationError si la meta está cancelada', async () => {
      mocks.quarterlyGoalFindOne.mockResolvedValue(makeGoal({ status: 'cancelled', targetValue: '10.00' }));

      await expect(closeQuarterlyGoal('church-1', 'goal-1', 'user-1', { achievedValue: 10 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('marca la meta como alcanzada cuando se supera el objetivo', async () => {
      const goal = makeGoal({ status: 'in_progress', targetValue: '10.00' });
      mocks.quarterlyGoalFindOne.mockResolvedValue(goal);

      const result = await closeQuarterlyGoal('church-1', 'goal-1', 'user-1', { achievedValue: 20 });

      expect(goal.update).toHaveBeenCalledWith(
        expect.objectContaining({ achievedValue: '20.00', currentValue: '20.00', status: 'achieved' }),
      );
      expect(result.status).toBe('achieved');
      expect(result.achievedValue).toBe('20.00');
      expect(mocks.invalidateDashboardCache).toHaveBeenCalledWith('church-1');
    });

    it('marca la meta como no alcanzada cuando no se supera el objetivo', async () => {
      const goal = makeGoal({ status: 'in_progress', targetValue: '10.00' });
      mocks.quarterlyGoalFindOne.mockResolvedValue(goal);

      const result = await closeQuarterlyGoal('church-1', 'goal-1', 'user-1', { achievedValue: 5 });

      expect(goal.update).toHaveBeenCalledWith(
        expect.objectContaining({ achievedValue: '5.00', currentValue: '5.00', status: 'missed' }),
      );
      expect(result.status).toBe('missed');
    });
  });

  describe('listQuarterlyGoalsByGroup', () => {
    it('lanza NotFoundError si el grupo no pertenece a la iglesia', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(listQuarterlyGoalsByGroup('church-1', 'group-1', {})).rejects.toThrow(NotFoundError);
    });

    it('lista las metas del grupo aplicando el filtro de trimestre', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.quarterlyGoalFindAll.mockResolvedValue([{ id: 'goal-1' }]);

      const result = await listQuarterlyGoalsByGroup('church-1', 'group-1', { quarterId: 'q1' });

      expect(mocks.quarterlyGoalFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: 'group-1', churchId: 'church-1', quarterId: 'q1' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('listQuarterlyGoalsByQuarter', () => {
    it('lanza NotFoundError si el trimestre no pertenece a la iglesia', async () => {
      mocks.quarterFindOne.mockResolvedValue(null);

      await expect(listQuarterlyGoalsByQuarter('church-1', 'q1')).rejects.toThrow(NotFoundError);
    });

    it('lista las metas de un trimestre', async () => {
      mocks.quarterFindOne.mockResolvedValue({ id: 'q1' });
      mocks.quarterlyGoalFindAll.mockResolvedValue([{ id: 'goal-1' }]);

      const result = await listQuarterlyGoalsByQuarter('church-1', 'q1');

      expect(mocks.quarterlyGoalFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { quarterId: 'q1', churchId: 'church-1' } }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
