import { Router } from 'express';
import * as memberController from '../controllers/member.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import {
  assignGroupSchema,
  bulkDeleteMembersSchema,
  createMemberSchema,
  listMembersQuerySchema,
  searchMembersSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
} from '../schemas/member.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/stats', requireAuth, asyncHandler(memberController.getMembersStats));
router.get('/export/excel', requireAuth, asyncHandler(memberController.listMembers));
router.get('/export/pdf', requireAuth, asyncHandler(memberController.listMembers));

router.post('/bulk', requireAuth, validate(bulkDeleteMembersSchema), asyncHandler(memberController.deleteMultipleMembers));
router.post('/search', requireAuth, validate(searchMembersSchema), asyncHandler(memberController.searchMembers));
router.post('/', requireAuth, validate(createMemberSchema), asyncHandler(memberController.createMember));

router.get('/', requireAuth, validateQuery(listMembersQuerySchema), asyncHandler(memberController.listMembers));

router.patch('/:id/status', requireAuth, validate(updateMemberStatusSchema), asyncHandler(memberController.updateMemberStatus));
router.post('/:memberId/assign-group', requireAuth, validate(assignGroupSchema), asyncHandler(memberController.assignToGroup));

router.get('/:id/history', requireAuth, asyncHandler(memberController.getMember));
router.get('/:id', requireAuth, asyncHandler(memberController.getMember));
router.put('/:id', requireAuth, validate(updateMemberSchema), asyncHandler(memberController.updateMember));
router.delete('/:id', requireAuth, asyncHandler(memberController.deleteMember));

export default router;
