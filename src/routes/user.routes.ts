import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  bulkOperationSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
} from '../schemas/user.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const manageUsers = requireRole('super_admin', 'admin', 'director');

router.get('/roles', requireAuth, asyncHandler(userController.listRoles));

router.get('/', requireAuth, manageUsers, validateQuery(listUsersQuerySchema), asyncHandler(userController.listUsers));

router.post('/', requireAuth, manageUsers, validate(createUserSchema), asyncHandler(userController.createUser));
router.post('/bulk', requireAuth, manageUsers, validate(bulkOperationSchema), asyncHandler(userController.bulkOperation));
router.patch(
  '/:id/status',
  requireAuth,
  manageUsers,
  validateParams(idParamSchema),
  validate(updateUserStatusSchema),
  asyncHandler(userController.updateUserStatus),
);
router.post('/:id/invite', requireAuth, manageUsers, validateParams(idParamSchema), asyncHandler(userController.inviteUser));
router.post('/:id/reset-password', requireAuth, manageUsers, validateParams(idParamSchema), asyncHandler(userController.resetUserPassword));
router.put('/:id', requireAuth, manageUsers, validateParams(idParamSchema), validate(updateUserSchema), asyncHandler(userController.updateUser));
router.delete('/:id', requireAuth, manageUsers, validateParams(idParamSchema), asyncHandler(userController.deleteUser));

export default router;
