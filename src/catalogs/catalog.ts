/**
 * Catálogo único de valores del sistema (Fase 2.1).
 *
 * Fuente única de verdad para roles, estados y tipos que hoy viven hardcodeados
 * en el frontend. Los valores coinciden con los enums de `types/models.ts`,
 * `types/auth.ts` y los schemas Zod de `schemas/`.
 */

export interface CatalogEntry {
  value: string;
  label: string;
}

export interface CatalogDefinition {
  values: readonly string[];
  labels: Readonly<Record<string, string>>;
}

export function toEntries(definition: CatalogDefinition): CatalogEntry[] {
  return definition.values.map((value) => ({
    value,
    label: definition.labels[value] ?? value,
  }));
}

export function toMap(definition: CatalogDefinition): Record<string, string> {
  return definition.values.reduce<Record<string, string>>((acc, value) => {
    acc[value] = definition.labels[value] ?? value;
    return acc;
  }, {});
}

export function defineCatalog(values: readonly string[], labels: Record<string, string>): CatalogDefinition {
  return { values, labels };
}

export const CATALOGS = {
  roles: defineCatalog(
    ['super_admin', 'admin', 'director', 'leader', 'reader'],
    {
      super_admin: 'Super Administrador',
      admin: 'Administrador',
      director: 'Director',
      leader: 'Líder',
      reader: 'Lector',
    },
  ),

  userStatuses: defineCatalog(
    ['active', 'inactive', 'suspended', 'pending'],
    {
      active: 'Activo',
      inactive: 'Inactivo',
      suspended: 'Suspendido',
      pending: 'Pendiente',
    },
  ),

  genders: defineCatalog(
    ['male', 'female', 'other', 'prefer_not_to_say'],
    {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      prefer_not_to_say: 'Prefiere no decir',
    },
  ),

  churchStatuses: defineCatalog(
    ['active', 'construction', 'planning', 'inactive'],
    {
      active: 'Activa',
      construction: 'En construcción',
      planning: 'En planeación',
      inactive: 'Inactiva',
    },
  ),

  groupTypes: defineCatalog(
    [
      'youth',
      'adults',
      'children',
      'seniors',
      'couples',
      'singles',
      'women',
      'men',
      'students',
      'professionals',
      'mixed',
    ],
    {
      youth: 'Jóvenes',
      adults: 'Adultos',
      children: 'Niños',
      seniors: 'Adultos mayores',
      couples: 'Parejas',
      singles: 'Solteros',
      women: 'Mujeres',
      men: 'Hombres',
      students: 'Estudiantes',
      professionals: 'Profesionales',
      mixed: 'Mixto',
    },
  ),

  groupCategories: defineCatalog(
    ['bible_study', 'prayer', 'evangelism', 'discipleship', 'worship', 'service', 'fellowship', 'training', 'mission'],
    {
      bible_study: 'Estudio bíblico',
      prayer: 'Oración',
      evangelism: 'Evangelismo',
      discipleship: 'Discipulado',
      worship: 'Adoración',
      service: 'Servicio',
      fellowship: 'Comunión',
      training: 'Capacitación',
      mission: 'Misión',
    },
  ),

  groupStatuses: defineCatalog(
    ['planning', 'active', 'paused', 'completed', 'cancelled'],
    {
      planning: 'Planeación',
      active: 'Activo',
      paused: 'Pausado',
      completed: 'Completado',
      cancelled: 'Cancelado',
    },
  ),

  meetingDays: defineCatalog(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    },
  ),

  memberStatuses: defineCatalog(
    ['active', 'inactive', 'suspended', 'transferred', 'graduated'],
    {
      active: 'Activo',
      inactive: 'Inactivo',
      suspended: 'Suspendido',
      transferred: 'Transferido',
      graduated: 'Graduado',
    },
  ),

  memberSpiritualStatuses: defineCatalog(
    ['new_believer', 'growing', 'mature', 'leader', 'teacher', 'visitor', 'inactive', 'other'],
    {
      new_believer: 'Nuevo creyente',
      growing: 'En crecimiento',
      mature: 'Maduro',
      leader: 'Líder',
      teacher: 'Maestro',
      visitor: 'Visitante',
      inactive: 'Inactivo',
      other: 'Otro',
    },
  ),

  memberMaritalStatuses: defineCatalog(
    ['single', 'married', 'divorced', 'widowed', 'other'],
    {
      single: 'Soltero/a',
      married: 'Casado/a',
      divorced: 'Divorciado/a',
      widowed: 'Viudo/a',
      other: 'Otro',
    },
  ),

  memberEducationLevels: defineCatalog(
    ['elementary', 'high_school', 'technical', 'university', 'graduate', 'other', 'not_specified'],
    {
      elementary: 'Primaria',
      high_school: 'Secundaria',
      technical: 'Técnico',
      university: 'Universidad',
      graduate: 'Postgrado',
      other: 'Otro',
      not_specified: 'No especificado',
    },
  ),

  studentStatuses: defineCatalog(
    ['enrolled', 'active', 'completed', 'dropped', 'suspended', 'graduated'],
    {
      enrolled: 'Inscrito',
      active: 'Activo',
      completed: 'Completado',
      dropped: 'Retirado',
      suspended: 'Suspendido',
      graduated: 'Graduado',
    },
  ),

  studentPrograms: defineCatalog(
    [
      'basic_bible',
      'intermediate_bible',
      'advanced_bible',
      'theology',
      'discipleship',
      'leadership',
      'missions',
      'evangelism',
      'counseling',
      'other',
    ],
    {
      basic_bible: 'Biblia Básica',
      intermediate_bible: 'Biblia Intermedia',
      advanced_bible: 'Biblia Avanzada',
      theology: 'Teología',
      discipleship: 'Discipulado',
      leadership: 'Liderazgo',
      missions: 'Misiones',
      evangelism: 'Evangelismo',
      counseling: 'Consejería',
      other: 'Otro',
    },
  ),

  studentLevels: defineCatalog(
    ['beginner', 'intermediate', 'advanced', 'graduate'],
    {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      graduate: 'Graduado',
    },
  ),

  disciplePairStatuses: defineCatalog(
    ['active', 'paused', 'completed', 'cancelled'],
    {
      active: 'Activa',
      paused: 'Pausada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    },
  ),

  attendanceMeetingTypes: defineCatalog(
    ['regular', 'special', 'evangelism', 'community', 'prayer', 'study', 'other'],
    {
      regular: 'Regular',
      special: 'Especial',
      evangelism: 'Evangelismo',
      community: 'Comunidad',
      prayer: 'Oración',
      study: 'Estudio',
      other: 'Otro',
    },
  ),

  quarterPeriods: defineCatalog(
    ['first', 'second', 'third', 'fourth', 'annual'],
    {
      first: 'Primero',
      second: 'Segundo',
      third: 'Tercero',
      fourth: 'Cuarto',
      annual: 'Anual',
    },
  ),

  weeklyMetricStatuses: defineCatalog(
    ['draft', 'pending', 'approved', 'rejected'],
    {
      draft: 'Borrador',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    },
  ),

  quarterlyGoalTypes: defineCatalog(
    ['comunion', 'relacionamiento', 'mision'],
    {
      comunion: 'Comunión',
      relacionamiento: 'Relacionamiento',
      mision: 'Misión',
    },
  ),

  quarterlyGoalStatuses: defineCatalog(
    ['not_started', 'in_progress', 'achieved', 'missed', 'cancelled'],
    {
      not_started: 'No iniciada',
      in_progress: 'En progreso',
      achieved: 'Alcanzada',
      missed: 'No alcanzada',
      cancelled: 'Cancelada',
    },
  ),

  reportEntities: defineCatalog(
    ['members', 'groups', 'students', 'users', 'churches', 'attendance', 'goals', 'metrics'],
    {
      members: 'Miembros',
      groups: 'Grupos',
      students: 'Estudiantes',
      users: 'Usuarios',
      churches: 'Iglesias',
      attendance: 'Asistencia',
      goals: 'Metas',
      metrics: 'Métricas',
    },
  ),
} satisfies Record<string, CatalogDefinition>;

export type CatalogName = keyof typeof CATALOGS;

export function getCatalog(name: string): CatalogDefinition | null {
  return name in CATALOGS ? (CATALOGS[name as CatalogName] as CatalogDefinition) : null;
}

export function listCatalogNames(): string[] {
  return Object.keys(CATALOGS);
}
