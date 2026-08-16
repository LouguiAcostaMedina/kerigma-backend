import { z } from 'zod';

const commonMemberFields = {
  firstName: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  lastName: z.string().trim().min(1, 'El apellido es requerido').max(100, 'El apellido es demasiado largo'),
  email: z.string().trim().email('Debe proporcionar un email válido').max(150).nullable().optional(),
  phone: z.string().trim().max(20, 'El teléfono es demasiado largo').nullable().optional(),
  dateOfBirth: z.string().date('La fecha de nacimiento no es válida').nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'other']).nullable().optional(),
  address: z.string().trim().max(2000, 'La dirección es demasiado larga').nullable().optional(),
  city: z.string().trim().max(100, 'La ciudad es demasiado larga').nullable().optional(),
  district: z.string().trim().max(100, 'El distrito es demasiado largo').nullable().optional(),
  baptized: z.boolean().optional(),
  baptismDate: z.string().date('La fecha de bautismo no es válida').nullable().optional(),
  conversionDate: z.string().date('La fecha de conversión no es válida').nullable().optional(),
  spiritualStatus: z
    .enum(['new_believer', 'growing', 'mature', 'leader', 'teacher', 'visitor', 'inactive', 'other'])
    .optional(),
  joinDate: z.string().date('La fecha de ingreso no es válida').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'transferred', 'graduated']).optional(),
  occupation: z.string().trim().max(150, 'La ocupación es demasiado larga').nullable().optional(),
  education: z
    .enum(['elementary', 'high_school', 'technical', 'university', 'graduate', 'other', 'not_specified'])
    .nullable()
    .optional(),
  emergencyContact: z.record(z.unknown()).nullable().optional(),
  notes: z.string().trim().max(5000, 'Las notas son demasiado largas').nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
};

export const createMemberSchema = z.object({
  ...commonMemberFields,
  groupId: z.string().uuid('El grupo no es válido'),
});

export const updateMemberSchema = z.object({
  ...commonMemberFields,
  groupId: z.string().uuid('El grupo no es válido').optional(),
});

export const listMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default('').transform(v => v === '' ? undefined : v),
  church: z.preprocess(v => (v === '' || v === undefined ? undefined : v), z.string().uuid('La iglesia no es válida').optional()),
  group: z.preprocess(v => (v === '' || v === undefined ? undefined : v), z.string().uuid('El grupo no es válido').optional()),
  status: z.preprocess(v => (v === '' || v === undefined ? undefined : v), z.enum(['active', 'inactive', 'suspended', 'transferred', 'graduated']).optional()),
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'status', 'joinDate', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.preprocess(
    v => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['ASC', 'DESC']).default('DESC'),
  ),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'transferred', 'graduated']),
});

export const assignGroupSchema = z.object({
  groupId: z.string().uuid('El grupo no es válido'),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
