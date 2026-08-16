import { Router } from 'express';
import * as memberController from '../controllers/member.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema, memberIdParamSchema } from '../schemas/params.schema';
import {
  assignGroupSchema,
  createMemberSchema,
  listMembersQuerySchema,
  updateMemberSchema,
  updateMemberStatusSchema,
} from '../schemas/member.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/export/excel', requireAuth, scopeByChurch(), asyncHandler(memberController.listMembers));
router.get('/export/pdf', requireAuth, scopeByChurch(), asyncHandler(memberController.listMembers));

router.post('/', requireAuth, scopeByChurch(), validate(createMemberSchema), asyncHandler(memberController.createMember));

router.get('/', requireAuth, scopeByChurch(), validateQuery(listMembersQuerySchema), asyncHandler(memberController.listMembers));

router.patch('/:id/status', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateMemberStatusSchema), asyncHandler(memberController.updateMemberStatus));
router.post('/:memberId/assign-group', requireAuth, scopeByChurch(), validateParams(memberIdParamSchema), validate(assignGroupSchema), asyncHandler(memberController.assignToGroup));

router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(memberController.getMember));
router.put('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateMemberSchema), asyncHandler(memberController.updateMember));
router.delete('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(memberController.deleteMember));

export default router;
