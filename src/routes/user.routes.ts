import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import {
  bulkDeleteUsersSchema,
  bulkOperationSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
} from '../schemas/user.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, validateQuery(listUsersQuerySchema), asyncHandler(userController.listUsers));
router.get('/roles', requireAuth, asyncHandler(userController.listRoles));

router.post('/', requireAuth, validate(createUserSchema), asyncHandler(userController.createUser));
router.post('/bulk', requireAuth, validate(bulkOperationSchema), asyncHandler(userController.bulkOperation));
router.patch(
  '/:id/status',
  requireAuth,
  validate(updateUserStatusSchema),
  asyncHandler(userController.updateUserStatus),
);
router.patch('/:id/approve', requireAuth, asyncHandler(userController.approveUser));
router.delete('/bulk', requireAuth, validate(bulkDeleteUsersSchema), asyncHandler(userController.deleteMultipleUsers));
router.post('/:id/invite', requireAuth, asyncHandler(userController.inviteUser));
router.post('/:id/reset-password', requireAuth, asyncHandler(userController.resetUserPassword));
router.get('/:id', requireAuth, asyncHandler(userController.getUserById));
router.put('/:id', requireAuth, validate(updateUserSchema), asyncHandler(userController.updateUser));
router.delete('/:id', requireAuth, asyncHandler(userController.deleteUser));

export default router;
