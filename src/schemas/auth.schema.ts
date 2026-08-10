import { z } from 'zod';

const PASSWORD_MIN = 8;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe proporcionar un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  password: z.string().min(1, 'La contraseña es requerida').max(255, 'La contraseña es demasiado larga'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe proporcionar un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  password: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
    .max(255, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe incluir al menos una minúscula')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido es demasiado largo'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{7,20}$/, 'El teléfono debe contener entre 7 y 20 dígitos')
    .optional()
    .or(z.literal('')),
  churchId: z.string().uuid('La iglesia seleccionada no es válida').optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El token de refresco es requerido').optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido es demasiado largo'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{7,20}$/, 'El teléfono debe contener entre 7 y 20 dígitos')
    .optional()
    .or(z.literal('')),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Debe proporcionar un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido').max(2000, 'El token es demasiado largo'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
    .max(255, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe incluir al menos una minúscula')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
