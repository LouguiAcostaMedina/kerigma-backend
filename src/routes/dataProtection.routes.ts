import { Router } from 'express';
import * as dataProtectionController from '../controllers/dataProtection.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate, validateParams } from '../middlewares/validate.middleware';
import {
  consentSchema,
  dataProtectionMemberIdParamSchema,
} from '../schemas/dataProtection.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const adminRoles = ['super_admin', 'admin', 'director'] as const;

router.get(
  '/:memberId/consent',
  requireAuth,
  requireRole(...adminRoles),
  validateParams(dataProtectionMemberIdParamSchema),
  asyncHandler(dataProtectionController.getConsentStatus),
);

router.post(
  '/:memberId/consent',
  requireAuth,
  requireRole(...adminRoles),
  validateParams(dataProtectionMemberIdParamSchema),
  validate(consentSchema),
  asyncHandler(dataProtectionController.recordConsent),
);

router.get(
  '/:memberId/data-export',
  requireAuth,
  requireRole(...adminRoles),
  validateParams(dataProtectionMemberIdParamSchema),
  asyncHandler(dataProtectionController.exportMemberData),
);

router.post(
  '/:memberId/anonymize',
  requireAuth,
  requireRole(...adminRoles),
  validateParams(dataProtectionMemberIdParamSchema),
  asyncHandler(dataProtectionController.anonymizeMemberData),
);

router.delete(
  '/:memberId/hard-delete',
  requireAuth,
  requireRole('super_admin'),
  validateParams(dataProtectionMemberIdParamSchema),
  asyncHandler(dataProtectionController.hardDeleteMember),
);

export default router;
