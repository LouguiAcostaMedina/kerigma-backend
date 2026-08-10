import { Router } from 'express';
import * as goalController from '../controllers/goal.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { closeQuarterlyGoalSchema, createQuarterlyGoalSchema, listGoalsQuerySchema } from '../schemas/goal.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/quarterly',
  requireAuth,
  validate(createQuarterlyGoalSchema),
  asyncHandler(goalController.createQuarterlyGoal),
);
router.put(
  '/quarterly/:id/close',
  requireAuth,
  validate(closeQuarterlyGoalSchema),
  asyncHandler(goalController.closeQuarterlyGoal),
);
router.get(
  '/quarterly/group/:groupId',
  requireAuth,
  validateQuery(listGoalsQuerySchema),
  asyncHandler(goalController.listQuarterlyGoalsByGroup),
);
router.get('/quarterly/quarter/:quarterId', requireAuth, asyncHandler(goalController.listQuarterlyGoalsByQuarter));

export default router;
