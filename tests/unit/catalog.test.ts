import { describe, expect, it } from 'vitest';
import {
  CATALOGS,
  getCatalog,
  listCatalogNames,
  toEntries,
  toMap,
} from '../../src/catalogs/catalog';

describe('catálogo único (catalog.ts)', () => {
  it('expone todos los catálogos esperados', () => {
    const names = listCatalogNames();
    for (const expected of [
      'roles',
      'userStatuses',
      'genders',
      'churchStatuses',
      'groupTypes',
      'groupCategories',
      'groupStatuses',
      'meetingDays',
      'memberStatuses',
      'memberSpiritualStatuses',
      'memberMaritalStatuses',
      'memberEducationLevels',
      'studentStatuses',
      'studentPrograms',
      'studentLevels',
      'disciplePairStatuses',
      'attendanceMeetingTypes',
      'quarterPeriods',
      'weeklyMetricStatuses',
      'quarterlyGoalTypes',
      'quarterlyGoalStatuses',
      'reportEntities',
    ]) {
      expect(names).toContain(expected);
    }
  });

  it('el catálogo de roles coincide con los roles del sistema', () => {
    const roles = getCatalog('roles')!;
    expect(roles.values).toEqual(['super_admin', 'admin', 'director', 'leader', 'reader']);
  });

  it('getCatalog devuelve undefined para catálogos inexistentes', () => {
    expect(getCatalog('no-existe')).toBeUndefined();
  });

  it('toEntries genera pares [valor, etiqueta] consistentes', () => {
    const entries = toEntries(getCatalog('roles')!);
    expect(entries).toContainEqual(['super_admin', 'Super Admin']);
    expect(entries).toContainEqual(['leader', 'Líder']);
  });

  it('toMap genera un mapeo valor -> etiqueta', () => {
    const map = toMap(getCatalog('genders')!);
    expect(map.male).toBe('Masculino');
    expect(map.female).toBe('Femenino');
  });

  it('cada catálogo tiene values y labels alineados en longitud', () => {
    for (const name of listCatalogNames()) {
      const definition = CATALOGS[name as keyof typeof CATALOGS];
      expect(definition.values.length).toBe(definition.labels.length);
    }
  });
});
