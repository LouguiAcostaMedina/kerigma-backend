import { z } from 'zod';

export const updateFeatureFlagSchema = z.object({
  isEnabled: z.boolean(),
});

export const featureFlagNameParam = z.object({
  name: z.string().min(1).max(100),
});

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
