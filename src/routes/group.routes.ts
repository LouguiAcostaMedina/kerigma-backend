import { Router } from 'express';
import * as groupController from '../controllers/group.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import {
  assignTeachersSchema,
  createDisciplePairSchema,
  createGroupSchema,
  listGroupsQuerySchema,
  updateGroupSchema,
} from '../schemas/group.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, validateQuery(listGroupsQuerySchema), asyncHandler(groupController.listGroups));
router.post('/', requireAuth, validate(createGroupSchema), asyncHandler(groupController.createGroup));

router.get('/export/excel', requireAuth, asyncHandler(groupController.listGroups));
router.get('/export/pdf', requireAuth, asyncHandler(groupController.listGroups));

router.post(
  '/:id/assign-teachers',
  requireAuth,
  validate(assignTeachersSchema),
  asyncHandler(groupController.assignTeachers),
);
router.get('/:id/disciple-pairs', requireAuth, asyncHandler(groupController.listDisciplePairs));
router.post(
  '/:id/disciple-pairs',
  requireAuth,
  validate(createDisciplePairSchema),
  asyncHandler(groupController.createDisciplePair),
);

router.get('/:id', requireAuth, asyncHandler(groupController.getGroup));
router.put('/:id', requireAuth, validate(updateGroupSchema), asyncHandler(groupController.updateGroup));

export default router;
