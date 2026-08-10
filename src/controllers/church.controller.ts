import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateChurchInput,
  ListChurchesQuery,
  UpdateChurchInput,
} from '../schemas/church.schema';
import * as churchService from '../services/church.service';
import * as bulkImportService from '../services/bulkImport.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError, ValidationError } from '../utils/errors';
import { buildExcelBuffer, parseExcelBuffer, sendExcelResponse } from '../utils/excel';

function resolveChurchId(user: AuthUser): string | null {
  if (isGlobalAdmin(user)) {
    return null;
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

function requireScopedChurch(user: AuthUser): string {
  const churchId = resolveChurchId(user);
  if (!churchId) {
    throw new ForbiddenError('Esta operación requiere estar asociado a una iglesia específica');
  }
  return churchId;
}

const CHURCH_IMPORT_TYPES = ['members', 'groups', 'students'] as const;

export async function listPublicChurches(_req: Request, res: Response): Promise<void> {
  const churches = await churchService.listPublicChurches();
  res.status(200).json(ok(churches));
}

export async function listChurches(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const query = req.query as unknown as ListChurchesQuery;
  const { churches, total } = await churchService.listChurches(churchId, query);
  res.status(200).json(paginated(churches, total, query.page, query.limit));
}

export async function getChurchesStats(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const stats = await churchService.getChurchesStats(churchId);
  res.status(200).json(ok(stats));
}

export async function getChurch(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const church = await churchService.getChurch(churchId, req.params.id);
  res.status(200).json(ok(church));
}

export async function createChurch(req: Request, res: Response): Promise<void> {
  const church = await churchService.createChurch(req.user!.id, req.body as CreateChurchInput);
  res.status(201).json(ok(church, 'Iglesia creada exitosamente'));
}

export async function updateChurch(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const church = await churchService.updateChurch(churchId, req.params.id, req.user!.id, req.body as UpdateChurchInput);
  res.status(200).json(ok(church, 'Iglesia actualizada exitosamente'));
}

export async function updateChurchStatus(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const church = await churchService.updateChurchStatus(
    churchId,
    req.params.id,
    req.user!.id,
    (req.body as { status: 'active' | 'construction' | 'planning' | 'inactive' }).status,
  );
  res.status(200).json(ok(church, 'Estado de la iglesia actualizado'));
}

export async function deleteChurch(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  await churchService.deleteChurch(churchId, req.params.id);
  res.status(200).json(ok(null, 'Iglesia eliminada exitosamente'));
}

export async function deleteMultipleChurches(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const ids = (req.body as { ids: string[] }).ids;
  await churchService.deleteMultipleChurches(churchId, ids);
  res.status(200).json(ok(null, `${ids.length} iglesia(s) eliminada(s)`));
}

export async function getChurchStatistics(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const stats = await churchService.getChurchStatistics(churchId, req.params.id);
  res.status(200).json(ok(stats));
}

export async function importChurchExcel(req: Request, res: Response): Promise<void> {
  const churchId = requireScopedChurch(req.user!);
  if (!req.file) {
    throw new ValidationError('Debe adjuntar un archivo Excel');
  }
  const type = typeof req.body.type === 'string' ? req.body.type : 'groups';
  if (!(CHURCH_IMPORT_TYPES as readonly string[]).includes(type)) {
    throw new ValidationError('Tipo de importación no soportado. Use members, groups o students');
  }
  const rows = parseExcelBuffer(req.file.buffer);
  if (rows.length === 0) {
    throw new ValidationError('El archivo Excel no contiene filas de datos');
  }
  const groupId = typeof req.body.groupId === 'string' && req.body.groupId ? req.body.groupId : undefined;
  const result = await bulkImportService.executeBulkImport(
    { entity: type, rows, groupId },
    churchId,
    req.user!.id,
  );
  const status = result.errors.length > 0 && result.imported === 0 ? 422 : 200;
  res
    .status(status)
    .json(ok(result, `Importación completada: ${result.imported} importados, ${result.skipped} omitidos`));
}

export async function exportChurchExcel(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const exportType = typeof req.body.type === 'string' ? req.body.type : 'complete';
  const sheets = await churchService.exportChurchData(churchId, req.params.id, exportType);
  const buffer = buildExcelBuffer(sheets);
  sendExcelResponse(res, buffer, `iglesia_${req.params.id}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
