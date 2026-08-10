import { Op } from 'sequelize';
import {
  DASHBOARD_CACHE_TTL_SECONDS,
  GLOBAL_CHURCH_ID,
  KPIS_CACHE_TTL_SECONDS,
  dashboardKpisKey,
  dashboardSpiritualHealthKey,
} from '../constants/cache';
import { db } from '../models';
import type { Quarter } from '../models/Quarter.model';
import { cacheService } from './redis.service';
import {
  goalProgressPercent,
  memberGrowthPercent,
  missionPillarPercent,
  pctOf,
  toNumber,
} from '../utils/dashboardMath';

// =============================================
// DTOs
// =============================================

export interface SpiritualPillarDto {
  value: number;
  raw: number;
  denominator: number;
  label: string;
  description: string;
}

export interface MisionPillarDto {
  value: number;
  activeDisciplePairs: number;
  bibleStudentsInProgress: number;
  baptizedStudents: number;
  totalStudents: number;
  label: string;
  description: string;
}

export interface QuarterReferenceDto {
  id: string;
  name: string;
  year: number;
  period: string;
  startDate: string;
  endDate: string;
}

export interface GoalComparisonDto {
  id: string;
  goalType: string;
  title: string;
  targetValue: number;
  currentValue: number;
  achievedValue: number | null;
  unit: string | null;
  status: string;
  progressPercent: number;
}

export interface SpiritualHealthDto {
  churchId: string | null;
  quarter: QuarterReferenceDto | null;
  pillars: {
    comunion: SpiritualPillarDto;
    relacionamiento: SpiritualPillarDto;
    mision: MisionPillarDto;
  };
  goals: GoalComparisonDto[];
  computedAt: string;
}

export interface KpiGrowthDto {
  currentQuarterMembers: number;
  previousQuarterMembers: number;
  growthAbsolute: number;
  growthPercent: number;
}

export interface DashboardKpisDto {
  churchId: string | null;
  totalMembers: number;
  activeMembers: number;
  totalGroups: number;
  activeGroups: number;
  totalBibleStudents: number;
  bibleStudentsInProgress: number;
  baptizedStudents: number;
  baptizedMembers: number;
  totalBaptisms: number;
  totalActiveDisciplePairs: number;
  attendanceRecords: number;
  growth: KpiGrowthDto;
  computedAt: string;
}

// =============================================
// Helpers
// =============================================

interface DateRange {
  [Op.gte]: string;
  [Op.lte]: string;
}

function quarterDateRange(quarter: Quarter | null): DateRange | null {
  if (!quarter) {
    return null;
  }
  return { [Op.gte]: quarter.startDate, [Op.lte]: quarter.endDate };
}

function weeklyWhere(churchId: string, range: DateRange | null): { churchId: string; weekStart?: DateRange } {
  const where: { churchId: string; weekStart?: DateRange } = { churchId };
  if (range) {
    where.weekStart = range;
  }
  return where;
}

function groupInclude(churchId: string) {
  return { model: db.Group, as: 'group', where: { churchId }, required: true };
}

async function countActiveMembers(churchId: string): Promise<number> {
  return db.Member.count({
    where: { isActive: true, status: 'active' },
    include: [groupInclude(churchId)],
  });
}

interface RatioResult {
  pct: number;
  raw: number;
  denominator: number;
}

async function weeklyStudyRatio(churchId: string, range: DateRange | null): Promise<RatioResult | null> {
  const metrics = await db.WeeklyMetric.findAll({
    where: weeklyWhere(churchId, range),
    attributes: ['dailyBibleStudy', 'membersPresent'],
  });
  if (metrics.length === 0) {
    return null;
  }

  let daily = 0;
  let present = 0;
  metrics.forEach((metric) => {
    daily += metric.dailyBibleStudy;
    present += metric.membersPresent;
  });
  if (present <= 0) {
    return null;
  }

  return { pct: pctOf(daily, present), raw: daily, denominator: present };
}

async function weeklyRelationRatio(churchId: string, range: DateRange | null): Promise<RatioResult | null> {
  const metrics = await db.WeeklyMetric.findAll({
    where: weeklyWhere(churchId, range),
    attributes: ['membersPresent', 'totalMembersEnd'],
  });
  if (metrics.length === 0) {
    return null;
  }

  let present = 0;
  let total = 0;
  metrics.forEach((metric) => {
    present += metric.membersPresent;
    total += metric.totalMembersEnd;
  });
  if (total <= 0) {
    return null;
  }

  return { pct: pctOf(present, total), raw: present, denominator: total };
}

