import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(200, 'El nombre es demasiado largo'),
  description: z.string().trim().max(2000, 'La descripción es demasiado larga').nullable().optional(),
  type: z.enum(['youth', 'adults', 'children', 'seniors', 'couples', 'singles', 'women', 'men', 'students', 'professionals', 'mixed']).optional(),
  category: z.enum(['bible_study', 'prayer', 'evangelism', 'discipleship', 'worship', 'service', 'fellowship', 'training', 'mission']).optional(),
  meetingDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  meetingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'La hora debe tener formato HH:mm'),
  meetingLocation: z.string().trim().max(255, 'La ubicación es demasiado larga').nullable().optional(),
  maxCapacity: z.number().int().min(1, 'La capacidad debe ser mayor a 0').nullable().optional(),
  mainTeacherId: z.string().uuid('El maestro principal no es válido').nullable().optional(),
  associateTeacherId: z.string().uuid('El maestro asociado no es válido').nullable().optional(),
  isOpenToNewMembers: z.boolean().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(200, 'El nombre es demasiado largo').optional(),
  description: z.string().trim().max(2000, 'La descripción es demasiado larga').nullable().optional(),
  type: z.enum(['youth', 'adults', 'children', 'seniors', 'couples', 'singles', 'women', 'men', 'students', 'professionals', 'mixed']).optional(),
  category: z.enum(['bible_study', 'prayer', 'evangelism', 'discipleship', 'worship', 'service', 'fellowship', 'training', 'mission']).optional(),
  meetingDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  meetingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'La hora debe tener formato HH:mm').optional(),
  meetingLocation: z.string().trim().max(255, 'La ubicación es demasiado larga').nullable().optional(),
  maxCapacity: z.number().int().min(1, 'La capacidad debe ser mayor a 0').nullable().optional(),
  status: z.enum(['planning', 'active', 'paused', 'completed', 'cancelled']).optional(),
  isOpenToNewMembers: z.boolean().optional(),
});

export const assignTeachersSchema = z
  .object({
    mainTeacherId: z.string().uuid('El maestro principal no es válido').nullable(),
    associateTeacherId: z.string().uuid('El maestro asociado no es válido').nullable(),
  })
  .refine(
    (value) => value.mainTeacherId !== null || value.associateTeacherId !== null,
    { message: 'Debe indicar al menos un maestro (principal o asociado)' },
  );

export const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default('').transform((v) => (v === '' ? undefined : v)),
  church: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().uuid('La iglesia no es válida').optional(),
  ),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['planning', 'active', 'paused', 'completed', 'cancelled']).optional(),
  ),
  type: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['youth', 'adults', 'children', 'seniors', 'couples', 'singles', 'women', 'men', 'students', 'professionals', 'mixed']).optional(),
  ),
  category: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['bible_study', 'prayer', 'evangelism', 'discipleship', 'worship', 'service', 'fellowship', 'training', 'mission']).optional(),
  ),
  meetingDay: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  ),
  sortBy: z
    .enum(['name', 'type', 'category', 'status', 'meetingDay', 'meetingTime', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['ASC', 'DESC']).default('DESC'),
  ),
});

export const createDisciplePairSchema = z.object({
  member1Id: z.string().uuid('El discipulador no es válido'),
  member2Id: z.string().uuid('El discípulo no es válido'),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  startedAt: z.string().date('La fecha de inicio no es válida').optional(),
  meetingSchedule: z.string().trim().max(255, 'El horario es demasiado largo').nullable().optional(),
  notes: z.string().trim().max(2000, 'Las notas son demasiado largas').nullable().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;
export type AssignTeachersInput = z.infer<typeof assignTeachersSchema>;
export type CreateDisciplePairInput = z.infer<typeof createDisciplePairSchema>;
