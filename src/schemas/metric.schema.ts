import { z } from 'zod';

const nonNegativeInt = z.number().int('Debe ser un número entero').min(0, 'No puede ser negativo');
const nullableMoney = z.number().min(0, 'No puede ser negativo').nullable();

export const createWeeklyMetricSchema = z
  .object({
    groupId: z.string().uuid('El grupo no es válido'),
    weekStart: z.string().date('La fecha de inicio no es válida'),
    weekEnd: z.string().date('La fecha de fin no es válida'),
    membersPresent: nonNegativeInt.optional(),
    dailyBibleStudy: nonNegativeInt.optional(),
    smallGroupParticipants: nonNegativeInt.optional(),
    bibleStudiesParticipants: nonNegativeInt.optional(),
    totalMeetings: nonNegativeInt.optional(),
    averageAttendance: nonNegativeInt.optional(),
    maxAttendance: nonNegativeInt.optional(),
    minAttendance: nonNegativeInt.optional(),
    newMembers: nonNegativeInt.optional(),
    leftMembers: nonNegativeInt.optional(),
    netGrowth: nonNegativeInt.optional(),
    totalMembersStart: nonNegativeInt.optional(),
    totalMembersEnd: nonNegativeInt.optional(),
    newConversions: nonNegativeInt.optional(),
    baptisms: nonNegativeInt.optional(),
    decisionsForChrist: nonNegativeInt.optional(),
    newStudents: nonNegativeInt.optional(),
    graduatedStudents: nonNegativeInt.optional(),
    evangelisticEvents: nonNegativeInt.optional(),
    communityServices: nonNegativeInt.optional(),
    specialMeetings: nonNegativeInt.optional(),
    offerings: nullableMoney.optional(),
    tithes: nullableMoney.optional(),
    specialOfferings: nullableMoney.optional(),
    notes: z.string().trim().max(2000, 'Las notas son demasiado largas').nullable().optional(),
    challenges: z.string().trim().max(2000, 'Los desafíos son demasiado largos').nullable().optional(),
    achievements: z.string().trim().max(2000, 'Los logros son demasiado largos').nullable().optional(),
  })
  .refine((value) => value.weekStart <= value.weekEnd, {
    message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
    path: ['weekEnd'],
  });

export const listWeeklyMetricsQuerySchema = z.object({
  quarterId: z.string().uuid('El trimestre no es válido').optional(),
});

export const createAttendanceBulkSchema = z.object({
  groupId: z.string().uuid('El grupo no es válido'),
  meetingDate: z.string().date('La fecha de reunión no es válida'),
  meetingType: z.enum(['regular', 'special', 'evangelism', 'community', 'prayer', 'study', 'other']).optional(),
  entries: z
    .array(
      z.object({
        memberId: z.string().uuid('El miembro no es válido'),
        isPresent: z.boolean().optional(),
        studiedDaily: z.boolean().optional(),
        notes: z.string().trim().max(2000, 'Las notas son demasiado largas').nullable().optional(),
      }),
    )
    .min(1, 'Debe registrar al menos un miembro')
    .max(500, 'La cantidad de registros supera el máximo permitido'),
});

export const listAttendanceQuerySchema = z.object({
  meetingDate: z.string().date('La fecha no es válida').optional(),
  meetingType: z.enum(['regular', 'special', 'evangelism', 'community', 'prayer', 'study', 'other']).optional(),
});

export const publicCheckinSchema = z.object({
  memberId: z.string().uuid('El miembro no es válido'),
});

export type CreateWeeklyMetricInput = z.infer<typeof createWeeklyMetricSchema>;
export type ListWeeklyMetricsQuery = z.infer<typeof listWeeklyMetricsQuerySchema>;
export type CreateAttendanceBulkInput = z.infer<typeof createAttendanceBulkSchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
export type PublicCheckinInput = z.infer<typeof publicCheckinSchema>;
