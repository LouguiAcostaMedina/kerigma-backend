import { db } from '../models';
import type { AuditAction } from '../models/AuditLog.model';

export interface AuditInput {
  actorUserId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown> | null;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'passwordResetToken',
  'access_token',
  'token',
  'refreshToken',
]);

/**
 * Registra un evento de auditoría en AuditLogs. Es tolerante a fallos a propósito:
 * si el registro falla (DB caída, red, etc.) solo se loguea y no se rompe el flujo principal.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.AuditLog.create(input);
  } catch (error) {
    console.error('[audit] No se pudo registrar el evento de auditoría:', error);
  }
}

/** Variante fire-and-forget para no bloquear respuestas HTTP. */
export function recordAuditAsync(input: AuditInput): void {
  void recordAudit(input);
}

/** Filtra campos sensibles antes de persistir el payload del cambio. */
export function sanitizeChanges(
  changes: Record<string, unknown> | undefined | null,
): Record<string, unknown> | null {
  if (!changes) {
    return null;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (!SENSITIVE_KEYS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}
