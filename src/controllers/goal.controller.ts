import type { Request, Response } from 'express';
import type { CloseQuarterlyGoalInput, CreateQuarterlyGoalInput, ListGoalsQuery } from '../schemas/goal.schema';
import * as goalService from '../services/goal.service';
import { ok } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/errors';

function requireChurchId(req: Request): string {
  if (!req.user?.churchId) {
    throw new UnauthorizedError('El usuario no está asociado a ninguna iglesia');
  }
  return req.user.churchId;
}

export async function createQuarterlyGoal(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const goal = await goalService.createQuarterlyGoal(churchId, req.user.id, req.body as CreateQuarterlyGoalInput);
  res.status(201).json(ok(goal, 'Meta trimestral creada exitosamente'));
}

export async function closeQuarterlyGoal(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const goal = await goalService.closeQuarterlyGoal(
    churchId,
    req.params.id,
    req.user.id,
    req.body as CloseQuarterlyGoalInput,
  );
  res.status(200).json(ok(goal, 'Meta trimestral cerrada exitosamente'));
}

export async function listQuarterlyGoalsByGroup(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  const goals = await goalService.listQuarterlyGoalsByGroup(
    churchId,
    req.params.groupId,
    req.query as ListGoalsQuery,
  );
  res.status(200).json(ok(goals));
}

export async function listQuarterlyGoalsByQuarter(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  const goals = await goalService.listQuarterlyGoalsByQuarter(churchId, req.params.quarterId);
  res.status(200).json(ok(goals));
}
