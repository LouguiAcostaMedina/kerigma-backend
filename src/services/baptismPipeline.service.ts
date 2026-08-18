import { QueryTypes } from 'sequelize';
import { db } from '../models';

interface PipelineFunnel {
  studying: number;
  candidates: number;
  baptized: number;
  fullMember: number;
}

interface ConversionRates {
  studyToCandidate: number;
  candidateToBaptized: number;
  baptizedToMember: number;
  overall: number;
}

interface AvgDaysInStage {
  studying: number | null;
  candidates: number | null;
}

interface RecentGraduation {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentDate: string;
  graduationDate: string | null;
  completedLessons: number;
  totalLessons: number | null;
}

export interface PipelineMetrics {
  funnel: PipelineFunnel;
  conversionRates: ConversionRates;
  avgDaysInStage: AvgDaysInStage;
  recentGraduations: RecentGraduation[];
}

export async function getPipelineMetrics(churchId: string | null): Promise<PipelineMetrics> {
  const baseWhere: Record<string, unknown> = { isActive: true };
  if (churchId) baseWhere.churchId = churchId;

  const [studying, candidates, baptized, fullMember] = await Promise.all([
    db.BibleStudent.count({
      where: { ...baseWhere, baptized: false, churchMember: false },
    }),
    db.BibleStudent.count({
      where: { ...baseWhere, baptized: true, churchMember: false },
    }),
    db.BibleStudent.count({
      where: { ...baseWhere, baptized: true },
    }),
    db.BibleStudent.count({
      where: { ...baseWhere, churchMember: true },
    }),
  ]);

  const funnel: PipelineFunnel = { studying, candidates, baptized, fullMember };

  const totalStarted = studying + candidates + baptized;
  const safeTotal = totalStarted > 0 ? totalStarted : 1;

  const conversionRates: ConversionRates = {
    studyToCandidate: Number(((baptized / safeTotal) * 100).toFixed(1)),
    candidateToBaptized: candidates > 0 ? Number(((candidates / (candidates + studying)) * 100).toFixed(1)) : 0,
    baptizedToMember: baptized > 0 ? Number(((fullMember / baptized) * 100).toFixed(1)) : 0,
    overall: totalStarted > 0 ? Number(((fullMember / safeTotal) * 100).toFixed(1)) : 0,
  };

  const avgDaysInStage = await computeAvgDays(churchId);

  const recentGraduations = await getRecentGraduations(churchId);

  return { funnel, conversionRates, avgDaysInStage, recentGraduations };
}

async function computeAvgDays(churchId: string | null): Promise<AvgDaysInStage> {
  const churchClause = churchId ? 'AND "churchId" = :churchId' : '';
  const replacements = churchId ? { churchId } : {};

  const studyingResult = await db.sequelize.query<Record<string, unknown>>(
    `SELECT AVG(DATE_PART('day', NOW() - TO_DATE("enrollmentDate", 'YYYY-MM-DD')))::int AS avg_days
     FROM "BibleStudents"
     WHERE "isActive" = true
       AND "baptized" = false
       AND "churchMember" = false
       ${churchClause}`,
    { replacements, type: QueryTypes.SELECT },
  );

  const candidateResult = await db.sequelize.query<Record<string, unknown>>(
    `SELECT AVG(DATE_PART('day', NOW() - "baptismDate"))::int AS avg_days
     FROM "BibleStudents"
     WHERE "isActive" = true
       AND "baptized" = true
       AND "churchMember" = false
       AND "baptismDate" IS NOT NULL
       ${churchClause}`,
    { replacements, type: QueryTypes.SELECT },
  );

  return {
    studying: studyingResult[0] ? Number(studyingResult[0].avg_days) || null : null,
    candidates: candidateResult[0] ? Number(candidateResult[0].avg_days) || null : null,
  };
}

async function getRecentGraduations(churchId: string | null): Promise<RecentGraduation[]> {
  const where: Record<string, unknown> = { churchMember: true };
  if (churchId) where.churchId = churchId;

  const students = await db.BibleStudent.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: 10,
    attributes: [
      'id', 'firstName', 'lastName', 'enrollmentDate',
      'graduationDate', 'completedLessons', 'totalLessons',
    ],
    raw: true,
  });

  return students.map((s) => {
    const plain = s as unknown as Record<string, unknown>;
    return {
      id: plain.id as string,
      firstName: plain.firstName as string,
      lastName: plain.lastName as string,
      enrollmentDate: plain.enrollmentDate as string,
      graduationDate: (plain.graduationDate as string) ?? null,
      completedLessons: Number(plain.completedLessons),
      totalLessons: (plain.totalLessons as number) ?? null,
    };
  });
}

export async function getLessonCompletionStats(churchId: string | null): Promise<{
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  avgScore: number | null;
}> {
  const where: Record<string, unknown> = {};
  if (churchId) where.churchId = churchId;

  const result = await db.BibleLessonProgress.findAll({
    attributes: [
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalLessons'],
      [
        db.sequelize.fn('SUM', db.sequelize.cast(db.sequelize.col('"isCompleted"'), 'int')),
        'completedLessons',
      ],
      [db.sequelize.fn('AVG', db.sequelize.cast(db.sequelize.col('score'), 'float')), 'avgScore'],
    ],
    where,
    raw: true,
  });

  const plain = result[0] as unknown as Record<string, unknown>;
  const total = Number(plain.totalLessons) || 0;
  const completed = Number(plain.completedLessons) || 0;

  return {
    totalLessons: total,
    completedLessons: completed,
    completionRate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
    avgScore: plain.avgScore != null ? Number(plain.avgScore) : null,
  };
}
