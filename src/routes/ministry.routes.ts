import { Router } from 'express';
import * as ministryController from '../controllers/ministry.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createMinistrySchema,
  updateMinistrySchema,
  listMinistriesQuerySchema,
  assignMemberSchema,
  listAssignmentsQuerySchema,
} from '../schemas/ministry.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, scopeByChurch(), validateQuery(listMinistriesQuerySchema), asyncHandler(ministryController.listMinistries));
router.post('/', requireAuth, scopeByChurch(), validate(createMinistrySchema), asyncHandler(ministryController.createMinistry));
router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(ministryController.getMinistry));
router.put('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateMinistrySchema), asyncHandler(ministryController.updateMinistry));
router.delete('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(ministryController.deleteMinistry));
router.post('/:id/assign', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(assignMemberSchema), asyncHandler(ministryController.assignMember));
router.delete('/:id/assign/:assignmentId', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(ministryController.removeMember));
router.get('/:id/assignments', requireAuth, scopeByChurch(), validateParams(idParamSchema), validateQuery(listAssignmentsQuerySchema), asyncHandler(ministryController.listAssignments));

export default router;
