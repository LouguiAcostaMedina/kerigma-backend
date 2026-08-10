import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotFoundError, ValidationError } from '../../src/utils/errors';
import {
  checkinPublic,
  getCheckinPageData,
  listAttendanceByGroup,
  recordBulkAttendance,
} from '../../src/services/attendance.service';

const mocks = vi.hoisted(() => {
  const groupFindOne = vi.fn();
  const memberFindAll = vi.fn();
  const memberFindOne = vi.fn();
  const attendanceRecordFindOrCreate = vi.fn();
  const attendanceRecordFindAll = vi.fn();
  const invalidateDashboardCache = vi.fn();
  return {
    groupFindOne,
    memberFindAll,
    memberFindOne,
    attendanceRecordFindOrCreate,
    attendanceRecordFindAll,
    invalidateDashboardCache,
  };
});

vi.mock('../../src/models', () => ({
  db: {
    Group: { findOne: mocks.groupFindOne },
    Member: {
      findAll: mocks.memberFindAll,
      findOne: mocks.memberFindOne,
    },
    AttendanceRecord: {
      findOrCreate: mocks.attendanceRecordFindOrCreate,
      findAll: mocks.attendanceRecordFindAll,
    },
  },
}));

vi.mock('../../src/services/redis.service', () => ({
  invalidateDashboardCache: mocks.invalidateDashboardCache,
}));

interface AttendanceRecordLike {
  isPresent: boolean;
  studiedDaily: boolean;
  notes: string | null;
  update(fields: {
    isPresent?: boolean;
    studiedDaily?: boolean;
    notes?: string | null;
    recordedBy: string;
  }): Promise<AttendanceRecordLike>;
  reload(opts?: unknown): Promise<AttendanceRecordLike>;
}

