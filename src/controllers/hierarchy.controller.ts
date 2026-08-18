import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateAssociationInput,
  ListAssociationsQuery,
  UpdateAssociationInput,
  CreateDistrictInput,
  UpdateDistrictInput,
} from '../schemas/hierarchy.schema';
import * as hierarchyService from '../services/hierarchy.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError, BadRequestError } from '../utils/errors';

type GlobalScope = { churchId: string } | { churchId: null };

function resolveGlobalScope(user: AuthUser): GlobalScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (user.role !== 'admin' || !user.churchId) {
    throw new ForbiddenError('No tiene permisos para acceder a la jerarquía');
  }
  return { churchId: user.churchId };
}

// --- Associations ---

export async function listAssociations(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const query = req.query as unknown as ListAssociationsQuery;
  const { associations, total } = await hierarchyService.listAssociations(query);
  res.status(200).json(paginated(associations, total, query.page, query.limit));
}

export async function getAssociation(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const association = await hierarchyService.getAssociation(req.params.id);
  res.status(200).json(ok(association));
}

export async function createAssociation(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const association = await hierarchyService.createAssociation(
    req.user!.id,
    req.body as CreateAssociationInput,
  );
  res.status(201).json(ok(association, 'Asociación creada exitosamente'));
}

export async function updateAssociation(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const association = await hierarchyService.updateAssociation(
    req.params.id,
    req.body as UpdateAssociationInput,
  );
  res.status(200).json(ok(association, 'Asociación actualizada exitosamente'));
}

export async function deleteAssociation(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  await hierarchyService.deleteAssociation(req.params.id);
  res.status(200).json(ok(null, 'Asociación eliminada exitosamente'));
}

// --- Districts ---

export async function listDistricts(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const { associationId, ...query } = req.query as unknown as {
    associationId?: string;
    page: number;
    limit: number;
    search?: string;
  };
  if (!associationId) {
    throw new BadRequestError('El parámetro associationId es requerido');
  }
  const { districts, total } = await hierarchyService.listDistricts(associationId, query);
  res.status(200).json(paginated(districts, total, query.page, query.limit));
}

export async function getDistrict(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const district = await hierarchyService.getDistrict(req.params.id);
  res.status(200).json(ok(district));
}

export async function createDistrict(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const district = await hierarchyService.createDistrict(
    req.user!.id,
    req.body as CreateDistrictInput,
  );
  res.status(201).json(ok(district, 'Distrito creado exitosamente'));
}

export async function updateDistrict(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  const district = await hierarchyService.updateDistrict(
    req.params.id,
    req.body as UpdateDistrictInput,
  );
  res.status(200).json(ok(district, 'Distrito actualizado exitosamente'));
}

export async function deleteDistrict(req: Request, res: Response): Promise<void> {
  resolveGlobalScope(req.user!);
  await hierarchyService.deleteDistrict(req.params.id);
  res.status(200).json(ok(null, 'Distrito eliminada exitosamente'));
}
