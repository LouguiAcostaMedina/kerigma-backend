import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
} from '../schemas/payment.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/stats', requireAuth, scopeByChurch(), asyncHandler(paymentController.getPaymentStats));

router.get('/', requireAuth, scopeByChurch(), validateQuery(listPaymentsQuerySchema), asyncHandler(paymentController.listPayments));

router.post('/', requireAuth, scopeByChurch(), validate(createPaymentSchema), asyncHandler(paymentController.createPayment));

router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(paymentController.getPayment));

router.post('/:id/process', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(paymentController.processPayment));

router.post('/:id/refund', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), asyncHandler(paymentController.refundPayment));

export default router;
