import { z } from 'zod';

const PASSWORD_MIN = 8;

const roleEnum = z.enum(['super_admin', 'admin', 'director', 'leader', 'reader']);

const passwordField = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
  .max(255, 'La contraseña es demasiado larga')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una minúscula')
  .regex(/\d/, 'La contraseña debe incluir al menos un número');

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

const optionalDate = z
  .string()
  .date('La fecha no es válida')
  .nullable()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value === '' ? null : value));

const genderEnum = z.enum(['male', 'female', 'other']);
const maritalStatusEnum = z.enum(['single', 'married', 'divorced', 'widowed', 'other']);

const nullableEnum = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    schema.nullable().optional(),
  );

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe proporcionar un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  password: passwordField,
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido es demasiado largo'),
  phone: z.string().trim().max(20, 'El teléfono es demasiado largo').nullable().optional(),
  role: roleEnum.default('reader'),
  churchId: z.string().uuid('La iglesia seleccionada no es válida').nullable().optional(),
  address: optionalText(500, 'La dirección es demasiado larga'),
  city: optionalText(100, 'La ciudad es demasiado larga'),
  state: optionalText(100, 'El estado o provincia es demasiado largo'),
  zipCode: optionalText(20, 'El código postal es demasiado largo'),
  dateOfBirth: optionalDate,
  gender: nullableEnum(genderEnum),
  maritalStatus: nullableEnum(maritalStatusEnum),
  occupation: optionalText(150, 'La ocupación es demasiado larga'),
  emergencyContact: optionalText(200, 'El contacto de emergencia es demasiado largo'),
  emergencyPhone: optionalText(20, 'El teléfono de emergencia es demasiado largo'),
  notes: optionalText(2000, 'Las notas son demasiado largas'),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe proporcionar un email válido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .optional(),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo').optional(),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido es demasiado largo').optional(),
  phone: z.string().trim().max(20, 'El teléfono es demasiado largo').nullable().optional(),
  role: roleEnum.optional(),
  churchId: z.string().uuid('La iglesia seleccionada no es válida').nullable().optional(),
  address: optionalText(500, 'La dirección es demasiado larga'),
  city: optionalText(100, 'La ciudad es demasiado larga'),
  state: optionalText(100, 'El estado o provincia es demasiado largo'),
  zipCode: optionalText(20, 'El código postal es demasiado largo'),
  dateOfBirth: optionalDate,
  gender: nullableEnum(genderEnum),
  maritalStatus: nullableEnum(maritalStatusEnum),
  occupation: optionalText(150, 'La ocupación es demasiado larga'),
  emergencyContact: optionalText(200, 'El contacto de emergencia es demasiado largo'),
  emergencyPhone: optionalText(20, 'El teléfono de emergencia es demasiado largo'),
  notes: optionalText(2000, 'Las notas son demasiado largas'),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).default('').transform((v) => (v === '' ? undefined : v)),
  role: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    roleEnum.optional(),
  ),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  ),
  church: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().uuid('La iglesia no es válida').optional(),
  ),
  dateFrom: z.string().date('La fecha inicial no es válida').optional(),
  dateTo: z.string().date('La fecha final no es válida').optional(),
  sortField: z
    .enum(['createdAt', 'firstName', 'lastName', 'email', 'role', 'lastLogin', 'isActive'])
    .default('createdAt'),
  sortDirection: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['ASC', 'DESC']).default('DESC'),
  ),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'pending']),
  reason: z.string().trim().max(1000, 'La razón es demasiado larga').nullable().optional(),
});

export const bulkOperationSchema = z.object({
  operation: z.enum(['delete', 'activate', 'deactivate', 'suspend', 'reactivate']),
  userIds: z.array(z.string().uuid('El identificador no es válido')).min(1, 'Debe indicar al menos un usuario'),
  data: z.record(z.unknown()).optional(),
});

export const bulkDeleteUsersSchema = z.object({
  ids: z.array(z.string().uuid('El identificador no es válido')).min(1, 'Debe indicar al menos un usuario'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;
