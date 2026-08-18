import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

type Role = 'super_admin' | 'admin' | 'director' | 'leader' | 'reader' | 'tesorero';

/**
 * Middleware que exige que el usuario autenticado tenga al menos uno de los roles dados.
 * Uso: router.get('/', requireAuth, requireRole('super_admin', 'admin', 'director'), handler)
 *
 * La revalidación de permisos se mantiene también en los servicios como defensa en profundidad.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!allowedRoles.includes(req.user.role as Role)) {
      next(new ForbiddenError('No tiene permisos para realizar esta acción'));
      return;
    }
    next();
  };
}

const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  super_admin: ['*'],
  admin: ['*'],
  director: [
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'users.bulk',
    'users.invite',
    'users.reset_password',
    'churches.*',
    'members.*',
    'groups.*',
    'students.*',
  ],
  leader: [
    'members.read',
    'members.create',
    'members.update',
    'groups.read',
    'groups.create',
    'groups.update',
    'students.read',
    'students.create',
    'students.update',
  ],
  reader: ['members.read', 'groups.read', 'students.read'],
  tesorero: [
    'members.read',
    'financial.read',
    'financial.create',
    'financial.delete',
    'financial.reports',
  ],
};

function permissionMatches(permissions: readonly string[], required: string): boolean {
  return permissions.some((permission) => {
    if (permission === '*') {
      return true;
    }
    if (permission.endsWith('.*')) {
      return required.startsWith(permission.slice(0, -1));
    }
    return permission === required;
  });
}

/**
 * Middleware de permisos basado en matriz RBAC (<módulo>.<acción> o wildcard <módulo>.* / *).
 * Se usa junto a `requireAuth`. La matriz vive en este archivo para no duplicarla
 * entre backend y frontend; el frontend la consume desde el catálogo en el futuro.
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    const role = req.user.role as Role;
    const granted = ROLE_PERMISSIONS[role] ?? [];
    if (!permissionMatches(granted, permission)) {
      next(new ForbiddenError('No tiene permisos para realizar esta acción'));
      return;
    }
    next();
  };
}
