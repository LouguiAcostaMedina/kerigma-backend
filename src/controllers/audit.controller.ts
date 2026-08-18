import type { Request, Response } from 'express';
import type { ListAuditLogsQuery } from '../schemas/audit.schema';
import * as auditQueryService from '../services/auditQuery.service';
import { ok, paginated } from '../utils/apiResponse';

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListAuditLogsQuery;
  const { logs, total, page } = await auditQueryService.listAuditLogs(query);
  res.status(200).json(paginated(logs, total, page, query.limit));
}

export async function getAuditLogById(req: Request, res: Response): Promise<void> {
  const log = await auditQueryService.getAuditLogById(req.params.id);
  res.status(200).json(ok(log));
}

export async function getAuditStats(req: Request, res: Response): Promise<void> {
  const raw = req.query.days;
  const days = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : 30;
  const stats = await auditQueryService.getAuditStats(Number.isFinite(days) && days > 0 ? days : 30);
  res.status(200).json(ok(stats));
}
