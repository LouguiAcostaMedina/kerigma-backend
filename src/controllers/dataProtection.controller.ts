import type { Request, Response } from 'express';
import * as dataProtectionService from '../services/dataProtection.service';
import { ok } from '../utils/apiResponse';

export async function getConsentStatus(req: Request, res: Response): Promise<void> {
  const status = await dataProtectionService.getConsentStatus(req.params.memberId);
  res.status(200).json(ok(status));
}

export async function recordConsent(req: Request, res: Response): Promise<void> {
  const { memberId } = req.params;
  const { consentGiven } = req.body as { consentGiven: boolean };
  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  const result = await dataProtectionService.recordConsent(memberId, consentGiven, ip);
  res.status(200).json(ok(result, consentGiven ? 'Consentimiento registrado' : 'Consentimiento revocado'));
}

export async function exportMemberData(req: Request, res: Response): Promise<void> {
  const data = await dataProtectionService.exportMemberData(req.params.memberId);
  res.status(200).json(ok(data, 'Datos exportados correctamente'));
}

export async function anonymizeMemberData(req: Request, res: Response): Promise<void> {
  const result = await dataProtectionService.anonymizeMemberData(req.params.memberId);
  res.status(200).json(ok(result, 'Datos anonimizados correctamente'));
}

export async function hardDeleteMember(req: Request, res: Response): Promise<void> {
  await dataProtectionService.hardDeleteMember(req.params.memberId);
  res.status(200).json(ok(null, 'Miembro eliminado permanentemente'));
}
