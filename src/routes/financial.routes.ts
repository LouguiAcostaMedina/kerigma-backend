import { Router } from 'express';
import * as financialController from '../controllers/financial.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import {
  contributionIdParamSchema,
  createContributionSchema,
  listContributionsQuerySchema,
  summaryQuerySchema,
} from '../schemas/financial.schema';
import { memberIdParamSchema } from '../schemas/params.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const financialRoles = ['super_admin', 'admin', 'director', 'tesorero'] as const;

router.use(requireAuth);
router.use(requireRole(...financialRoles));

router.post(
  '/',
  validate(createContributionSchema),
  asyncHandler(financialController.createContribution),
);

router.get(
  '/',
  validateQuery(listContributionsQuerySchema),
  asyncHandler(financialController.listContributions),
);

router.get(
  '/summary/by-category',
  validateQuery(summaryQuerySchema),
  asyncHandler(financialController.getSummaryByCategory),
);

router.get(
  '/summary/by-period',
  validateQuery(summaryQuerySchema),
  asyncHandler(financialController.getSummaryByPeriod),
);

router.get(
  '/member/:memberId',
  validateParams(memberIdParamSchema),
  asyncHandler(financialController.getMemberHistory),
);

router.get(
  '/:id',
  validateParams(contributionIdParamSchema),
  asyncHandler(financialController.getContributionById),
);

router.delete(
  '/:id',
  validateParams(contributionIdParamSchema),
  asyncHandler(financialController.deleteContribution),
);

export default router;
