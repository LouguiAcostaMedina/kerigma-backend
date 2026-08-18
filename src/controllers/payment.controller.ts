import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreatePaymentInput,
  ListPaymentsQuery,
} from '../schemas/payment.schema';
import * as paymentService from '../services/payment.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type PaymentScope = { churchId: string } | { churchId: null };

function resolvePaymentScope(user: AuthUser): PaymentScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const scope = resolvePaymentScope(req.user!);
  const query = req.query as unknown as ListPaymentsQuery;
  const { payments, total } = await paymentService.listPayments(scope.churchId, query);
  res.status(200).json(paginated(payments, total, query.page, query.limit));
}

export async function getPayment(req: Request, res: Response): Promise<void> {
  const scope = resolvePaymentScope(req.user!);
  const payment = await paymentService.getPaymentById(req.params.id, scope.churchId);
  res.status(200).json(ok(payment));
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  const scope = resolvePaymentScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear pagos desde el modo global. Especifique una iglesia.');
  }
  const payment = await paymentService.createPayment(
    scope.churchId,
    req.user!.id,
    req.body as CreatePaymentInput,
  );
  res.status(201).json(ok(payment, 'Pago registrado exitosamente'));
}

export async function processPayment(req: Request, res: Response): Promise<void> {
  const scope = resolvePaymentScope(req.user!);
  const payment = await paymentService.processPayment(req.params.id, scope.churchId);
  res.status(200).json(ok(payment, 'Pago procesado exitosamente'));
}

export async function refundPayment(req: Request, res: Response): Promise<void> {
  const payment = await paymentService.refundPayment(req.params.id);
  res.status(200).json(ok(payment, 'Pago reembolsado exitosamente'));
}

export async function getPaymentStats(req: Request, res: Response): Promise<void> {
  const scope = resolvePaymentScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden obtener estadísticas desde el modo global. Especifique una iglesia.');
  }
  const stats = await paymentService.getPaymentStats(scope.churchId);
  res.status(200).json(ok(stats));
}
