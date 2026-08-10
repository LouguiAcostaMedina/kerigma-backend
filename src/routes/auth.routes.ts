import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, forgotPasswordSchema, refreshSchema, resetPasswordSchema, signupSchema, updateProfileSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { fail } from '../utils/apiResponse';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(fail('TOO_MANY_REQUESTS', 'Demasiados intentos de inicio de sesión. Intente nuevamente más tarde'));
  },
});

const signupLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.signupMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(fail('TOO_MANY_REQUESTS', 'Demasiados registros desde esta IP. Intente nuevamente más tarde'));
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(fail('TOO_MANY_REQUESTS', 'Demasiadas solicitudes. Intente nuevamente más tarde'));
  },
});

router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/signup', signupLimiter, validate(signupSchema), asyncHandler(authController.signup));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', requireAuth, asyncHandler(authController.me));
router.put('/profile', requireAuth, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', forgotPasswordLimiter, validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

export default router;