// =============================================
// Pilares
// =============================================

async function computeComunion(churchId: string, quarter: Quarter | null): Promise<SpiritualPillarDto> {
  const range = quarterDateRange(quarter);
  const activeMembers = await countActiveMembers(churchId);

  const totalAttendance = await db.AttendanceRecord.count({
    where: { churchId, ...(range ? { meetingDate: range } : {}) },
  });

  const studyingMembers = await db.AttendanceRecord.count({
    where: { churchId, studiedDaily: true, ...(range ? { meetingDate: range } : {}) },
    distinct: true,
    col: 'memberId',
  });

  if (totalAttendance === 0) {
    const weekly = await weeklyStudyRatio(churchId, range);
    if (weekly) {
      return {
        value: weekly.pct,
        raw: weekly.raw,
        denominator: weekly.denominator,
        label: 'Comunión',
        description: 'Porcentaje de miembros que estudian diariamente la Biblia/Lección',
      };
    }
  }

  return {
    value: pctOf(studyingMembers, activeMembers),
    raw: studyingMembers,
    denominator: activeMembers,
    label: 'Comunión',
    description: 'Porcentaje de miembros que estudian diariamente la Biblia/Lección',
  };
}

async function computeRelacionamiento(churchId: string, quarter: Quarter | null): Promise<SpiritualPillarDto> {
  const range = quarterDateRange(quarter);
  const activeMembers = await countActiveMembers(churchId);

  const totalAttendance = await db.AttendanceRecord.count({
    where: { churchId, ...(range ? { meetingDate: range } : {}) },
  });

  const presentMembers = await db.AttendanceRecord.count({
    where: { churchId, isPresent: true, ...(range ? { meetingDate: range } : {}) },
    distinct: true,
    col: 'memberId',
  });

  if (totalAttendance > 0 && activeMembers > 0) {
    return {
      value: pctOf(presentMembers, activeMembers),
      raw: presentMembers,
      denominator: activeMembers,
      label: 'Relacionamiento',
      description: 'Porcentaje de asistencia a Clases y Grupos Pequeños',
    };
  }

  const weekly = await weeklyRelationRatio(churchId, range);
  if (weekly) {
    return {
      value: weekly.pct,
      raw: weekly.raw,
      denominator: weekly.denominator,
      label: 'Relacionamiento',
      description: 'Porcentaje de asistencia a Clases y Grupos Pequeños',
    };
  }

  return {
    value: 0,
    raw: presentMembers,
    denominator: activeMembers,
    label: 'Relacionamiento',
    description: 'Porcentaje de asistencia a Clases y Grupos Pequeños',
  };
}

async function computeMision(churchId: string, quarter: Quarter | null): Promise<MisionPillarDto> {
  const [activePairs, studentsInProgress, baptizedStudents, totalStudents, activeMembers] = await Promise.all([
    db.DisciplePair.count({ where: { churchId, status: 'active' } }),
    db.BibleStudent.count({ where: { churchId, status: { [Op.in]: ['enrolled', 'active'] } } }),
    db.BibleStudent.count({ where: { churchId, baptized: true } }),
    db.BibleStudent.count({ where: { churchId } }),
    countActiveMembers(churchId),
  ]);

  let value = 0;

  if (quarter) {
    const missionGoals = await db.QuarterlyGoal.findAll({
      where: { churchId, quarterId: quarter.id, goalType: 'mision' },
    });
    if (missionGoals.length > 0) {
      const totalTarget = missionGoals.reduce((sum, goal) => sum + toNumber(goal.targetValue), 0);
      const totalAchieved = missionGoals.reduce(
        (sum, goal) => sum + toNumber(goal.achievedValue ?? goal.currentValue),
        0,
      );
      value = pctOf(totalAchieved, totalTarget);
    }
  }

  if (value === 0) {
    value = missionPillarPercent(activePairs, studentsInProgress, activeMembers);
  }

  return {
    value,
    activeDisciplePairs: activePairs,
    bibleStudentsInProgress: studentsInProgress,
    baptizedStudents,
    totalStudents,
    label: 'Misión',
    description: 'Parejas discipuladoras activas y estudiantes bíblicos en curso',
  };
}

