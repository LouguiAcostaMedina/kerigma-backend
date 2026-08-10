import { z } from 'zod';

export const createQuarterlyGoalSchema = z.object({
  quarterId: z.string().uuid('El trimestre no es válido'),
  groupId: z.string().uuid('El grupo no es válido').nullable().optional(),
  goalType: z.enum(['comunion', 'relacionamiento', 'mision']),
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(255, 'El título es demasiado largo'),
  description: z.string().trim().max(2000, 'La descripción es demasiado larga').nullable().optional(),
  targetValue: z.number().min(0, 'El valor meta no puede ser negativo'),
  unit: z.string().trim().max(50, 'La unidad es demasiado larga').nullable().optional(),
  startDate: z.string().date('La fecha de inicio no es válida').nullable().optional(),
  dueDate: z.string().date('La fecha límite no es válida').nullable().optional(),
});

export const closeQuarterlyGoalSchema = z.object({
  achievedValue: z.number().min(0, 'El valor alcanzado no puede ser negativo'),
});

export const listGoalsQuerySchema = z.object({
  quarterId: z.string().uuid('El trimestre no es válido').optional(),
});

export type CreateQuarterlyGoalInput = z.infer<typeof createQuarterlyGoalSchema>;
export type CloseQuarterlyGoalInput = z.infer<typeof closeQuarterlyGoalSchema>;
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;
