import { z } from 'zod';

const commonStudentFields = {
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido es demasiado largo'),
  email: z.string().trim().toLowerCase().email('Debe proporcionar un email válido').max(150).nullable().optional(),
  phone: z.string().trim().max(20, 'El teléfono es demasiado largo').nullable().optional(),
  dateOfBirth: z.string().date('La fecha de nacimiento no es válida').nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  address: z.string().trim().max(2000, 'La dirección es demasiado larga').nullable().optional(),
  city: z.string().trim().max(100, 'La ciudad es demasiado larga').nullable().optional(),
  district: z.string().trim().max(100, 'El distrito es demasiado largo').nullable().optional(),
  enrollmentDate: z.string().date('La fecha de inscripción no es válida').optional(),
  program: z.enum(['basic_bible', 'intermediate_bible', 'advanced_bible', 'theology', 'discipleship', 'leadership', 'missions', 'evangelism', 'counseling', 'other']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'graduate']).optional(),
  mentorId: z.string().uuid('El mentor no es válido').nullable().optional(),
  disciplePairId: z.string().uuid('La pareja de discipulado no es válida').nullable().optional(),
  notes: z.string().trim().max(2000, 'Las notas son demasiado largas').nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  isBeliever: z.boolean().optional(),
  baptized: z.boolean().optional(),
  churchMember: z.boolean().optional(),
};

export const createStudentSchema = z.object({
  ...commonStudentFields,
  groupId: z.string().uuid('El grupo no es válido'),
});

export const updateStudentSchema = z.object(commonStudentFields);

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default('').transform((v) => (v === '' ? undefined : v)),
  church: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().uuid('La iglesia no es válida').optional(),
  ),
  group: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().uuid('El grupo no es válido').optional(),
  ),
  instructor: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().uuid('El instructor no es válido').optional(),
  ),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['enrolled', 'active', 'completed', 'dropped', 'suspended', 'graduated']).optional(),
  ),
  level: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['beginner', 'intermediate', 'advanced', 'graduate']).optional(),
  ),
  baptized: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['true', 'false']).optional(),
  ),
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'status', 'level', 'enrollmentDate', 'progressPercentage', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['ASC', 'DESC']).default('DESC'),
  ),
});

export const updateStudentStatusSchema = z.object({
  status: z.enum(['enrolled', 'active', 'completed', 'dropped', 'suspended', 'graduated']),
});

export const updateStudentLevelSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced', 'graduate']),
});

export const bulkDeleteStudentsSchema = z.object({
  ids: z.array(z.string().uuid('El identificador no es válido')).min(1, 'Debe indicar al menos un estudiante'),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