async function computeGoals(churchId: string, quarter: Quarter | null): Promise<GoalComparisonDto[]> {
  const goals = await db.QuarterlyGoal.findAll({
    where: { churchId, ...(quarter ? { quarterId: quarter.id } : {}) },
    order: [
      ['goalType', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });

  return goals.map((goal) => {
    const target = toNumber(goal.targetValue);
    const achieved = goal.achievedValue !== null ? toNumber(goal.achievedValue) : toNumber(goal.currentValue);
    return {
      id: goal.id,
      goalType: goal.goalType,
      title: goal.title,
      targetValue: target,
      currentValue: toNumber(goal.currentValue),
      achievedValue: goal.achievedValue !== null ? toNumber(goal.achievedValue) : null,
      unit: goal.unit,
      status: goal.status,
      progressPercent: goalProgressPercent(achieved, target),
    };
  });
}

// =============================================
// KPIs
// =============================================

async function findPreviousQuarter(churchId: string, current: Quarter | null): Promise<Quarter | null> {
  if (current) {
    return db.Quarter.findOne({
      where: { churchId, startDate: { [Op.lt]: current.startDate } },
      order: [['startDate', 'DESC']],
    });
  }
  return db.Quarter.findOne({
    where: { churchId },
    order: [['startDate', 'DESC']],
  });
}

async function endOfQuarterMembers(churchId: string, quarter: Quarter | null): Promise<number> {
  const metrics = await db.WeeklyMetric.findAll({
    where: weeklyWhere(churchId, quarterDateRange(quarter)),
    attributes: ['groupId', 'totalMembersEnd'],
  });

  const perGroup = new Map<string, number>();
  for (const metric of metrics) {
    const current = perGroup.get(metric.groupId) ?? 0;
    if (metric.totalMembersEnd > current) {
      perGroup.set(metric.groupId, metric.totalMembersEnd);
    }
  }

  let total = 0;
  perGroup.forEach((value) => {
    total += value;
  });
  return total;
}

// =============================================
// Servicios públicos (con caché)
// =============================================

export async function getSpiritualHealth(churchId: string): Promise<SpiritualHealthDto> {
  const cached = await cacheService.get<SpiritualHealthDto>(dashboardSpiritualHealthKey(churchId));
  if (cached) {
    return cached;
  }

  const quarter = await db.Quarter.findOne({ where: { churchId, isCurrent: true } });

  const [comunion, relacionamiento, mision, goals] = await Promise.all([
    computeComunion(churchId, quarter),
    computeRelacionamiento(churchId, quarter),
    computeMision(churchId, quarter),
    computeGoals(churchId, quarter),
  ]);

  const dto: SpiritualHealthDto = {
    churchId,
    quarter: quarter
      ? {
          id: quarter.id,
          name: quarter.name,
          year: quarter.year,
          period: quarter.period,
          startDate: quarter.startDate,
          endDate: quarter.endDate,
        }
      : null,
    pillars: { comunion, relacionamiento, mision },
    goals,
    computedAt: new Date().toISOString(),
  };

  await cacheService.set(dashboardSpiritualHealthKey(churchId), dto, DASHBOARD_CACHE_TTL_SECONDS);
  return dto;
}

export async function getDashboardKpis(churchId: string): Promise<DashboardKpisDto> {
  const cached = await cacheService.get<DashboardKpisDto>(dashboardKpisKey(churchId));
  if (cached) {
    return cached;
  }

  const currentQuarter = await db.Quarter.findOne({ where: { churchId, isCurrent: true } });
  const previousQuarter = await findPreviousQuarter(churchId, currentQuarter);

  const [
    totalMembers,
    activeMembers,
    totalGroups,
    activeGroups,
    totalStudents,
    studentsInProgress,
    baptizedStudents,
    baptizedMembers,
    activePairs,
    attendanceRecords,
    currentQuarterMembers,
    previousQuarterMembers,
  ] = await Promise.all([
    db.Member.count({ where: { isActive: true }, include: [groupInclude(churchId)] }),
    db.Member.count({ where: { isActive: true, status: 'active' }, include: [groupInclude(churchId)] }),
    db.Group.count({ where: { churchId } }),
    db.Group.count({ where: { churchId, isActive: true } }),
    db.BibleStudent.count({ where: { churchId } }),
    db.BibleStudent.count({ where: { churchId, status: { [Op.in]: ['enrolled', 'active'] } } }),
    db.BibleStudent.count({ where: { churchId, baptized: true } }),
    db.Member.count({ where: { isActive: true, baptized: true }, include: [groupInclude(churchId)] }),
    db.DisciplePair.count({ where: { churchId, status: 'active' } }),
    db.AttendanceRecord.count({ where: { churchId } }),
    endOfQuarterMembers(churchId, currentQuarter),
    endOfQuarterMembers(churchId, previousQuarter),
  ]);

  const growthAbsolute = currentQuarterMembers - previousQuarterMembers;
  const growthPercent = memberGrowthPercent(previousQuarterMembers, currentQuarterMembers);

  const dto: DashboardKpisDto = {
    churchId,
    totalMembers,
    activeMembers,
    totalGroups,
    activeGroups,
    totalBibleStudents: totalStudents,
    bibleStudentsInProgress: studentsInProgress,
    baptizedStudents,
    baptizedMembers,
    totalBaptisms: baptizedStudents + baptizedMembers,
    totalActiveDisciplePairs: activePairs,
    attendanceRecords,
    growth: {
      currentQuarterMembers,
      previousQuarterMembers,
      growthAbsolute,
      growthPercent,
    },
    computedAt: new Date().toISOString(),
  };

  await cacheService.set(dashboardKpisKey(churchId), dto, KPIS_CACHE_TTL_SECONDS);
  return dto;
}

// =============================================
// Vista global (SuperAdmin sin iglesia asignada)
// =============================================

async function listActiveChurchIds(): Promise<string[]> {
  const churches = await db.Church.findAll({
    where: { isActive: true },
    attributes: ['id'],
  });
  return churches.map((church) => church.id);
}

interface GlobalDashboardEntry {
  health: SpiritualHealthDto;
  kpis: DashboardKpisDto;
}

async function collectGlobalDashboardData(): Promise<GlobalDashboardEntry[]> {
  const churchIds = await listActiveChurchIds();
  return Promise.all(
    churchIds.map(async (churchId) => {
      const [health, kpis] = await Promise.all([getSpiritualHealth(churchId), getDashboardKpis(churchId)]);
      return { health, kpis };
    }),
  );
}

function aggregateRatioPillar(
  healths: SpiritualHealthDto[],
  key: 'comunion' | 'relacionamiento',
): SpiritualPillarDto {
  const first = healths[0]?.pillars[key];
  let raw = 0;
  let denominator = 0;
  healths.forEach((health) => {
    raw += health.pillars[key].raw;
    denominator += health.pillars[key].denominator;
  });
  return {
    value: pctOf(raw, denominator),
    raw,
    denominator,
    label: first?.label ?? (key === 'comunion' ? 'Comunión' : 'Relacionamiento'),
    description: first?.description ?? '',
  };
}

export async function getGlobalSpiritualHealth(): Promise<SpiritualHealthDto> {
  const cached = await cacheService.get<SpiritualHealthDto>(dashboardSpiritualHealthKey(GLOBAL_CHURCH_ID));
  if (cached) {
    return cached;
  }

  const data = await collectGlobalDashboardData();
  const healths = data.map((entry) => entry.health);

  const comunion = aggregateRatioPillar(healths, 'comunion');
  const relacionamiento = aggregateRatioPillar(healths, 'relacionamiento');

  let activePairs = 0;
  let studentsInProgress = 0;
  let activeMembers = 0;
  healths.forEach((health) => {
    activePairs += health.pillars.mision.activeDisciplePairs;
    studentsInProgress += health.pillars.mision.bibleStudentsInProgress;
  });
  data.forEach((entry) => {
    activeMembers += entry.kpis.activeMembers;
  });

  const mision: MisionPillarDto = {
    value: missionPillarPercent(activePairs, studentsInProgress, activeMembers),
    activeDisciplePairs: activePairs,
    bibleStudentsInProgress: studentsInProgress,
    baptizedStudents: healths.reduce((sum, health) => sum + health.pillars.mision.baptizedStudents, 0),
    totalStudents: healths.reduce((sum, health) => sum + health.pillars.mision.totalStudents, 0),
    label: 'Misión',
    description: 'Parejas discipuladoras activas y estudiantes bíblicos en curso',
  };

  const dto: SpiritualHealthDto = {
    churchId: GLOBAL_CHURCH_ID,
    quarter: null,
    pillars: { comunion, relacionamiento, mision },
    goals: healths.flatMap((health) => health.goals),
    computedAt: new Date().toISOString(),
  };

  await cacheService.set(dashboardSpiritualHealthKey(GLOBAL_CHURCH_ID), dto, DASHBOARD_CACHE_TTL_SECONDS);
  return dto;
}

interface GlobalKpiTotals {
  totalMembers: number;
  activeMembers: number;
  totalGroups: number;
  activeGroups: number;
  totalBibleStudents: number;
  bibleStudentsInProgress: number;
  baptizedStudents: number;
  baptizedMembers: number;
  totalBaptisms: number;
  totalActiveDisciplePairs: number;
  attendanceRecords: number;
  currentQuarterMembers: number;
  previousQuarterMembers: number;
}

function emptyGlobalKpiTotals(): GlobalKpiTotals {
  return {
    totalMembers: 0,
    activeMembers: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalBibleStudents: 0,
    bibleStudentsInProgress: 0,
    baptizedStudents: 0,
    baptizedMembers: 0,
    totalBaptisms: 0,
    totalActiveDisciplePairs: 0,
    attendanceRecords: 0,
    currentQuarterMembers: 0,
    previousQuarterMembers: 0,
  };
}

export async function getGlobalDashboardKpis(): Promise<DashboardKpisDto> {
  const cached = await cacheService.get<DashboardKpisDto>(dashboardKpisKey(GLOBAL_CHURCH_ID));
  if (cached) {
    return cached;
  }

  const data = await collectGlobalDashboardData();
  const totals = data.reduce((acc, entry) => {
    acc.totalMembers += entry.kpis.totalMembers;
    acc.activeMembers += entry.kpis.activeMembers;
    acc.totalGroups += entry.kpis.totalGroups;
    acc.activeGroups += entry.kpis.activeGroups;
    acc.totalBibleStudents += entry.kpis.totalBibleStudents;
    acc.bibleStudentsInProgress += entry.kpis.bibleStudentsInProgress;
    acc.baptizedStudents += entry.kpis.baptizedStudents;
    acc.baptizedMembers += entry.kpis.baptizedMembers;
    acc.totalBaptisms += entry.kpis.totalBaptisms;
    acc.totalActiveDisciplePairs += entry.kpis.totalActiveDisciplePairs;
    acc.attendanceRecords += entry.kpis.attendanceRecords;
    acc.currentQuarterMembers += entry.kpis.growth.currentQuarterMembers;
    acc.previousQuarterMembers += entry.kpis.growth.previousQuarterMembers;
    return acc;
  }, emptyGlobalKpiTotals());

  const growthAbsolute = totals.currentQuarterMembers - totals.previousQuarterMembers;

  const dto: DashboardKpisDto = {
    churchId: GLOBAL_CHURCH_ID,
    totalMembers: totals.totalMembers,
    activeMembers: totals.activeMembers,
    totalGroups: totals.totalGroups,
    activeGroups: totals.activeGroups,
    totalBibleStudents: totals.totalBibleStudents,
    bibleStudentsInProgress: totals.bibleStudentsInProgress,
    baptizedStudents: totals.baptizedStudents,
    baptizedMembers: totals.baptizedMembers,
    totalBaptisms: totals.totalBaptisms,
    totalActiveDisciplePairs: totals.totalActiveDisciplePairs,
    attendanceRecords: totals.attendanceRecords,
    growth: {
      currentQuarterMembers: totals.currentQuarterMembers,
      previousQuarterMembers: totals.previousQuarterMembers,
      growthAbsolute,
      growthPercent: memberGrowthPercent(totals.previousQuarterMembers, totals.currentQuarterMembers),
    },
    computedAt: new Date().toISOString(),
  };

  await cacheService.set(dashboardKpisKey(GLOBAL_CHURCH_ID), dto, KPIS_CACHE_TTL_SECONDS);
  return dto;
}
