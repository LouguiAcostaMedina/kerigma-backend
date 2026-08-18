import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreatePrayerRequestInput,
  UpdatePrayerRequestInput,
  UpdatePrayerRequestStatusInput,
  ListPrayerRequestsQuery,
  CreatePastoralVisitInput,
  UpdatePastoralVisitInput,
  ListPastoralVisitsQuery,
} from '../schemas/pastoralCare.schema';
import * as pastoralCareService from '../services/pastoralCare.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type ChurchScope = { churchId: string } | { churchId: null };

function resolveChurchScope(user: AuthUser): ChurchScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

// --- Prayer Requests ---

export async function listPrayerRequests(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden listar solicitudes de oración desde el modo global');
  }
  const query = req.query as unknown as ListPrayerRequestsQuery;
  const { prayerRequests, total } = await pastoralCareService.listPrayerRequests(
    scope.churchId,
    query,
  );
  res.status(200).json(paginated(prayerRequests, total, query.page, query.limit));
}

export async function getPrayerRequest(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const prayerRequest = await pastoralCareService.getPrayerRequest(req.params.id);
  res.status(200).json(ok(prayerRequest));
}

export async function createPrayerRequest(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear solicitudes de oración desde el modo global.');
  }
  const prayerRequest = await pastoralCareService.createPrayerRequest(
    scope.churchId,
    req.user!.id,
    req.body as CreatePrayerRequestInput,
  );
  res.status(201).json(ok(prayerRequest, 'Solicitud de oración creada exitosamente'));
}

export async function updatePrayerRequest(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const prayerRequest = await pastoralCareService.updatePrayerRequest(
    req.params.id,
    req.body as UpdatePrayerRequestInput,
  );
  res.status(200).json(ok(prayerRequest, 'Solicitud de oración actualizada exitosamente'));
}

export async function updatePrayerRequestStatus(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const body = req.body as UpdatePrayerRequestStatusInput;
  const prayerRequest = await pastoralCareService.updatePrayerRequestStatus(
    req.params.id,
    body.status,
    body.resolutionNotes,
  );
  res.status(200).json(ok(prayerRequest, 'Estado de solicitud actualizado exitosamente'));
}

export async function deletePrayerRequest(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  await pastoralCareService.deletePrayerRequest(req.params.id);
  res.status(200).json(ok(null, 'Solicitud de oración eliminada exitosamente'));
}

// --- Pastoral Visits ---

export async function listPastoralVisits(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden listar visitas pastorales desde el modo global');
  }
  const query = req.query as unknown as ListPastoralVisitsQuery;
  const { pastoralVisits, total } = await pastoralCareService.listPastoralVisits(
    scope.churchId,
    query,
  );
  res.status(200).json(paginated(pastoralVisits, total, query.page, query.limit));
}

export async function getPastoralVisit(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const pastoralVisit = await pastoralCareService.getPastoralVisit(req.params.id);
  res.status(200).json(ok(pastoralVisit));
}

export async function createPastoralVisit(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear visitas pastorales desde el modo global.');
  }
  const body = req.body as CreatePastoralVisitInput;
  const pastoralVisit = await pastoralCareService.createPastoralVisit(
    scope.churchId,
    req.user!.id,
    {
      ...body,
      conductedBy: req.user!.id,
    },
  );
  res.status(201).json(ok(pastoralVisit, 'Visita pastoral creada exitosamente'));
}

export async function updatePastoralVisit(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const pastoralVisit = await pastoralCareService.updatePastoralVisit(
    req.params.id,
    req.body as UpdatePastoralVisitInput,
  );
  res.status(200).json(ok(pastoralVisit, 'Visita pastoral actualizada exitosamente'));
}

export async function deletePastoralVisit(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  await pastoralCareService.deletePastoralVisit(req.params.id);
  res.status(200).json(ok(null, 'Visita pastoral eliminada exitosamente'));
}
