import type { AuthUser } from '../types/auth';

/**
 * Un usuario con rol 'super_admin' actúa como SuperAdmin global:
 * puede consultar el dashboard consolidado de todas las iglesias activas
 * sin estar asociado a ninguna iglesia en particular.
 *
 * Fallback: un 'admin' sin iglesia asignada (`churchId === null`) conserva
 * el mismo acceso global (dato heredado de `create-admin.ts`).
 */
export function isGlobalAdmin(user: Pick<AuthUser, 'role' | 'churchId'>): boolean {
  if (user.role === 'super_admin') {
    return true;
  }
  return user.role === 'admin' && user.churchId === null;
}
