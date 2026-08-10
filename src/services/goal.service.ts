import { db } from '../models';
import type { QuarterlyGoal } from '../models/QuarterlyGoal.model';
import type {
  CloseQuarterlyGoalInput,
  CreateQuarterlyGoalInput,
  ListGoalsQuery,
} from '../schemas/goal.schema';
import type { QuarterlyGoalStatus } from '../types/models';
import { NotFoundError, ValidationError } from '../utils/errors';
import { invalidateDashboardCache } from './redis.service';

const GOAL_INCLUDE = [
  { model: db.Quarter, as: 'quarter', attributes: ['id', 'name', 'year', 'period'] },
  { model: db.Group, as: 'group', attributes: ['id', 'name'] },
];

function toDecimal(value: number): string {
  return value.toFixed(2);
}

export async function createQuarterlyGoal(
  churchId: string,
  actorId: string,
  input: CreateQuarterlyGoalInput,
): Promise<QuarterlyGoal> {
  const quarter = await db.Quarter.findOne({ where: { id: input.quarterId, churchId } });
  if (!quarter) {
    throw new NotFoundError('Trimestre no encontrado');
  }

  if (input.groupId) {
    const group = await db.Group.findOne({ where: { id: input.groupId, churchId } });
    if (!group) {
      throw new NotFoundError('El grupo indicado no pertenece a su iglesia');
    }
  }

  if (input.startDate && input.dueDate && input.startDate > input.dueDate) {
    throw new ValidationError('La fecha de inicio no puede ser posterior a la fecha límite');
  }

  const goal = await db.QuarterlyGoal.create({
    churchId,
    quarterId: input.quarterId,
    groupId: input.groupId ?? null,
    goalType: input.goalType,
    title: input.title,
    description: input.description ?? null,
    targetValue: toDecimal(input.targetValue),
    currentValue: '0.00',
    achievedValue: null,
    unit: input.unit ?? null,
    status: 'not_started',
    startDate: input.startDate ?? null,
    dueDate: input.dueDate ?? null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await invalidateDashboardCache(churchId);

  return goal.reload({ include: GOAL_INCLUDE });
}

export async function closeQuarterlyGoal(
  churchId: string,
  goalId: string,
  actorId: string,
  input: CloseQuarterlyGoalInput,
): Promise<QuarterlyGoal> {
  const goal = await db.QuarterlyGoal.findOne({ where: { id: goalId, churchId } });
  if (!goal) {
    throw new NotFoundError('Meta trimestral no encontrada');
  }

  if (goal.status === 'cancelled') {
    throw new ValidationError('No se puede cerrar una meta cancelada');
  }

  const achievedValue = toDecimal(input.achievedValue);
  const status: QuarterlyGoalStatus =
    Number(input.achievedValue) >= Number(goal.targetValue) ? 'achieved' : 'missed';

  await goal.update({
    achievedValue,
    currentValue: achievedValue,
    status,
    updatedBy: actorId,
  });

  await invalidateDashboardCache(churchId);

  return goal.reload({ include: GOAL_INCLUDE });
}

export async function listQuarterlyGoalsByGroup(
  churchId: string,
  groupId: string,
  query: ListGoalsQuery = {},
): Promise<QuarterlyGoal[]> {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const where: { groupId: string; churchId: string; quarterId?: string } = { groupId, churchId };
  if (query.quarterId) {
    where.quarterId = query.quarterId;
  }

  return db.QuarterlyGoal.findAll({
    where,
    include: GOAL_INCLUDE,
    order: [['createdAt', 'DESC']],
  });
}

export async function listQuarterlyGoalsByQuarter(
  churchId: string,
  quarterId: string,
): Promise<QuarterlyGoal[]> {
  const quarter = await db.Quarter.findOne({ where: { id: quarterId, churchId } });
  if (!quarter) {
    throw new NotFoundError('Trimestre no encontrado');
  }

  return db.QuarterlyGoal.findAll({
    where: { quarterId, churchId },
    include: GOAL_INCLUDE,
    order: [['goalType', 'ASC'], ['createdAt', 'DESC']],
  });
}