function makeRecord(initial: {
  isPresent: boolean;
  studiedDaily: boolean;
  notes?: string | null;
}): AttendanceRecordLike {
  const record: AttendanceRecordLike = {
    isPresent: initial.isPresent,
    studiedDaily: initial.studiedDaily,
    notes: initial.notes ?? null,
    update: vi.fn(async (fields) => {
      if (fields.isPresent !== undefined) record.isPresent = fields.isPresent;
      if (fields.studiedDaily !== undefined) record.studiedDaily = fields.studiedDaily;
      if (fields.notes !== undefined) record.notes = fields.notes;
      return record;
    }),
    async reload() {
      return this;
    },
  };
  return record;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('attendance.service', () => {
  describe('recordBulkAttendance', () => {
    it('lanza NotFoundError si el grupo no existe en la iglesia', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(
        recordBulkAttendance('church-1', 'group-1', 'user-1', {
          groupId: 'group-1',
          meetingDate: '2026-02-01',
          entries: [{ memberId: 'm1' }],
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanza ValidationError si un miembro se repite en las entradas', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });

      await expect(
        recordBulkAttendance('church-1', 'group-1', 'user-1', {
          groupId: 'group-1',
          meetingDate: '2026-02-01',
          entries: [{ memberId: 'm1' }, { memberId: 'm1' }],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si algún miembro no pertenece al grupo', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.memberFindAll.mockResolvedValue([{ id: 'm1' }]);

      await expect(
        recordBulkAttendance('church-1', 'group-1', 'user-1', {
          groupId: 'group-1',
          meetingDate: '2026-02-01',
          entries: [{ memberId: 'm1' }, { memberId: 'm2' }],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('registra la asistencia, calcula conteos e invalida la caché', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.memberFindAll.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
      mocks.attendanceRecordFindOrCreate.mockImplementation(
        async (opts: { defaults: { isPresent: boolean; studiedDaily: boolean; notes: string | null } }) => {
          return [
            makeRecord({
              isPresent: opts.defaults.isPresent,
              studiedDaily: opts.defaults.studiedDaily,
              notes: opts.defaults.notes,
            }),
            true,
          ];
        },
      );

      const result = await recordBulkAttendance('church-1', 'group-1', 'user-1', {
        groupId: 'group-1',
        meetingDate: '2026-02-01',
        meetingType: 'special',
        entries: [
          { memberId: 'm1', isPresent: true, studiedDaily: true },
          { memberId: 'm2', isPresent: false, studiedDaily: true, notes: 'Invitado' },
        ],
      });

      expect(result.total).toBe(2);
      expect(result.present).toBe(1);
      expect(result.studiedDaily).toBe(2);
      expect(mocks.attendanceRecordFindOrCreate).toHaveBeenCalledTimes(2);
      expect(mocks.attendanceRecordFindOrCreate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { groupId: 'group-1', memberId: 'm1', meetingDate: '2026-02-01', meetingType: 'special' },
          defaults: expect.objectContaining({ isPresent: true, studiedDaily: true }),
        }),
      );
      expect(mocks.invalidateDashboardCache).toHaveBeenCalledWith('church-1');
    });
  });

  describe('listAttendanceByGroup', () => {
    it('lanza NotFoundError si el grupo no existe en la iglesia', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(listAttendanceByGroup('church-1', 'group-1', {})).rejects.toThrow(NotFoundError);
    });

    it('lista la asistencia aplicando los filtros', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1' });
      mocks.attendanceRecordFindAll.mockResolvedValue([{ id: 'att-1' }]);

      const result = await listAttendanceByGroup('church-1', 'group-1', {
        meetingDate: '2026-02-01',
        meetingType: 'regular',
      });

      expect(mocks.attendanceRecordFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: 'group-1', churchId: 'church-1', meetingDate: '2026-02-01', meetingType: 'regular' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getCheckinPageData', () => {
    it('lanza NotFoundError si el grupo no existe', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(getCheckinPageData('group-1')).rejects.toThrow(NotFoundError);
    });

    it('devuelve los miembros activos del grupo y la fecha de hoy', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1', name: 'Escuela Sabática', churchId: 'church-1' });
      mocks.memberFindAll.mockResolvedValue([
        { id: 'm1', firstName: 'Ana', lastName: 'López', status: 'active' },
        { id: 'm2', firstName: 'Luis', lastName: 'Pérez', status: 'active' },
      ]);

      const result = await getCheckinPageData('group-1');

      expect(result.groupId).toBe('group-1');
      expect(result.groupName).toBe('Escuela Sabática');
      expect(result.members).toHaveLength(2);
      expect(result.members[0]).toEqual({ id: 'm1', firstName: 'Ana', lastName: 'López', status: 'active' });
      expect(result.meetingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mocks.memberFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { groupId: 'group-1', isActive: true } }),
      );
    });
  });

  describe('checkinPublic', () => {
    it('lanza NotFoundError si el grupo no existe', async () => {
      mocks.groupFindOne.mockResolvedValue(null);

      await expect(checkinPublic('group-1', 'm1')).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si el miembro no pertenece al grupo', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1', churchId: 'church-1' });
      mocks.memberFindOne.mockResolvedValue(null);

      await expect(checkinPublic('group-1', 'm1')).rejects.toThrow(NotFoundError);
    });

    it('registra el check-in cuando se crea el registro', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1', churchId: 'church-1' });
      mocks.memberFindOne.mockResolvedValue({ id: 'm1' });
      const record = makeRecord({ isPresent: true, studiedDaily: false, notes: 'Check-in por código QR' });
      mocks.attendanceRecordFindOrCreate.mockResolvedValue([record, true]);

      const result = await checkinPublic('group-1', 'm1');

      expect(result.isPresent).toBe(true);
      expect(mocks.invalidateDashboardCache).toHaveBeenCalledWith('church-1');
    });

    it('no invalida la caché si ya estaba presente', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1', churchId: 'church-1' });
      mocks.memberFindOne.mockResolvedValue({ id: 'm1' });
      const record = makeRecord({ isPresent: true, studiedDaily: false, notes: 'Check-in por código QR' });
      mocks.attendanceRecordFindOrCreate.mockResolvedValue([record, false]);

      await checkinPublic('group-1', 'm1');

      expect(record.update).not.toHaveBeenCalled();
      expect(mocks.invalidateDashboardCache).not.toHaveBeenCalled();
    });

    it('actualiza el registro previo e invalida la caché cuando no estaba presente', async () => {
      mocks.groupFindOne.mockResolvedValue({ id: 'group-1', churchId: 'church-1' });
      mocks.memberFindOne.mockResolvedValue({ id: 'm1' });
      const record = makeRecord({ isPresent: false, studiedDaily: false, notes: null });
      mocks.attendanceRecordFindOrCreate.mockResolvedValue([record, false]);

      await checkinPublic('group-1', 'm1');

      expect(record.update).toHaveBeenCalledWith({ isPresent: true, notes: 'Check-in por código QR' });
      expect(record.isPresent).toBe(true);
      expect(mocks.invalidateDashboardCache).toHaveBeenCalledWith('church-1');
    });
  });
});
