import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Op } from 'sequelize';
import { ConflictError, NotFoundError } from '../../src/utils/errors';
import {
  createWeeklyMetric,
  listWeeklyMetricsByChurch,
  listWeeklyMetricsByGroup,
} from '../../src/services/metric.service';

const mocks = vi.hoisted(() => {
  const groupFindOne = vi.fn();
  const quarterFindOne = vi.fn();
  const weeklyMetricFindOne = vi.fn();
  const weeklyMetricCreate = vi.fn();
  const weeklyMetricFindAll = vi.fn();
  const invalidateDashboardCache = vi.fn();
  return {
    groupFindOne,
    quarterFindOne,
    weeklyMetricFindOne,
    weeklyMetricCreate,
    weeklyMetricFindAll,
    invalidateDashboardCache,
  };
});

vi.mock('../../src/models', () => ({
  db: {
    Group: { findOne: mocks.groupFindOne },
    Quarter: { findOne: mocks.quarterFindOne },
    WeeklyMetric: {
      findOne: mocks.weeklyMetricFindOne,
      create: mocks.weeklyMetricCreate,
      findAll: mocks.weeklyMetricFindAll,
    },
  },
}));

vi.mock('../../src/services/redis.service', () => ({
  invalidateDashboardCache: mocks.invalidateDashboardCache,
}));

interface MetricLike {
  id: string;
  group?: { id: string; name: string } | null;
  reload(opts?: unknown): Promise<MetricLike>;
}

function makeMetric(id: string, group?: { id: string; name: string }): MetricLike {
  return {
    id,
    group: group ?? null,
    async reload() {
      return this;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('metric.service', () => {
  describe('createWeeklyMetric', () => {
    it('lanza NotFoundError si el grupo no existe o no pertenece a la iglesia', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(
        createWeeklyMetric('church-1', 'user-1', {
          groupId: 'group-1',
          weekStart: '2026-02-01',
          weekEnd: '2026-02-07',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanza ConflictError si ya existe una métrica para la misma semana', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.weeklyMetricFindOne.mockResolvedValue({ id: 'metric-x' });

      await expect(
        createWeeklyMetric('church-1', 'user-1', {
          groupId: 'group-1',
          weekStart: '2026-02-01',
          weekEnd: '2026-02-07',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('crea la métrica con defaults, resuelve el trimestre vigente e invalida la caché', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.quarterFindOne.mockResolvedValue({
        id: 'q1',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      });
      mocks.weeklyMetricFindOne.mockResolvedValue(null);
      mocks.weeklyMetricCreate.mockImplementation(async () =>
        makeMetric('metric-1', { id: 'group-1', name: 'Escuela Sabática' }),
      );

      const result = await createWeeklyMetric('church-1', 'user-1', {
        groupId: 'group-1',
        weekStart: '2026-02-01',
        weekEnd: '2026-02-07',
        offerings: 500,
        notes: 'Buenas métricas',
      });

      expect(mocks.weeklyMetricCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          churchId: 'church-1',
          groupId: 'group-1',
          quarterId: 'q1',
          weekStart: '2026-02-01',
          weekEnd: '2026-02-07',
          membersPresent: 0,
          averageAttendance: 0,
          offerings: '500',
          tithes: null,
          notes: 'Buenas métricas',
          createdBy: 'user-1',
          updatedBy: 'user-1',
        }),
      );
      expect(mocks.invalidateDashboardCache).toHaveBeenCalledWith('church-1');
      expect(result.id).toBe('metric-1');
      expect(result.group?.name).toBe('Escuela Sabática');
    });

    it('deja quarterId en null cuando la semana no cae en el trimestre vigente', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.quarterFindOne.mockResolvedValue({
        id: 'q1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      mocks.weeklyMetricFindOne.mockResolvedValue(null);
      mocks.weeklyMetricCreate.mockImplementation(async () => makeMetric('metric-2'));

      await createWeeklyMetric('church-1', 'user-1', {
        groupId: 'group-1',
        weekStart: '2026-03-01',
        weekEnd: '2026-03-07',
      });

      expect(mocks.weeklyMetricCreate).toHaveBeenCalledWith(
        expect.objectContaining({ quarterId: null }),
      );
    });
  });

  describe('listWeeklyMetricsByGroup', () => {
    it('lanza NotFoundError si el grupo no pertenece a la iglesia', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(listWeeklyMetricsByGroup('church-1', 'group-1', {})).rejects.toThrow(
        NotFoundError,
      );
    });

    it('lista las métricas aplicando el filtro de trimestre', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.weeklyMetricFindAll.mockResolvedValue([{ id: 'metric-1' }]);

      const result = await listWeeklyMetricsByGroup('church-1', 'group-1', {
        quarterId: 'q1',
      });

      expect(mocks.weeklyMetricFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: 'group-1', churchId: 'church-1', quarterId: 'q1' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('no incluye quarterId cuando no se filtra por trimestre', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.weeklyMetricFindAll.mockResolvedValue([]);

      await listWeeklyMetricsByGroup('church-1', 'group-1');

      expect(mocks.weeklyMetricFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ quarterId: expect.anything() }),
        }),
      );
    });
  });

  describe('listWeeklyMetricsByChurch', () => {
    it('construye el rango de fechas con Op.gte/Op.lte y el filtro de grupo', async () => {
      mocks.weeklyMetricFindAll.mockResolvedValue([]);

      await listWeeklyMetricsByChurch('church-1', {
        from: '2026-01-01',
        to: '2026-03-31',
        groupId: 'group-1',
      });

      expect(mocks.weeklyMetricFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            churchId: 'church-1',
            groupId: 'group-1',
            weekStart: { [Op.gte]: '2026-01-01' },
            weekEnd: { [Op.lte]: '2026-03-31' },
          }),
        }),
      );
    });

    it('no aplica filtros de fecha cuando se omiten', async () => {
      mocks.weeklyMetricFindAll.mockResolvedValue([]);

      await listWeeklyMetricsByChurch('church-1');

      expect(mocks.weeklyMetricFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            weekStart: expect.anything(),
            weekEnd: expect.anything(),
          }),
        }),
      );
    });
  });
});
