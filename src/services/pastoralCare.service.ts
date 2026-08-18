import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { PrayerRequest, PastoralVisit, PrayerRequestStatus } from '../models/PrayerRequest.model';
import { NotFoundError } from '../utils/errors';

export interface PrayerRequestSummary {
  id: string;
  churchId: string;
  memberId: string | null;
  requesterName: string;
  requesterPhone: string | null;
  requesterEmail: string | null;
  subject: string;
  description: string;
  priority: PrayerRequest['priority'];
  status: PrayerRequest['status'];
  assignedTo: string | null;
  assigneeName: string | null;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  isAnonymous: boolean;
  isPublic: boolean;
  visitCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface PastoralVisitSummary {
  id: string;
  churchId: string;
  memberId: string | null;
  visitorName: string;
  visitDate: Date;
  visitType: string;
  reason: string;
  notes: string | null;
  outcome: string | null;
  followUpNeeded: boolean;
  followUpDate: Date | null;
  followUpNotes: string | null;
  prayerRequestId: string | null;
  conductedBy: string;
  conductorName: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface PrayerRequestsPaginatedResult {
  prayerRequests: PrayerRequestSummary[];
  total: number;
}

export interface PastoralVisitsPaginatedResult {
  pastoralVisits: PastoralVisitSummary[];
  total: number;
}

export interface ListPrayerRequestsQuery {
  page: number;
  limit: number;
  search?: string;
  status?: PrayerRequestStatus;
  priority?: PrayerRequest['priority'];
}

export interface ListPastoralVisitsQuery {
  page: number;
  limit: number;
  search?: string;
  followUpNeeded?: boolean;
}

export interface CreatePrayerRequestInput {
  memberId?: string;
  requesterName: string;
  requesterPhone?: string;
  requesterEmail?: string;
  subject: string;
  description: string;
  priority?: PrayerRequest['priority'];
  assignedTo?: string;
  isAnonymous?: boolean;
  isPublic?: boolean;
}

export interface UpdatePrayerRequestInput {
  requesterName?: string;
  requesterPhone?: string | null;
  requesterEmail?: string | null;
  subject?: string;
  description?: string;
  priority?: PrayerRequest['priority'];
  assignedTo?: string | null;
  isAnonymous?: boolean;
  isPublic?: boolean;
}

export interface CreatePastoralVisitInput {
  memberId?: string;
  visitorName: string;
  visitDate: Date;
  visitType: string;
  reason: string;
  notes?: string;
  outcome?: string;
  followUpNeeded?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  prayerRequestId?: string;
  conductedBy: string;
}

export interface UpdatePastoralVisitInput {
  visitorName?: string;
  visitDate?: Date;
  visitType?: string;
  reason?: string;
  notes?: string | null;
  outcome?: string | null;
  followUpNeeded?: boolean;
  followUpDate?: Date | null;
  followUpNotes?: string | null;
}

function toPrayerRequestSummary(request: PrayerRequest, visitCount: number): PrayerRequestSummary {
  const assignee = request.assignee as { firstName: string; lastName: string } | undefined;
  return {
    id: request.id,
    churchId: request.churchId,
    memberId: request.memberId,
    requesterName: request.requesterName,
    requesterPhone: request.requesterPhone,
    requesterEmail: request.requesterEmail,
    subject: request.subject,
    description: request.description,
    priority: request.priority,
    status: request.status,
    assignedTo: request.assignedTo,
    assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : null,
    resolutionNotes: request.resolutionNotes,
    resolvedAt: request.resolvedAt,
    isAnonymous: request.isAnonymous,
    isPublic: request.isPublic,
    visitCount,
    createdBy: request.createdBy,
    createdAt: request.createdAt,
  };
}

function toPastoralVisitSummary(visit: PastoralVisit): PastoralVisitSummary {
  const conductor = visit.conductor as { firstName: string; lastName: string } | undefined;
  return {
    id: visit.id,
    churchId: visit.churchId,
    memberId: visit.memberId,
    visitorName: visit.visitorName,
    visitDate: visit.visitDate,
    visitType: visit.visitType,
    reason: visit.reason,
    notes: visit.notes,
    outcome: visit.outcome,
    followUpNeeded: visit.followUpNeeded,
    followUpDate: visit.followUpDate,
    followUpNotes: visit.followUpNotes,
    prayerRequestId: visit.prayerRequestId,
    conductedBy: visit.conductedBy,
    conductorName: conductor ? `${conductor.firstName} ${conductor.lastName}` : null,
    createdBy: visit.createdBy,
    createdAt: visit.createdAt,
  };
}

const PRAYER_REQUEST_INCLUDES = [
  { model: db.User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
];

const PASTORAL_VISIT_INCLUDES = [
  { model: db.User, as: 'conductor', attributes: ['id', 'firstName', 'lastName'] },
];

export async function listPrayerRequests(
  churchId: string,
  query: ListPrayerRequestsQuery,
): Promise<PrayerRequestsPaginatedResult> {
  const { page, limit, search, status, priority } = query;

  const where: WhereOptions = { churchId };
  if (status) {
    (where as Record<string, unknown>).status = status;
  }
  if (priority) {
    (where as Record<string, unknown>).priority = priority;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { subject: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
      { requesterName: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.PrayerRequest.findAndCountAll({
    where,
    include: PRAYER_REQUEST_INCLUDES,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  const prayerRequests = await Promise.all(
    rows.map(async (r) => {
      const visitCount = await db.PastoralVisit.count({
        where: { prayerRequestId: r.id },
      });
      return toPrayerRequestSummary(r, visitCount);
    }),
  );

  return { prayerRequests, total: count };
}

export async function getPrayerRequest(id: string): Promise<PrayerRequestSummary> {
  const request = await db.PrayerRequest.findByPk(id, {
    include: PRAYER_REQUEST_INCLUDES,
  });
  if (!request) {
    throw new NotFoundError('Solicitud de oración no encontrada');
  }
  const visitCount = await db.PastoralVisit.count({
    where: { prayerRequestId: id },
  });
  return toPrayerRequestSummary(request, visitCount);
}

export async function createPrayerRequest(
  churchId: string,
  userId: string,
  input: CreatePrayerRequestInput,
): Promise<PrayerRequestSummary> {
  if (input.assignedTo) {
    const assignee = await db.User.findOne({ where: { id: input.assignedTo, churchId } });
    if (!assignee) {
      throw new NotFoundError('El usuario asignado no pertenece a su iglesia');
    }
  }

  const request = await db.PrayerRequest.create({
    churchId,
    memberId: input.memberId ?? null,
    requesterName: input.requesterName,
    requesterPhone: input.requesterPhone ?? null,
    requesterEmail: input.requesterEmail ?? null,
    subject: input.subject,
    description: input.description,
    priority: input.priority ?? 'normal',
    status: 'pending',
    assignedTo: input.assignedTo ?? null,
    isAnonymous: input.isAnonymous ?? false,
    isPublic: input.isPublic ?? false,
    createdBy: userId,
  });

  return getPrayerRequest(request.id);
}

export async function updatePrayerRequest(
  id: string,
  input: UpdatePrayerRequestInput,
): Promise<PrayerRequestSummary> {
  const request = await db.PrayerRequest.findByPk(id);
  if (!request) {
    throw new NotFoundError('Solicitud de oración no encontrada');
  }

  await request.update({
    requesterName: input.requesterName ?? request.requesterName,
    requesterPhone: input.requesterPhone !== undefined ? input.requesterPhone : request.requesterPhone,
    requesterEmail: input.requesterEmail !== undefined ? input.requesterEmail : request.requesterEmail,
    subject: input.subject ?? request.subject,
    description: input.description ?? request.description,
    priority: input.priority ?? request.priority,
    assignedTo: input.assignedTo !== undefined ? input.assignedTo : request.assignedTo,
    isAnonymous: input.isAnonymous ?? request.isAnonymous,
    isPublic: input.isPublic ?? request.isPublic,
  });

  return getPrayerRequest(id);
}

export async function deletePrayerRequest(id: string): Promise<void> {
  const request = await db.PrayerRequest.findByPk(id);
  if (!request) {
    throw new NotFoundError('Solicitud de oración no encontrada');
  }
  await request.destroy();
}

export async function updatePrayerRequestStatus(
  id: string,
  status: PrayerRequestStatus,
  resolutionNotes?: string,
): Promise<PrayerRequestSummary> {
  const request = await db.PrayerRequest.findByPk(id);
  if (!request) {
    throw new NotFoundError('Solicitud de oración no encontrada');
  }

  const updatePayload: Record<string, unknown> = { status };
  if (status === 'answered' || status === 'closed') {
    updatePayload.resolutionNotes = resolutionNotes ?? request.resolutionNotes;
    updatePayload.resolvedAt = new Date();
  }

  await request.update(updatePayload);

  return getPrayerRequest(id);
}

export async function listPastoralVisits(
  churchId: string,
  query: ListPastoralVisitsQuery,
): Promise<PastoralVisitsPaginatedResult> {
  const { page, limit, search, followUpNeeded } = query;

  const where: WhereOptions = { churchId };
  if (followUpNeeded !== undefined) {
    (where as Record<string, unknown>).followUpNeeded = followUpNeeded;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { visitorName: { [Op.iLike]: term } },
      { reason: { [Op.iLike]: term } },
      { notes: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.PastoralVisit.findAndCountAll({
    where,
    include: PASTORAL_VISIT_INCLUDES,
    order: [['visitDate', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return { pastoralVisits: rows.map(toPastoralVisitSummary), total: count };
}

export async function getPastoralVisit(id: string): Promise<PastoralVisitSummary> {
  const visit = await db.PastoralVisit.findByPk(id, {
    include: PASTORAL_VISIT_INCLUDES,
  });
  if (!visit) {
    throw new NotFoundError('Visita pastoral no encontrada');
  }
  return toPastoralVisitSummary(visit);
}

export async function createPastoralVisit(
  churchId: string,
  userId: string,
  input: CreatePastoralVisitInput,
): Promise<PastoralVisitSummary> {
  const conductor = await db.User.findOne({ where: { id: input.conductedBy, churchId } });
  if (!conductor) {
    throw new NotFoundError('El usuario que conducting no pertenece a su iglesia');
  }

  if (input.prayerRequestId) {
    const prayerRequest = await db.PrayerRequest.findOne({
      where: { id: input.prayerRequestId, churchId },
    });
    if (!prayerRequest) {
      throw new NotFoundError('La solicitud de oración indicada no pertenece a su iglesia');
    }
  }

  const visit = await db.PastoralVisit.create({
    churchId,
    memberId: input.memberId ?? null,
    visitorName: input.visitorName,
    visitDate: input.visitDate,
    visitType: input.visitType,
    reason: input.reason,
    notes: input.notes ?? null,
    outcome: input.outcome ?? null,
    followUpNeeded: input.followUpNeeded ?? false,
    followUpDate: input.followUpDate ?? null,
    followUpNotes: input.followUpNotes ?? null,
    prayerRequestId: input.prayerRequestId ?? null,
    conductedBy: input.conductedBy,
    createdBy: userId,
  });

  return getPastoralVisit(visit.id);
}

export async function updatePastoralVisit(
  id: string,
  input: UpdatePastoralVisitInput,
): Promise<PastoralVisitSummary> {
  const visit = await db.PastoralVisit.findByPk(id);
  if (!visit) {
    throw new NotFoundError('Visita pastoral no encontrada');
  }

  await visit.update({
    visitorName: input.visitorName ?? visit.visitorName,
    visitDate: input.visitDate ?? visit.visitDate,
    visitType: input.visitType ?? visit.visitType,
    reason: input.reason ?? visit.reason,
    notes: input.notes !== undefined ? input.notes : visit.notes,
    outcome: input.outcome !== undefined ? input.outcome : visit.outcome,
    followUpNeeded: input.followUpNeeded ?? visit.followUpNeeded,
    followUpDate: input.followUpDate !== undefined ? input.followUpDate : visit.followUpDate,
    followUpNotes: input.followUpNotes !== undefined ? input.followUpNotes : visit.followUpNotes,
  });

  return getPastoralVisit(id);
}

export async function deletePastoralVisit(id: string): Promise<void> {
  const visit = await db.PastoralVisit.findByPk(id);
  if (!visit) {
    throw new NotFoundError('Visita pastoral no encontrada');
  }
  await visit.destroy();
}
