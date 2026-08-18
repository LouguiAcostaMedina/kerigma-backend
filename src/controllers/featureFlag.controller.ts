import type { Request, Response } from 'express';
import type { UpdateFeatureFlagInput } from '../schemas/featureFlag.schema';
import * as featureFlagService from '../services/featureFlag.service';
import { ok } from '../utils/apiResponse';

export async function listFlags(_req: Request, res: Response): Promise<void> {
  const flags = await featureFlagService.listFeatureFlags();
  res.status(200).json(ok(flags));
}

export async function getFlag(req: Request, res: Response): Promise<void> {
  const flag = await featureFlagService.getFeatureFlag(req.params.name);
  res.status(200).json(ok(flag));
}

export async function updateFlag(req: Request, res: Response): Promise<void> {
  const { isEnabled } = req.body as UpdateFeatureFlagInput;
  const flag = await featureFlagService.updateFeatureFlag(req.params.name, isEnabled);
  res.status(200).json(ok(flag, 'Feature flag actualizada exitosamente'));
}
