import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validateParams, validateQuery } from '../middlewares/validate.middleware';
import {
  auditLogIdParamSchema,
  auditStatsQuerySchema,
  listAuditLogsQuerySchema,
} from '../schemas/audit.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const adminRoles = ['super_admin', 'admin'] as const;

router.use(requireAuth);
router.use(requireRole(...adminRoles));

router.get(
  '/',
  validateQuery(listAuditLogsQuerySchema),
  asyncHandler(auditController.listAuditLogs),
);

router.get(
  '/stats',
  validateQuery(auditStatsQuerySchema),
  asyncHandler(auditController.getAuditStats),
);

router.get(
  '/:id',
  validateParams(auditLogIdParamSchema),
  asyncHandler(auditController.getAuditLogById),
);

export default router;
