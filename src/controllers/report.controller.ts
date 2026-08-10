import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateReportInput,
  ListReportsQuery,
  UpdateReportInput,
} from '../schemas/report.schema';
import * as reportService from '../services/report.service';
import { ok, paginated } from '../utils/apiResponse';

function actor(req: Request): AuthUser {
  return req.user!;
}

export async function listPredefinedReports(_req: Request, res: Response): Promise<void> {
  const reports = reportService.getPredefinedReports(actor(_req));
  res.status(200).json(ok(reports));
}

export async function executePredefinedReport(req: Request, res: Response): Promise<void> {
  const params = (req.body as Record<string, unknown>) ?? {};
  const result = await reportService.executePredefinedReport(req.params.id, params, actor(req));
  res.status(200).json(ok(result, 'Reporte ejecutado correctamente'));
}

export async function listCustomReports(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListReportsQuery;
  const { reports, total, page } = await reportService.listCustomReports(actor(req), query);
  res.status(200).json(paginated(reports, total, page, query.limit));
}

export async function getCustomReport(req: Request, res: Response): Promise<void> {
  const report = await reportService.getCustomReport(actor(req), req.params.id);
  res.status(200).json(ok(report));
}

export async function createCustomReport(req: Request, res: Response): Promise<void> {
  const report = await reportService.createCustomReport(actor(req), req.body as CreateReportInput);
  res.status(201).json(ok(report, 'Reporte creado correctamente'));
}

export async function updateCustomReport(req: Request, res: Response): Promise<void> {
  const report = await reportService.updateCustomReport(actor(req), req.params.id, req.body as UpdateReportInput);
  res.status(200).json(ok(report, 'Reporte actualizado correctamente'));
}

export async function deleteCustomReport(req: Request, res: Response): Promise<void> {
  await reportService.deleteCustomReport(actor(req), req.params.id);
  res.status(200).json(ok(null, 'Reporte eliminado correctamente'));
}

export async function deleteMultipleReports(req: Request, res: Response): Promise<void> {
  const ids = (req.body as { ids: string[] }).ids;
  await reportService.deleteMultipleReports(actor(req), ids);
  res.status(200).json(ok(null, `${ids.length} reporte(s) eliminado(s)`));
}

export async function executeCustomReport(req: Request, res: Response): Promise<void> {
  const params = (req.body as Record<string, unknown>) ?? {};
  const result = await reportService.executeCustomReport(actor(req), req.params.id, params);
  res.status(200).json(ok(result, 'Reporte ejecutado correctamente'));
}

export async function getAvailableFields(req: Request, res: Response): Promise<void> {
  const entity = req.params.entity as Parameters<typeof reportService.getAvailableFields>[0];
  const fields = reportService.getAvailableFields(entity);
  res.status(200).json(ok(fields));
}

export async function getAggregationFunctions(_req: Request, res: Response): Promise<void> {
  res.status(200).json(ok(reportService.getAggregationFunctions()));
}

export async function previewReport(req: Request, res: Response): Promise<void> {
  const result = await reportService.previewReport(actor(req), req.body as CreateReportInput);
  res.status(200).json(ok(result, 'Previsualización generada'));
}

export async function getMembershipGrowthReport(req: Request, res: Response): Promise<void> {
  const data = await reportService.getMembershipGrowthReport(actor(req));
  res.status(200).json(ok(data));
}

export async function getGroupActivityReport(req: Request, res: Response): Promise<void> {
  const data = await reportService.getGroupActivityReport(actor(req));
  res.status(200).json(ok(data));
}

export async function getBibleStudentProgressReport(req: Request, res: Response): Promise<void> {
  const data = await reportService.getBibleStudentProgressReport(actor(req));
  res.status(200).json(ok(data));
}

export async function getBaptismConversionReport(req: Request, res: Response): Promise<void> {
  const data = await reportService.getBaptismConversionReport(actor(req));
  res.status(200).json(ok(data));
}

