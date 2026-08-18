import { z } from 'zod';

export const consentSchema = z.object({
  consentGiven: z.boolean(),
});

export type ConsentInput = z.infer<typeof consentSchema>;

export const dataProtectionMemberIdParamSchema = z.object({
  memberId: z.string().uuid('El identificador del miembro no es válido'),
});
