import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createActivitySchema,
  listActivitiesQuerySchema,
  updateActivitySchema,
} from '../schemas/activity.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, scopeByChurch(), validateQuery(listActivitiesQuerySchema), asyncHandler(activityController.listActivities));

router.post('/', requireAuth, scopeByChurch(), validate(createActivitySchema), asyncHandler(activityController.createActivity));

router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(activityController.getActivity));

router.put('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateActivitySchema), asyncHandler(activityController.updateActivity));

router.delete('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(activityController.deleteActivity));

export default router;
