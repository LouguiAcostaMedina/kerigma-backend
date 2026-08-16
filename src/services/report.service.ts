import { Op, QueryTypes, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { CustomReport } from '../models/CustomReport.model';
import type { AuthUser } from '../types/auth';
import type {
  CreateReportInput,
  ListReportsQuery,
  ReportEntity,
  ReportFilter,
  UpdateReportInput,
} from '../schemas/report.schema';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { isGlobalAdmin } from '../utils/roles';

// ===================== DEFINICIONES =====================

interface FieldDef {
  column: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface PredefinedReportDef {
  id: string;
  name: string;
  description: string;
  category: string;
  entity: ReportEntity;
  type: 'predefined';
}

interface AggregateConfig {
  entity: ReportEntity;
  filters?: ReportFilter[];
  groupBy?: string | null;
  timeGroup?: boolean;
  aggregateFunction?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  aggregateField?: string | null;
  limit?: number | null;
  scopeChurchId: string | null;
}

export interface ReportQueryResult {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
  summary: { total: number; generatedAt: string };
}

export interface ReportSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  entity: ReportEntity;
  fields: string[];
  filters: ReportFilter[];
  groupBy: string | null;
  aggregateFunction: string | null;
  aggregateField: string | null;
  sortBy: string | null;
  sortOrder: 'ASC' | 'DESC' | null;
  limit: number | null;
  isScheduled: boolean;
  scheduleConfig: Record<string, unknown>;
  lastExecutedAt: Date | null;
  timesExecuted: number;
  isPublic: boolean;
  author: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

const ENTITY_TABLES: Record<ReportEntity, string> = {
  members: 'Members',
  groups: 'Groups',
  students: 'BibleStudents',
  users: 'Users',
  churches: 'Churches',
  attendance: 'AttendanceRecords',
  goals: 'QuarterlyGoals',
  metrics: 'WeeklyMetrics',
};

const ENTITY_FIELDS: Record<ReportEntity, FieldDef[]> = {
  members: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'firstName', label: 'Nombre', type: 'text' },
    { column: 'lastName', label: 'Apellido', type: 'text' },
    { column: 'email', label: 'Email', type: 'text' },
    { column: 'phone', label: 'Teléfono', type: 'text' },
    { column: 'gender', label: 'Género', type: 'text' },
    { column: 'city', label: 'Ciudad', type: 'text' },
    { column: 'district', label: 'Distrito', type: 'text' },
    { column: 'groupId', label: 'Grupo', type: 'text' },
    { column: 'baptized', label: 'Bautizado', type: 'boolean' },
    { column: 'baptismDate', label: 'Fecha de Bautismo', type: 'date' },
    { column: 'conversionDate', label: 'Fecha de Conversión', type: 'date' },
    { column: 'spiritualStatus', label: 'Estado Espiritual', type: 'text' },
    { column: 'joinDate', label: 'Fecha de Ingreso', type: 'date' },
    { column: 'status', label: 'Estado', type: 'text' },
    { column: 'attendanceScore', label: 'Índice de Asistencia', type: 'number' },
    { column: 'occupation', label: 'Ocupación', type: 'text' },
    { column: 'education', label: 'Educación', type: 'text' },
    { column: 'isActive', label: 'Activo', type: 'boolean' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  groups: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'name', label: 'Nombre', type: 'text' },
    { column: 'churchId', label: 'Iglesia', type: 'text' },
    { column: 'leaderId', label: 'Líder', type: 'text' },
    { column: 'mainTeacherId', label: 'Maestro Principal', type: 'text' },
    { column: 'associateTeacherId', label: 'Maestro Asociado', type: 'text' },
    { column: 'type', label: 'Tipo', type: 'text' },
    { column: 'category', label: 'Categoría', type: 'text' },
    { column: 'meetingDay', label: 'Día de Reunión', type: 'text' },
    { column: 'meetingTime', label: 'Hora de Reunión', type: 'text' },
    { column: 'meetingDuration', label: 'Duración (min)', type: 'number' },
    { column: 'maxCapacity', label: 'Capacidad Máxima', type: 'number' },
    { column: 'currentSize', label: 'Tamaño Actual', type: 'number' },
    { column: 'isActive', label: 'Activo', type: 'boolean' },
    { column: 'status', label: 'Estado', type: 'text' },
    { column: 'startDate', label: 'Fecha de Inicio', type: 'date' },
    { column: 'endDate', label: 'Fecha de Fin', type: 'date' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  students: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'churchId', label: 'Iglesia', type: 'text' },
    { column: 'groupId', label: 'Grupo', type: 'text' },
    { column: 'firstName', label: 'Nombre', type: 'text' },
    { column: 'lastName', label: 'Apellido', type: 'text' },
    { column: 'email', label: 'Email', type: 'text' },
    { column: 'phone', label: 'Teléfono', type: 'text' },
    { column: 'gender', label: 'Género', type: 'text' },
    { column: 'enrollmentDate', label: 'Fecha de Inscripción', type: 'date' },
    { column: 'program', label: 'Programa', type: 'text' },
    { column: 'level', label: 'Nivel', type: 'text' },
    { column: 'status', label: 'Estado', type: 'text' },
    { column: 'graduated', label: 'Graduado', type: 'boolean' },
    { column: 'baptism', label: 'Bautizado', type: 'boolean' },
    { column: 'churchMember', label: 'Miembro de Iglesia', type: 'boolean' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  users: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'firstName', label: 'Nombre', type: 'text' },
    { column: 'lastName', label: 'Apellido', type: 'text' },
    { column: 'email', label: 'Email', type: 'text' },
    { column: 'role', label: 'Rol', type: 'text' },
    { column: 'phone', label: 'Teléfono', type: 'text' },
    { column: 'churchId', label: 'Iglesia', type: 'text' },
    { column: 'isActive', label: 'Activo', type: 'boolean' },
    { column: 'isApproved', label: 'Aprobado', type: 'boolean' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  churches: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'name', label: 'Nombre', type: 'text' },
    { column: 'city', label: 'Ciudad', type: 'text' },
    { column: 'state', label: 'Estado', type: 'text' },
    { column: 'country', label: 'País', type: 'text' },
    { column: 'status', label: 'Estado', type: 'text' },
    { column: 'isActive', label: 'Activo', type: 'boolean' },
    { column: 'foundedDate', label: 'Fecha de Fundación', type: 'date' },
    { column: 'capacity', label: 'Capacidad', type: 'number' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  attendance: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'churchId', label: 'Iglesia', type: 'text' },
    { column: 'groupId', label: 'Grupo', type: 'text' },
    { column: 'memberId', label: 'Miembro', type: 'text' },
    { column: 'meetingDate', label: 'Fecha de Reunión', type: 'date' },
    { column: 'meetingType', label: 'Tipo de Reunión', type: 'text' },
    { column: 'isPresent', label: 'Presente', type: 'boolean' },
    { column: 'studiedDaily', label: 'Estudio Diario', type: 'boolean' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  goals: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'churchId', label: 'Iglesia', type: 'text' },
    { column: 'quarterId', label: 'Trimestre', type: 'text' },
    { column: 'groupId', label: 'Grupo', type: 'text' },
    { column: 'goalType', label: 'Tipo de Meta', type: 'text' },
    { column: 'title', label: 'Título', type: 'text' },
    { column: 'targetValue', label: 'Valor Objetivo', type: 'number' },
    { column: 'currentValue', label: 'Valor Actual', type: 'number' },
    { column: 'achievedValue', label: 'Valor Logrado', type: 'number' },
    { column: 'status', label: 'Estado', type: 'text' },
    { column: 'startDate', label: 'Fecha de Inicio', type: 'date' },
    { column: 'dueDate', label: 'Fecha Límite', type: 'date' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
  metrics: [
    { column: 'id', label: 'ID', type: 'text' },
    { column: 'churchId', label: 'Iglesia', type: 'text' },
    { column: 'groupId', label: 'Grupo', type: 'text' },
    { column: 'quarterId', label: 'Trimestre', type: 'text' },
    { column: 'weekStart', label: 'Inicio de Semana', type: 'date' },
    { column: 'weekEnd', label: 'Fin de Semana', type: 'date' },
    { column: 'membersPresent', label: 'Miembros Presentes', type: 'number' },
    { column: 'dailyBibleStudy', label: 'Estudio Diario', type: 'number' },
    { column: 'smallGroupParticipants', label: 'Participantes en Célula', type: 'number' },
    { column: 'totalMeetings', label: 'Total de Reuniones', type: 'number' },
    { column: 'averageAttendance', label: 'Asistencia Promedio', type: 'number' },
    { column: 'newMembers', label: 'Miembros Nuevos', type: 'number' },
    { column: 'netGrowth', label: 'Crecimiento Neto', type: 'number' },
    { column: 'totalMembersStart', label: 'Miembros Inicio', type: 'number' },
    { column: 'totalMembersEnd', label: 'Miembros Fin', type: 'number' },
    { column: 'newConversions', label: 'Nuevas Conversiones', type: 'number' },
    { column: 'baptisms', label: 'Bautismos', type: 'number' },
    { column: 'newStudents', label: 'Estudiantes Nuevos', type: 'number' },
    { column: 'graduatedStudents', label: 'Estudiantes Graduados', type: 'number' },
    { column: 'activeStudents', label: 'Estudiantes Activos', type: 'number' },
    { column: 'evangelisticEvents', label: 'Eventos Evangelísticos', type: 'number' },
    { column: 'communityServices', label: 'Servicios Comunitarios', type: 'number' },
    { column: 'specialMeetings', label: 'Reuniones Especiales', type: 'number' },
    { column: 'offerings', label: 'Ofrendas', type: 'text' },
    { column: 'status', label: 'Estado', type: 'text' },
    { column: 'createdAt', label: 'Creado', type: 'date' },
  ],
};

export const PREDEFINED_REPORTS: PredefinedReportDef[] = [
  {
    id: 'membership-growth',
    name: 'Crecimiento de Membresía',
    description: 'Evolución mensual de los miembros de la iglesia',
    category: 'membership',
    entity: 'members',
    type: 'predefined',
  },
  {
    id: 'group-activity',
    name: 'Actividad de Grupos',
    description: 'Distribución de los grupos por estado',
    category: 'groups',
    entity: 'groups',
    type: 'predefined',
  },
  {
    id: 'bible-student-progress',
    name: 'Progreso de Estudiantes Bíblicos',
    description: 'Distribución de estudiantes por nivel',
    category: 'students',
    entity: 'students',
    type: 'predefined',
  },
  {
    id: 'baptism-conversion',
    name: 'Bautismos y Conversiones',
    description: 'Estudiantes bautizados frente al total',
    category: 'baptisms',
    entity: 'students',
    type: 'predefined',
  },
  {
    id: 'leader-performance',
    name: 'Rendimiento de Líderes',
    description: 'Grupos por líder con su cantidad de miembros',
    category: 'metrics',
    entity: 'groups',
    type: 'predefined',
  },
  {
    id: 'attendance-summary',
    name: 'Resumen de Asistencia',
    description: 'Asistencia registrada por mes',
    category: 'metrics',
    entity: 'attendance',
    type: 'predefined',
  },
  {
    id: 'church-overview',
    name: 'Resumen de Iglesias',
    description: 'Iglesias registradas por estado',
    category: 'metrics',
    entity: 'churches',
    type: 'predefined',
  },
];

const AGGREGATION_FUNCTIONS = [
  { value: 'count', label: 'Conteo' },
  { value: 'sum', label: 'Suma' },
  { value: 'avg', label: 'Promedio' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
];

const REPORT_TEMPLATES = [
  {
    id: 'template-members-by-status',
    name: 'Miembros por Estado',
    description: 'Distribución de miembros según su estado',
    category: 'membership',
    entity: 'members' as ReportEntity,
    fields: [] as string[],
    filters: [] as ReportFilter[],
    groupBy: 'status' as string | null,
    aggregateFunction: 'count' as const,
    aggregateField: null as string | null,
  },
  {
    id: 'template-students-by-level',
    name: 'Estudiantes por Nivel',
    description: 'Distribución de estudiantes según su nivel',
    category: 'students',
    entity: 'students' as ReportEntity,
    fields: [] as string[],
    filters: [] as ReportFilter[],
    groupBy: 'level' as string | null,
    aggregateFunction: 'count' as const,
    aggregateField: null as string | null,
  },
  {
    id: 'template-groups-by-type',
    name: 'Grupos por Tipo',
    description: 'Distribución de grupos según su tipo',
    category: 'groups',
    entity: 'groups' as ReportEntity,
    fields: [] as string[],
    filters: [] as ReportFilter[],
    groupBy: 'type' as string | null,
    aggregateFunction: 'count' as const,
    aggregateField: null as string | null,
  },
  {
    id: 'template-baptisms-total',
    name: 'Total de Bautismos',
    description: 'Conteo de estudiantes bautizados',
    category: 'baptisms',
    entity: 'students' as ReportEntity,
    fields: [] as string[],
    filters: [{ field: 'baptism', operator: 'eq', value: true }] as ReportFilter[],
    groupBy: null as string | null,
    aggregateFunction: 'count' as const,
    aggregateField: null as string | null,
  },
  {
    id: 'template-metrics-average',
    name: 'Promedio de Asistencia Semanal',
    description: 'Promedio de asistencia de las métricas semanales',
    category: 'metrics',
    entity: 'metrics' as ReportEntity,
    fields: [] as string[],
    filters: [] as ReportFilter[],
    groupBy: null as string | null,
    aggregateFunction: 'avg' as const,
    aggregateField: 'averageAttendance' as string | null,
  },
];

// ===================== HELPERS =====================

function assertField(entity: ReportEntity, column: string): FieldDef {
  const def = ENTITY_FIELDS[entity].find((f) => f.column === column);
  if (!def) {
    throw new ValidationError(`Campo desconocido para la entidad "${entity}": ${column}`);
  }
  return def;
}

function resolveScopeChurchId(user: AuthUser): string | null {
  if (isGlobalAdmin(user)) {
    return null;
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

function buildWhere(
  entity: ReportEntity,
  filters: ReportFilter[],
  scopeChurchId: string | null,
): { sql: string; replacements: Record<string, unknown> } {
  const clauses: string[] = [];
  const replacements: Record<string, unknown> = {};
  const qi = db.sequelize.getQueryInterface();
  let index = 0;

  const nextParam = (value: unknown): string => {
    const key = `p${index}`;
    index += 1;
    replacements[key] = value;
    return `:${key}`;
  };

  for (const filter of filters) {
    const def = assertField(entity, filter.field);
    const quoted = qi.quoteIdentifier(def.column);
    const operator = filter.operator ?? 'eq';
    const value = filter.value;

    switch (operator) {
      case 'isNull':
        clauses.push(`${quoted} IS NULL`);
        break;
      case 'notNull':
        clauses.push(`${quoted} IS NOT NULL`);
        break;
      case 'in': {
        if (!Array.isArray(value) || value.length === 0) {
          throw new ValidationError(`El operador 'in' en ${filter.field} requiere un arreglo no vacío`);
        }
        const placeholders = value.map((v) => nextParam(v));
        clauses.push(`${quoted} IN (${placeholders.join(', ')})`);
        break;
      }
      case 'between': {
        if (!Array.isArray(value) || value.length !== 2) {
          throw new ValidationError(`El operador 'between' en ${filter.field} requiere [mínimo, máximo]`);
        }
        clauses.push(`${quoted} BETWEEN ${nextParam(value[0])} AND ${nextParam(value[1])}`);
        break;
      }
      case 'contains':
        clauses.push(`${quoted} ILIKE ${nextParam(`%${String(value ?? '')}%`)}`);
        break;
      case 'startsWith':
        clauses.push(`${quoted} ILIKE ${nextParam(`${String(value ?? '')}%`)}`);
        break;
      case 'endsWith':
        clauses.push(`${quoted} ILIKE ${nextParam(`%${String(value ?? '')}`)}`);
        break;
      case 'ne':
        clauses.push(`${quoted} <> ${nextParam(value ?? null)}`);
        break;
      case 'gt':
        clauses.push(`${quoted} > ${nextParam(value ?? 0)}`);
        break;
      case 'gte':
        clauses.push(`${quoted} >= ${nextParam(value ?? 0)}`);
        break;
      case 'lt':
        clauses.push(`${quoted} < ${nextParam(value ?? 0)}`);
        break;
      case 'lte':
        clauses.push(`${quoted} <= ${nextParam(value ?? 0)}`);
        break;
      case 'eq':
      default:
        clauses.push(`${quoted} = ${nextParam(value ?? null)}`);
        break;
    }
  }

  if (scopeChurchId) {
    const quotedChurch = qi.quoteIdentifier('churchId');
    if (entity === 'churches') {
      clauses.push(`${qi.quoteIdentifier('id')} = :scopeChurchId`);
    } else if (entity === 'members') {
      clauses.push(
        `${qi.quoteIdentifier('groupId')} IN (SELECT ${qi.quoteIdentifier('id')} FROM ${qi.quoteIdentifier(
          'Groups',
        )} WHERE ${quotedChurch} = :scopeChurchId)`,
      );
    } else {
      clauses.push(`${quotedChurch} = :scopeChurchId`);
    }
    replacements.scopeChurchId = scopeChurchId;
  }

  return { sql: clauses.length > 0 ? clauses.join(' AND ') : '1 = 1', replacements };
}

function buildAggregate(
  entity: ReportEntity,
  aggregateFunction: 'count' | 'sum' | 'avg' | 'min' | 'max',
  aggregateField: string | null,
): string {
  const qi = db.sequelize.getQueryInterface();
  if (aggregateFunction === 'count') {
    return 'COUNT(*) AS "value"';
  }
  if (!aggregateField) {
    throw new ValidationError(`La función "${aggregateFunction}" requiere un campo numérico`);
  }
  const def = assertField(entity, aggregateField);
  if (def.type !== 'number') {
    throw new ValidationError(`El campo "${aggregateField}" debe ser numérico para "${aggregateFunction}"`);
  }
  return `${aggregateFunction.toUpperCase()}(${qi.quoteIdentifier(def.column)}) AS "value"`;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  if (out.period instanceof Date) {
    out.period = out.period.toISOString().slice(0, 7);
  }
  if (out.groupValue instanceof Date) {
    out.groupValue = out.groupValue.toISOString().slice(0, 10);
  }
  return out;
}

async function runAggregation(config: AggregateConfig): Promise<ReportQueryResult> {
  const { entity } = config;
  const qi = db.sequelize.getQueryInterface();
  const quotedTable = qi.quoteIdentifier(ENTITY_TABLES[entity]);
  const where = buildWhere(entity, config.filters ?? [], config.scopeChurchId);
  const aggregateFunction = config.aggregateFunction ?? 'count';
  const replacements = { ...where.replacements };

  let selectParts: string[];
  let groupParts: string[] = [];
  let orderClause = '';
  let limitClause = '';

  if (config.timeGroup) {
    const dateDef = assertField(entity, config.groupBy ?? 'createdAt');
    const periodExpr = `DATE_TRUNC('month', ${qi.quoteIdentifier(dateDef.column)})`;
    selectParts = [`${periodExpr} AS "period"`, buildAggregate(entity, aggregateFunction, config.aggregateField ?? null)];
    groupParts = [periodExpr];
    orderClause = ' ORDER BY "period" ASC';
  } else if (config.groupBy) {
    const groupDef = assertField(entity, config.groupBy);
    const quoted = qi.quoteIdentifier(groupDef.column);
    selectParts = [`${quoted} AS "groupValue"`, buildAggregate(entity, aggregateFunction, config.aggregateField ?? null)];
    groupParts = [quoted];
    orderClause = ' ORDER BY "value" DESC';
  } else {
    selectParts = [buildAggregate(entity, aggregateFunction, config.aggregateField ?? null)];
  }

  if (config.limit && config.limit > 0) {
    limitClause = ` LIMIT ${config.limit}`;
  }

  const sql = [
    `SELECT ${selectParts.join(', ')}`,
    `FROM ${quotedTable}`,
    `WHERE ${where.sql}`,
    groupParts.length > 0 ? `GROUP BY ${groupParts.join(', ')}` : '',
    orderClause,
    limitClause,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  const rawRows = await db.sequelize.query<Record<string, unknown>>(sql, {
    replacements,
    type: QueryTypes.SELECT,
  });

  const rows = rawRows.map(normalizeRow);
  const isGrouped = groupParts.length > 0;
  const singleValue = rows[0]?.value as number | undefined;
  const total = isGrouped || aggregateFunction !== 'count' ? rows.length : Number(singleValue ?? 0);

  const columns = [
    ...(config.timeGroup ? [{ key: 'period', label: 'Período' }] : []),
    ...(config.groupBy ? [{ key: 'groupValue', label: 'Grupo' }] : []),
    { key: 'value', label: 'Valor' },
  ];

  return {
    columns,
    rows,
    summary: { total, generatedAt: new Date().toISOString() },
  };
}

function toReportSummary(report: CustomReport): ReportSummary {
  const fullName = report.author
    ? [report.author.firstName, report.author.lastName].filter(Boolean).join(' ')
    : '';
  return {
    id: report.id,
    name: report.name,
    description: report.description,
    category: report.category,
    entity: report.entity,
    fields: report.fields,
    filters: report.filters,
    groupBy: report.groupBy,
    aggregateFunction: report.aggregateFunction,
    aggregateField: report.aggregateField,
    sortBy: report.sortBy,
    sortOrder: report.sortOrder,
    limit: report.limit,
    isScheduled: report.isScheduled,
    scheduleConfig: report.scheduleConfig,
    lastExecutedAt: report.lastExecutedAt,
    timesExecuted: report.timesExecuted,
    isPublic: report.isPublic,
    author: { id: report.userId, name: fullName || 'Usuario' },
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

async function findCustomReport(id: string, scopeChurchId: string | null): Promise<CustomReport> {
  const report = await db.CustomReport.findOne({
    where: { id, ...(scopeChurchId ? { churchId: scopeChurchId } : {}) },
    include: [{ model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  if (!report) {
    throw new NotFoundError('Reporte personalizado no encontrado');
  }
  return report;
}

async function assertCanModifyReport(user: AuthUser, report: CustomReport): Promise<void> {
  if (report.userId !== user.id && !isGlobalAdmin(user)) {
    throw new ForbiddenError('No tiene permisos para modificar este reporte');
  }
}

function scopeWhere(scopeChurchId: string | null): WhereOptions<CustomReport> {
  return scopeChurchId ? { churchId: scopeChurchId } : {};
}

// ===================== REPORTES PREDEFINIDOS =====================

export function getPredefinedReports(user: AuthUser): PredefinedReportDef[] {
  resolveScopeChurchId(user);
  return PREDEFINED_REPORTS.map((report) => ({ ...report, lastExecuted: null }));
}

export async function executePredefinedReport(
  reportId: string,
  params: Record<string, unknown>,
  user: AuthUser,
): Promise<{ report: PredefinedReportDef; data: ReportQueryResult }> {
  const scopeChurchId = resolveScopeChurchId(user);
  const def = PREDEFINED_REPORTS.find((report) => report.id === reportId);
  if (!def) {
    throw new NotFoundError('Reporte predefinido no encontrado');
  }

  let result: ReportQueryResult;

  switch (reportId) {
    case 'membership-growth':
      result = await runAggregation({
        entity: 'members',
        groupBy: 'joinDate',
        timeGroup: true,
        scopeChurchId,
      });
      break;
    case 'attendance-summary':
      result = await runAggregation({
        entity: 'attendance',
        groupBy: 'meetingDate',
        timeGroup: true,
        scopeChurchId,
      });
      break;
    case 'baptism-conversion':
      result = await runAggregation({ entity: 'students', groupBy: 'baptism', scopeChurchId });
      break;
    case 'leader-performance':
      result = await runLeaderPerformance(scopeChurchId, typeof params.limit === 'number' ? params.limit : 10);
      break;
    default:
      result = await runAggregation({ entity: def.entity, groupBy: defaultGroupByFor(def), scopeChurchId });
      break;
  }

  return { report: def, data: result };
}

function defaultGroupByFor(def: PredefinedReportDef): string {
  switch (def.id) {
    case 'group-activity':
      return 'status';
    case 'bible-student-progress':
      return 'level';
    case 'church-overview':
      return 'status';
    default:
      return 'status';
  }
}

async function runLeaderPerformance(scopeChurchId: string | null, limit: number): Promise<ReportQueryResult> {
  const qi = db.sequelize.getQueryInterface();
  const whereClause = scopeChurchId ? `WHERE g.${qi.quoteIdentifier('churchId')} = :scopeChurchId` : '';
  const replacements: Record<string, unknown> = scopeChurchId ? { scopeChurchId } : {};

  const sql = [
    `SELECT u.${qi.quoteIdentifier('firstName')} || ' ' || u.${qi.quoteIdentifier('lastName')} AS "groupValue", COUNT(g.${qi.quoteIdentifier('id')}) AS "value"`,
    `FROM ${qi.quoteIdentifier('Groups')} g`,
    `LEFT JOIN ${qi.quoteIdentifier('Users')} u ON u.${qi.quoteIdentifier('id')} = g.${qi.quoteIdentifier('leaderId')}`,
    whereClause,
    `GROUP BY u.${qi.quoteIdentifier('firstName')}, u.${qi.quoteIdentifier('lastName')}`,
    `ORDER BY "value" DESC`,
    `LIMIT ${Math.min(Math.max(limit, 1), 100)}`,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  const rows = (await db.sequelize.query<Record<string, unknown>>(sql, {
    replacements,
    type: QueryTypes.SELECT,
  })).map(normalizeRow);

  return {
    columns: [
      { key: 'groupValue', label: 'Líder' },
      { key: 'value', label: 'Grupos' },
    ],
    rows,
    summary: { total: rows.length, generatedAt: new Date().toISOString() },
  };
}

// ===================== REPORTES PERSONALIZADOS =====================

export async function listCustomReports(
  user: AuthUser,
  query: ListReportsQuery,
): Promise<{ reports: ReportSummary[]; total: number; page: number; totalPages: number }> {
  const scopeChurchId = resolveScopeChurchId(user);
  const where: WhereOptions<CustomReport> = {
    ...scopeWhere(scopeChurchId),
    [Op.or]: [
      { userId: user.id },
      { isPublic: true },
      { sharedWithUserIds: { [Op.contains]: [user.id] } },
    ],
    ...(query.search ? { name: { [Op.iLike]: `%${query.search}%` } } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.entity ? { entity: query.entity } : {}),
  };

  const total = await db.CustomReport.count({ where });
  const page = query.page;
  const limit = query.limit;
  const totalPages = Math.ceil(total / limit);

  const reports = await db.CustomReport.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    include: [{ model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  return { reports: reports.map(toReportSummary), total, page, totalPages };
}

export async function getCustomReport(user: AuthUser, id: string): Promise<ReportSummary> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(id, scopeChurchId);
  return toReportSummary(report);
}

export async function createCustomReport(user: AuthUser, input: CreateReportInput): Promise<ReportSummary> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await db.CustomReport.create({
    userId: user.id,
    churchId: scopeChurchId,
    name: input.name,
    description: input.description ?? null,
    category: input.category ?? 'custom',
    entity: input.entity,
    fields: input.fields,
    filters: input.filters,
    groupBy: input.groupBy ?? null,
    aggregateFunction: input.aggregateFunction ?? 'count',
    aggregateField: input.aggregateField ?? null,
    sortBy: input.sortBy ?? null,
    sortOrder: (input.sortOrder ?? 'asc').toUpperCase() as 'ASC' | 'DESC',
    limit: input.limit ?? null,
    isScheduled: false,
    scheduleConfig: {},
    timesExecuted: 0,
    isPublic: input.isPublic ?? false,
    sharedWithUserIds: [],
    createdBy: user.id,
    updatedBy: user.id,
  });

  const summary = toReportSummary(report);
  summary.author = { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Usuario' };
  return summary;
}

export async function updateCustomReport(
  user: AuthUser,
  id: string,
  input: UpdateReportInput,
): Promise<ReportSummary> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(id, scopeChurchId);
  await assertCanModifyReport(user, report);

  const changes: Partial<CustomReport> = {
    name: input.name,
    description: input.description,
    category: input.category,
    entity: input.entity,
    fields: input.fields,
    filters: input.filters,
    groupBy: input.groupBy ?? null,
    aggregateFunction: input.aggregateFunction ?? 'count',
    aggregateField: input.aggregateField ?? null,
    sortBy: input.sortBy ?? null,
    sortOrder: (input.sortOrder ?? 'asc').toUpperCase() as 'ASC' | 'DESC',
    limit: input.limit ?? null,
    isPublic: input.isPublic,
    updatedBy: user.id,
  };

  await report.update(changes);
  const updated = await findCustomReport(id, scopeChurchId);
  return toReportSummary(updated);
}

export async function deleteCustomReport(user: AuthUser, id: string): Promise<void> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(id, scopeChurchId);
  await assertCanModifyReport(user, report);
  await report.destroy();
}

export async function deleteMultipleReports(user: AuthUser, ids: string[]): Promise<void> {
  const scopeChurchId = resolveScopeChurchId(user);
  const where: WhereOptions<CustomReport> = { id: { [Op.in]: ids }, ...scopeWhere(scopeChurchId) };
  await db.CustomReport.destroy({ where });
}

export async function executeCustomReport(
  user: AuthUser,
  id: string,
  params: Record<string, unknown>,
): Promise<{ report: ReportSummary; data: ReportQueryResult }> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(id, scopeChurchId);

  const visible =
    report.userId === user.id ||
    report.isPublic ||
    (Array.isArray(report.sharedWithUserIds) && report.sharedWithUserIds.includes(user.id)) ||
    isGlobalAdmin(user);
  if (!visible) {
    throw new ForbiddenError('No tiene permisos para ejecutar este reporte');
  }

  const overrideFilters = params.filters;
  const filters: ReportFilter[] = Array.isArray(overrideFilters)
    ? (overrideFilters as ReportFilter[])
    : report.filters;

  const data = await runAggregation({
    entity: report.entity,
    filters,
    groupBy: report.groupBy,
    aggregateFunction: (report.aggregateFunction as AggregateConfig['aggregateFunction']) ?? 'count',
    aggregateField: report.aggregateField,
    limit: report.limit,
    scopeChurchId,
  });

  await report.update({
    timesExecuted: (report.timesExecuted ?? 0) + 1,
    lastExecutedAt: new Date(),
  });

  return { report: toReportSummary(report), data };
}

export async function previewReport(user: AuthUser, input: CreateReportInput): Promise<ReportQueryResult> {
  const scopeChurchId = resolveScopeChurchId(user);
  return runAggregation({
    entity: input.entity,
    filters: input.filters,
    groupBy: input.groupBy ?? null,
    aggregateFunction: input.aggregateFunction ?? 'count',
    aggregateField: input.aggregateField ?? null,
    limit: input.limit ?? 100,
    scopeChurchId,
  });
}

// ===================== CAMPOS Y AGREGACIONES =====================

export function getAvailableFields(entity: ReportEntity): FieldDef[] {
  const defs = ENTITY_FIELDS[entity];
  if (!defs) {
    throw new NotFoundError('Entidad de reporte no reconocida');
  }
  return defs;
}

export function getAggregationFunctions(): Array<{ value: string; label: string }> {
  return AGGREGATION_FUNCTIONS;
}

// ===================== PLANTILLAS =====================

export function getReportTemplates(category?: string | null): Array<Record<string, unknown>> {
  const templates = category ? REPORT_TEMPLATES.filter((t) => t.category === category) : REPORT_TEMPLATES;
  return templates.map((template) => ({ ...template }));
}

export async function createReportFromTemplate(
  user: AuthUser,
  templateId: string,
  customizations: Record<string, unknown>,
): Promise<ReportSummary> {
  const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new NotFoundError('Plantilla de reporte no encontrada');
  }

  const input: CreateReportInput = {
    name: (customizations.name as string) || template.name,
    description: (customizations.description as string) || template.description,
    category: template.category,
    entity: template.entity,
    fields: template.fields,
    filters: template.filters,
    groupBy: template.groupBy ?? undefined,
    aggregateFunction: template.aggregateFunction,
    aggregateField: template.aggregateField ?? undefined,
    sortOrder: 'asc',
    isPublic: false,
  };

  return createCustomReport(user, input);
}

// ===================== PROGRAMACIÓN =====================

export async function scheduleReport(
  user: AuthUser,
  reportId: string,
  scheduleConfig: Record<string, unknown>,
): Promise<ReportSummary> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(reportId, scopeChurchId);
  await assertCanModifyReport(user, report);
  await report.update({ isScheduled: true, scheduleConfig, updatedBy: user.id });
  const updated = await findCustomReport(reportId, scopeChurchId);
  return toReportSummary(updated);
}

export async function listScheduledReports(user: AuthUser): Promise<ReportSummary[]> {
  const scopeChurchId = resolveScopeChurchId(user);
  const reports = await db.CustomReport.findAll({
    where: { ...scopeWhere(scopeChurchId), isScheduled: true },
    include: [{ model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  return reports.map(toReportSummary);
}

export async function cancelScheduledReport(user: AuthUser, scheduleId: string): Promise<void> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(scheduleId, scopeChurchId);
  await assertCanModifyReport(user, report);
  await report.update({ isScheduled: false, scheduleConfig: {}, updatedBy: user.id });
}

// ===================== COMPARTIR =====================

export async function shareReport(user: AuthUser, reportId: string, userIds: string[]): Promise<ReportSummary> {
  const scopeChurchId = resolveScopeChurchId(user);
  const report = await findCustomReport(reportId, scopeChurchId);
  await assertCanModifyReport(user, report);

  const current = Array.isArray(report.sharedWithUserIds) ? report.sharedWithUserIds : [];
  const merged = Array.from(new Set([...current, ...userIds]));
  await report.update({ sharedWithUserIds: merged, updatedBy: user.id });
  const updated = await findCustomReport(reportId, scopeChurchId);
  return toReportSummary(updated);
}

export async function listSharedReports(user: AuthUser): Promise<ReportSummary[]> {
  const scopeChurchId = resolveScopeChurchId(user);
  const reports = await db.CustomReport.findAll({
    where: {
      ...scopeWhere(scopeChurchId),
      [Op.or]: [
        { sharedWithUserIds: { [Op.contains]: [user.id] } },
        { isPublic: true },
      ],
    },
    include: [{ model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  return reports.map(toReportSummary);
}

// ===================== ESTADÍSTICAS =====================

export async function getUsageStats(
  user: AuthUser,
  _params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const scopeChurchId = resolveScopeChurchId(user);
  const where: WhereOptions<CustomReport> = scopeWhere(scopeChurchId);

  const totalCustom = await db.CustomReport.count({ where });
  const totalExecutions = await db.CustomReport.sum('timesExecuted', { where });
  const totalScheduled = await db.CustomReport.count({ where: { ...where, isScheduled: true } });
  const hasSharedUsers = db.sequelize.where(
    db.sequelize.fn('array_length', db.sequelize.col('sharedWithUserIds'), 1),
    '>',
    0,
  );
  const totalShared = await db.CustomReport.count({ where: { ...where, [Op.and]: [hasSharedUsers] } });

  const recent = await db.CustomReport.findAll({
    where,
    order: [['lastExecutedAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'name', 'lastExecutedAt'],
  });

  return {
    totalCustom,
    totalPredefined: PREDEFINED_REPORTS.length,
    totalExecutions: totalExecutions ?? 0,
    totalScheduled,
    totalShared,
    recentActivity: recent.map((r) => ({ id: r.id, name: r.name, lastExecutedAt: r.lastExecutedAt })),
  };
}

export async function getPopularReports(user: AuthUser, limit: number): Promise<ReportSummary[]> {
  const scopeChurchId = resolveScopeChurchId(user);
  const reports = await db.CustomReport.findAll({
    where: scopeWhere(scopeChurchId),
    order: [['timesExecuted', 'DESC']],
    limit: Math.min(Math.max(limit, 1), 50),
    include: [{ model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  return reports.map(toReportSummary);
}

// ===================== MÉTRICAS =====================

export async function getMembershipGrowthReport(user: AuthUser): Promise<ReportQueryResult> {
  return (await executePredefinedReport('membership-growth', {}, user)).data;
}

export async function getGroupActivityReport(user: AuthUser): Promise<ReportQueryResult> {
  return (await executePredefinedReport('group-activity', {}, user)).data;
}

export async function getBibleStudentProgressReport(user: AuthUser): Promise<ReportQueryResult> {
  return (await executePredefinedReport('bible-student-progress', {}, user)).data;
}

// ===================== EXPORTACIÓN =====================

export async function exportReport(
  user: AuthUser,
  reportId: string,
  reportType: string,
  format: string,
  params: Record<string, unknown>,
): Promise<{ fileName: string; content: string }> {
  const result =
    reportType === 'predefined'
      ? await executePredefinedReport(reportId, params, user)
      : await executeCustomReport(user, reportId, params);

  const rows = result.data.rows;
  const headers = Object.keys(rows[0] ?? {});
  const lines = rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const extension = format === 'excel' ? 'csv' : 'txt';
  return { fileName: `reporte-${reportId}.${extension}`, content: csv };
}
