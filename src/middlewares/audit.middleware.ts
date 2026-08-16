import type { NextFunction, Request, Response } from 'express';
import type { AuditAction } from '../models/AuditLog.model';
import { recordAuditAsync, sanitizeChanges } from '../services/audit.service';

const ACTION_BY_METHOD: Record<'POST' | 'PUT' | 'PATCH' | 'DELETE', AuditAction> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

/**
 * Middleware de auditoría automática: registra en AuditLogs cualquier mutación exitosa
 * (POST/PUT/PATCH/DELETE) sobre las rutas de la API. Se ejecuta tras completar la
 * respuesta (evento 'finish') para no bloquear el request. Solo registra códigos 2xx.
 */
export function audit({ excludePaths = [/^\/auth\//, /^\/import\//] } = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    const action = ACTION_BY_METHOD[method];

    res.on('finish', () => {
      if (!action || res.statusCode < 200 || res.statusCode >= 300 || !req.user) {
        return;
      }
      const basePath = req.baseUrl || '';
      const path = `${basePath}${req.path}`;
      if (excludePaths.some((pattern) => pattern.test(path))) {
        return;
      }

      const entity = path.split('/').filter(Boolean)[0] || 'unknown';
      const entityId = req.params?.id ?? req.params?.memberId ?? req.params?.groupId ?? req.params?.studentId ?? '';

      recordAuditAsync({
        actorUserId: req.user.id,
        entity,
        entityId,
        action: req.method === 'PATCH' && entityId ? 'status_change' : action,
        changes: sanitizeChanges(req.body),
      });
    });

    next();
  };
}
