import { z } from 'zod';

const memberRowSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.string().trim().email('Email inválido').nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'other']).nullable().optional(),
  address: z.string().trim().max(2000).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  district: z.string().trim().max(100).nullable().optional(),
  baptized: z.union([z.boolean(), z.string()]).optional().transform(v => v === 'true' || v === true),
  spiritualStatus: z.enum(['new_believer', 'growing', 'mature', 'leader', 'teacher', 'visitor', 'inactive', 'other']).optional(),
  occupation: z.string().trim().max(150).nullable().optional(),
  education: z.enum(['elementary', 'high_school', 'technical', 'university', 'graduate', 'other', 'not_specified']).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

const studentRowSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.string().trim().email('Email inválido').nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  address: z.string().trim().max(2000).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  district: z.string().trim().max(100).nullable().optional(),
  program: z.enum(['basic_bible', 'intermediate_bible', 'advanced_bible', 'theology', 'discipleship', 'leadership', 'missions', 'evangelism', 'counseling', 'other']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'graduate']).optional(),
  isBeliever: z.union([z.boolean(), z.string()]).optional().transform(v => v === 'true' || v === true),
  baptized: z.union([z.boolean(), z.string()]).optional().transform(v => v === 'true' || v === true),
  notes: z.string().trim().max(2000).nullable().optional(),
});

const groupRowSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().trim().max(2000).nullable().optional(),
  type: z.enum(['youth', 'adults', 'children', 'seniors', 'couples', 'singles', 'women', 'men', 'students', 'professionals', 'mixed']).optional(),
  category: z.enum(['bible_study', 'prayer', 'evangelism', 'discipleship', 'worship', 'service', 'fellowship', 'training', 'mission']).optional(),
  meetingDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  meetingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:mm').optional(),
  meetingLocation: z.string().trim().max(255).nullable().optional(),
  maxCapacity: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === null || v === undefined ? undefined : Number(v)),
  isOpenToNewMembers: z.union([z.boolean(), z.string()]).optional().transform(v => v === 'true' || v === true),
});

const userRowSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  role: z.enum(['super_admin', 'admin', 'director', 'leader', 'reader']).optional(),
});

const churchRowSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  address: z.string().trim().min(1, 'La dirección es requerida'),
  city: z.string().trim().min(1, 'La ciudad es requerida'),
  state: z.string().trim().min(1, 'El departamento es requerido'),
  country: z.string().trim().min(1).default('Perú'),
  zipCode: z.string().trim().max(20).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email('Email inválido').nullable().optional(),
  website: z.string().trim().max(255).nullable().optional(),
  pastor: z.string().trim().max(200).nullable().optional(),
  pastorPhone: z.string().trim().max(20).nullable().optional(),
  pastorEmail: z.string().trim().email('Email del pastor inválido').max(255).nullable().optional(),
  capacity: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === null || v === undefined ? undefined : Number(v)),
  status: z.enum(['active', 'construction', 'planning', 'inactive']).optional(),
  foundedDate: z.string().nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  isActive: z.union([z.boolean(), z.string()]).optional().transform(v => v === 'true' || v === true),
});

export const bulkImportSchema = z.object({
  entity: z.enum(['members', 'students', 'groups', 'users', 'churches']),
  groupId: z.string().uuid('El grupo no es válido').optional(),
  churchId: z.string().uuid('La iglesia no es válida').optional(),
  rows: z.array(z.record(z.string(), z.unknown())).min(1, 'Debe proporcionar al menos una fila'),
});

export type BulkImportInput = z.infer<typeof bulkImportSchema>;

export type MemberImportRow = z.infer<typeof memberRowSchema>;
export type StudentImportRow = z.infer<typeof studentRowSchema>;
export type GroupImportRow = z.infer<typeof groupRowSchema>;
export type UserImportRow = z.infer<typeof userRowSchema>;
export type ChurchImportRow = z.infer<typeof churchRowSchema>;

export { memberRowSchema, studentRowSchema, groupRowSchema, userRowSchema, churchRowSchema };
