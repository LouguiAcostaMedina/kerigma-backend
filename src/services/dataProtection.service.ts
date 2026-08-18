import { db } from '../models';
import { Group } from '../models/Group.model';
import { NotFoundError, ValidationError } from '../utils/errors';
import { createHash } from 'crypto';

interface MemberDataExport {
  personalData: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    maritalStatus: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
    occupation: string | null;
    education: string | null;
    emergencyContact: Record<string, unknown> | null;
  };
  membershipData: {
    groupId: string;
    groupName: string | null;
    baptized: boolean;
    baptismDate: string | null;
    conversionDate: string | null;
    spiritualStatus: string;
    joinDate: string;
    status: string;
    attendanceScore: number | null;
    notes: string | null;
    tags: string[] | null;
  };
  consentData: {
    consentGiven: boolean;
    consentDate: Date | null;
    consentVersion: string | null;
  };
  exportDate: Date;
  dataController: string;
}

const ANONYMIZED_MARKER = 'ELIMINADO';

function anonymizeEmail(original: string | null): string {
  if (!original) return '';
  const hash = createHash('sha256').update(original).digest('hex').substring(0, 12);
  return `anonymized-${hash}@deleted.local`;
}

function anonymizePhone(original: string | null): string {
  if (!original) return '';
  const hash = createHash('sha256').update(original).digest('hex').substring(0, 8);
  return `+000-${hash}`;
}

export async function exportMemberData(memberId: string): Promise<MemberDataExport> {
  const member = await db.Member.findByPk(memberId, {
    include: [{ model: Group, as: 'group', attributes: ['id', 'name'] }],
  });

  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  if (member.dataRetentionStatus === 'anonymized') {
    throw new ValidationError('Los datos de este miembro ya han sido anonimizados');
  }

  const group = member.group as { id: string; name: string } | undefined;

  return {
    personalData: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      maritalStatus: member.maritalStatus,
      address: member.address,
      city: member.city,
      district: member.district,
      occupation: member.occupation,
      education: member.education,
      emergencyContact: member.emergencyContact,
    },
    membershipData: {
      groupId: member.groupId,
      groupName: group?.name ?? null,
      baptized: member.baptized,
      baptismDate: member.baptismDate,
      conversionDate: member.conversionDate,
      spiritualStatus: member.spiritualStatus,
      joinDate: member.joinDate,
      status: member.status,
      attendanceScore: member.attendanceScore,
      notes: member.notes,
      tags: member.tags,
    },
    consentData: {
      consentGiven: member.consentGiven,
      consentDate: member.consentDate,
      consentVersion: member.consentVersion,
    },
    exportDate: new Date(),
    dataController: 'Sistema de Gestión Misionera',
  };
}

export async function anonymizeMemberData(memberId: string): Promise<{ anonymized: boolean; memberId: string }> {
  const member = await db.Member.findByPk(memberId);

  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  if (member.dataRetentionStatus === 'anonymized') {
    throw new ValidationError('Los datos de este miembro ya han sido anonimizados');
  }

  await member.update({
    firstName: ANONYMIZED_MARKER,
    lastName: ANONYMIZED_MARKER,
    email: anonymizeEmail(member.email),
    phone: anonymizePhone(member.phone),
    dateOfBirth: null,
    gender: null,
    maritalStatus: null,
    address: null,
    city: null,
    district: null,
    occupation: null,
    education: null,
    emergencyContact: null,
    notes: null,
    tags: [],
    isActive: false,
    status: 'inactive',
    dataRetentionStatus: 'anonymized',
  });

  return { anonymized: true, memberId };
}

export async function hardDeleteMember(memberId: string): Promise<void> {
  const member = await db.Member.findByPk(memberId, { paranoid: false });

  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  if (member.dataRetentionStatus !== 'anonymized' && member.dataRetentionStatus !== 'pending_deletion') {
    throw new ValidationError('Solo se pueden eliminar permanentemente miembros anonimizados o pendientes de eliminación');
  }

  await member.destroy({ force: true });
}

export async function getConsentStatus(memberId: string): Promise<{
  consentGiven: boolean;
  consentDate: Date | null;
  consentVersion: string | null;
  dataRetentionStatus: string;
}> {
  const member = await db.Member.findByPk(memberId, {
    attributes: ['id', 'consentGiven', 'consentDate', 'consentVersion', 'dataRetentionStatus'],
  });

  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  return {
    consentGiven: member.consentGiven,
    consentDate: member.consentDate,
    consentVersion: member.consentVersion,
    dataRetentionStatus: member.dataRetentionStatus,
  };
}

export async function recordConsent(
  memberId: string,
  consentGiven: boolean,
  ip: string | null,
): Promise<{ consentGiven: boolean; consentDate: Date }> {
  const member = await db.Member.findByPk(memberId);

  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  const now = new Date();
  await member.update({
    consentGiven,
    consentDate: now,
    consentIp: ip,
    consentVersion: '1.0',
  });

  return { consentGiven, consentDate: now };
}
