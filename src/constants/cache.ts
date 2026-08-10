export const DASHBOARD_CACHE_TTL_SECONDS = 15 * 60;
export const KPIS_CACHE_TTL_SECONDS = 5 * 60;

export const GLOBAL_CHURCH_ID = '__global__';

export function dashboardSpiritualHealthKey(churchId: string): string {
  return `dashboard:spiritual-health:${churchId}`;
}

export function dashboardKpisKey(churchId: string): string {
  return `dashboard:kpis:${churchId}`;
}

export const DASHBOARD_CACHE_PREFIX = 'dashboard:';
