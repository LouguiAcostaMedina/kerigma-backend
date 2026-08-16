import { Router } from 'express';
import * as groupController from '../controllers/group.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createGroupSchema,
  listGroupsQuerySchema,
  updateGroupSchema,
} from '../schemas/group.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, scopeByChurch(), validateQuery(listGroupsQuerySchema), asyncHandler(groupController.listGroups));
router.post('/', requireAuth, scopeByChurch(), validate(createGroupSchema), asyncHandler(groupController.createGroup));

router.get('/export/excel', requireAuth, scopeByChurch(), asyncHandler(groupController.listGroups));
router.get('/export/pdf', requireAuth, scopeByChurch(), asyncHandler(groupController.listGroups));

router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(groupController.getGroup));
router.put('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateGroupSchema), asyncHandler(groupController.updateGroup));

export default router;
