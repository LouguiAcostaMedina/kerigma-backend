import type { Request, Response } from 'express';
import { env } from '../config/env';
import type {
  CreateAttendanceBulkInput,
  ListAttendanceQuery,
  PublicCheckinInput,
} from '../schemas/metric.schema';
import * as attendanceService from '../services/attendance.service';
import { ok } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/errors';

function requireChurchId(req: Request): string {
  if (!req.user?.churchId) {
    throw new UnauthorizedError('El usuario no está asociado a ninguna iglesia');
  }
  return req.user.churchId;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function recordBulkAttendance(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const body = req.body as CreateAttendanceBulkInput;
  const result = await attendanceService.recordBulkAttendance(churchId, body.groupId, req.user.id, body);
  res.status(200).json(ok(result, 'Asistencia registrada exitosamente'));
}

export async function listAttendanceByGroup(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  const records = await attendanceService.listAttendanceByGroup(
    churchId,
    req.params.groupId,
    req.query as ListAttendanceQuery,
  );
  res.status(200).json(ok(records));
}

export async function getCheckinPage(req: Request, res: Response): Promise<void> {
  const data = await attendanceService.getCheckinPageData(req.params.groupId);
  const basePath = `${env.apiBasePath}/${env.apiVersion}`;
  const checkinUrl = `${basePath}/attendance/checkin/${data.groupId}`;

  const memberButtons = data.members
    .map(
      (member) => `
        <button class="member-btn" data-member-id="${member.id}">
          ${escapeHtml(`${member.firstName} ${member.lastName}`)}
        </button>
      `,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro de Asistencia - ${escapeHtml(data.groupName)}</title>
  <link rel="stylesheet" href="/checkin.css">
</head>
<body>
  <div class="card" data-checkin-url="${checkinUrl}">
    <h1>Registro de Asistencia</h1>
    <p class="meta">${escapeHtml(data.groupName)} · ${escapeHtml(data.meetingDate)}</p>
    <div class="member-list">${memberButtons}</div>
    <div id="status" class="status"></div>
  </div>
  <script src="/checkin.js"></script>
</body>
</html>`;

  res.status(200).type('html').send(html);
}

export async function publicCheckin(req: Request, res: Response): Promise<void> {
  const body = req.body as PublicCheckinInput;
  const record = await attendanceService.checkinPublic(req.params.groupId, body.memberId);
  res.status(200).json(ok(record, 'Asistencia registrada exitosamente'));
}