export async function getLeaderPerformanceReport(req: Request, res: Response): Promise<void> {
  const data = await reportService.getLeaderPerformanceReport(actor(req));
  res.status(200).json(ok(data));
}

export async function getComparativeReport(req: Request, res: Response): Promise<void> {
  const params = (req.body as Record<string, unknown>) ?? {};
  const result = await reportService.getComparativeReport(actor(req), params);
  res.status(200).json(ok(result));
}

export async function getChurchComparativeReport(req: Request, res: Response): Promise<void> {
  const params = (req.body as Record<string, unknown>) ?? {};
  const result = await reportService.getChurchComparativeReport(actor(req), params);
  res.status(200).json(ok(result));
}

export async function exportReport(req: Request, res: Response): Promise<void> {
  const params = (req.body as Record<string, unknown>) ?? {};
  const result = await reportService.exportReport(
    actor(req),
    req.params.reportId,
    req.params.reportType,
    req.params.format,
    params,
  );
  res.status(200).json(ok(result, 'Reporte exportado correctamente'));
}

export async function scheduleReport(req: Request, res: Response): Promise<void> {
  const body = req.body as { reportId: string; scheduleConfig?: Record<string, unknown> };
  const { reportId, scheduleConfig, ...rest } = body;
  const result = await reportService.scheduleReport(actor(req), reportId, {
    ...(scheduleConfig ?? {}),
    ...rest,
  });
  res.status(200).json(ok(result, 'Reporte programado correctamente'));
}

export async function listScheduledReports(req: Request, res: Response): Promise<void> {
  const reports = await reportService.listScheduledReports(actor(req));
  res.status(200).json(ok(reports));
}

export async function cancelScheduledReport(req: Request, res: Response): Promise<void> {
  await reportService.cancelScheduledReport(actor(req), req.params.id);
  res.status(200).json(ok(null, 'Programación de reporte cancelada'));
}

export async function getReportTemplates(req: Request, res: Response): Promise<void> {
  const category = typeof req.query.category === 'string' ? req.query.category : null;
  res.status(200).json(ok(reportService.getReportTemplates(category)));
}

export async function createReportFromTemplate(req: Request, res: Response): Promise<void> {
  const customizations = (req.body as Record<string, unknown>) ?? {};
  const report = await reportService.createReportFromTemplate(actor(req), req.params.id, customizations);
  res.status(201).json(ok(report, 'Reporte creado desde plantilla'));
}

export async function getUsageStats(req: Request, res: Response): Promise<void> {
  const params = (req.query as Record<string, unknown>) ?? {};
  const stats = await reportService.getUsageStats(actor(req), params);
  res.status(200).json(ok(stats));
}

export async function getPopularReports(req: Request, res: Response): Promise<void> {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;
  const reports = await reportService.getPopularReports(actor(req), Number.isFinite(limit) ? limit : 10);
  res.status(200).json(ok(reports));
}

export async function getStatsSummary(req: Request, res: Response): Promise<void> {
  const summary = await reportService.getStatsSummary(actor(req));
  res.status(200).json(ok(summary));
}

export async function shareReport(req: Request, res: Response): Promise<void> {
  const userIds = (req.body as { userIds: string[] }).userIds;
  const report = await reportService.shareReport(actor(req), req.params.id, userIds);
  res.status(200).json(ok(report, 'Reporte compartido correctamente'));
}

export async function listSharedReports(req: Request, res: Response): Promise<void> {
  const reports = await reportService.listSharedReports(actor(req));
  res.status(200).json(ok(reports));
}

export async function getUserReportConfig(_req: Request, res: Response): Promise<void> {
  res.status(200).json(ok(reportService.getUserReportConfig()));
}

export async function updateUserReportConfig(req: Request, res: Response): Promise<void> {
  const config = reportService.updateUserReportConfig((req.body as Record<string, unknown>) ?? {});
  res.status(200).json(ok(config, 'Configuración actualizada'));
}
