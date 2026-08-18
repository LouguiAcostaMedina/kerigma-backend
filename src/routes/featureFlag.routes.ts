import { Router } from 'express';
import * as featureFlagController from '../controllers/featureFlag.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate, validateParams } from '../middlewares/validate.middleware';
import { updateFeatureFlagSchema, featureFlagNameParam } from '../schemas/featureFlag.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, requireRole('super_admin', 'admin'), asyncHandler(featureFlagController.listFlags));

router.get('/:name', requireAuth, requireRole('super_admin', 'admin'), validateParams(featureFlagNameParam), asyncHandler(featureFlagController.getFlag));

router.put('/:name', requireAuth, requireRole('super_admin', 'admin'), validateParams(featureFlagNameParam), validate(updateFeatureFlagSchema), asyncHandler(featureFlagController.updateFlag));

export default router;
