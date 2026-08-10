import { db } from '../models';
import {
  bulkImportSchema,
  memberRowSchema,
  studentRowSchema,
  groupRowSchema,
  userRowSchema,
  churchRowSchema,
  type BulkImportInput,
  type MemberImportRow,
  type StudentImportRow,
  type GroupImportRow,
  type UserImportRow,
  type ChurchImportRow,
} from '../schemas/bulkImport.schema';
import { ValidationError } from '../utils/errors';
import { BIBLE_LESSON_TITLES, TOTAL_BIBLE_LESSONS } from '../constants/lessons';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

export interface ImportError {
  row: number;
  message: string;
}

async function importMembers(
  churchId: string,
  _actorId: string,
  rows: Record<string, unknown>[],
  groupId: string | undefined,
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let imported = 0;
  let skipped = 0;

  if (!groupId) {
    throw new ValidationError('Se requiere un groupId para importar miembros');
  }

  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new ValidationError('El grupo especificado no existe en su iglesia');
  }

  const existingMembers = await db.Member.findAll({
    where: { groupId },
    include: [{ model: db.Group, as: 'group', attributes: ['churchId'] }],
  });
  const existingEmails = new Set(
    existingMembers
      .map(m => {
        const g = m.group as { churchId: string } | undefined;
        return g?.churchId === churchId ? (m as { email: string | null }).email : null;
      })
      .filter(Boolean) as string[],
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    try {
      const parsed = memberRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: rowNum, message: parsed.error.errors.map(e => e.message).join('; ') });
        skipped++;
        continue;
      }
      const data = parsed.data as MemberImportRow;
      if (data.email && existingEmails.has(data.email)) {
        errors.push({ row: rowNum, message: `Email ${data.email} ya existe en el grupo` });
        skipped++;
        continue;
      }

      await db.Member.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender ?? null,
        maritalStatus: data.maritalStatus ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        district: data.district ?? null,
        groupId,
        baptized: data.baptized ?? false,
        baptismDate: null,
        conversionDate: null,
        spiritualStatus: data.spiritualStatus ?? 'visitor',
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        occupation: data.occupation ?? null,
        education: data.education ?? null,
        emergencyContact: null,
        isActive: true,
        notes: data.notes ?? null,
        tags: [],
      });

      if (data.email) {
        existingEmails.add(data.email);
      }
      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      errors.push({ row: rowNum, message });
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importStudents(
  churchId: string,
  actorId: string,
  rows: Record<string, unknown>[],
  groupId: string | undefined,
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let imported = 0;
  let skipped = 0;

  if (!groupId) {
    throw new ValidationError('Se requiere un groupId para importar estudiantes');
  }

  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new ValidationError('El grupo especificado no existe en su iglesia');
  }

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    try {
      const parsed = studentRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: rowNum, message: parsed.error.errors.map(e => e.message).join('; ') });
        skipped++;
        continue;
      }
      const data = parsed.data as StudentImportRow;

      const student = await db.BibleStudent.create({
        churchId,
        groupId,
        disciplePairId: null,
        mentorId: null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        district: data.district ?? null,
        enrollmentDate: new Date().toISOString().slice(0, 10),
        program: data.program ?? 'basic_bible',
        level: data.level ?? 'beginner',
        totalLessons: TOTAL_BIBLE_LESSONS,
        isBeliever: data.isBeliever ?? false,
        baptized: data.baptized ?? false,
        churchMember: false,
        isActive: true,
        notes: data.notes ?? null,
        tags: [],
        createdBy: actorId,
        updatedBy: actorId,
      });

      await db.BibleLessonProgress.bulkCreate(
        BIBLE_LESSON_TITLES.map((title, index) => ({
          churchId,
          bibleStudentId: student.id,
          lessonNumber: index + 1,
          lessonTitle: title,
          isCompleted: false,
          createdBy: actorId,
        })),
      );

      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      errors.push({ row: rowNum, message });
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importGroups(
  churchId: string,
  actorId: string,
  rows: Record<string, unknown>[],
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let imported = 0;
  let skipped = 0;

  const existingNames = new Set(
    (await db.Group.findAll({ where: { churchId }, attributes: ['name'] })).map(g => g.name.toLowerCase()),
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    try {
      const parsed = groupRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: rowNum, message: parsed.error.errors.map(e => e.message).join('; ') });
        skipped++;
        continue;
      }
      const data = parsed.data as GroupImportRow;

      if (existingNames.has(data.name.toLowerCase())) {
        errors.push({ row: rowNum, message: `El grupo "${data.name}" ya existe` });
        skipped++;
        continue;
      }

      await db.Group.create({
        churchId,
        name: data.name,
        description: data.description ?? null,
        leaderId: actorId,
        type: data.type ?? 'mixed',
        category: data.category ?? 'bible_study',
        meetingDay: data.meetingDay ?? 'wednesday',
        meetingTime: data.meetingTime ?? '19:00',
        meetingLocation: data.meetingLocation ?? null,
        maxCapacity: data.maxCapacity ?? null,
        isOpenToNewMembers: data.isOpenToNewMembers ?? true,
        status: 'active',
        createdBy: actorId,
        updatedBy: actorId,
      });

      existingNames.add(data.name.toLowerCase());
      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      errors.push({ row: rowNum, message });
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importUsers(
  _churchId: string,
  _actorId: string,
  rows: Record<string, unknown>[],
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let imported = 0;
  let skipped = 0;

  const existingEmails = new Set(
    (await db.User.findAll({ attributes: ['email'] })).map(u => u.email?.toLowerCase()),
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    try {
      const parsed = userRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: rowNum, message: parsed.error.errors.map(e => e.message).join('; ') });
        skipped++;
        continue;
      }
      const data = parsed.data as UserImportRow;
      const emailLower = data.email.toLowerCase();

      if (existingEmails.has(emailLower)) {
        errors.push({ row: rowNum, message: `El email ${data.email} ya está registrado` });
        skipped++;
        continue;
      }

      const password = data.password ?? `${data.firstName.toLowerCase()}${Date.now().toString(36)}`;

      await db.User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: emailLower,
        password,
        role: data.role ?? 'reader',
        isActive: true,
      });

      existingEmails.add(emailLower);
      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      errors.push({ row: rowNum, message });
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importChurches(
  _scopeChurchId: string,
  actorId: string,
  rows: Record<string, unknown>[],
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let imported = 0;
  let skipped = 0;

  const existing = await db.Church.findAll({
    attributes: ['name', 'city', 'email'],
    paranoid: false,
  });
  const existingNames = new Set(
    existing.map(c => `${String(c.name).toLowerCase()}|${String(c.city).toLowerCase()}`),
  );
  const existingEmails = new Set(
    existing.map(c => c.email?.toLowerCase()).filter(Boolean) as string[],
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    try {
      const parsed = churchRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: rowNum, message: parsed.error.errors.map(e => e.message).join('; ') });
        skipped++;
        continue;
      }
      const data = parsed.data as ChurchImportRow;

      if (existingNames.has(`${data.name.toLowerCase()}|${data.city.toLowerCase()}`)) {
        errors.push({ row: rowNum, message: `La iglesia "${data.name}" en ${data.city} ya existe` });
        skipped++;
        continue;
      }
      if (data.email && existingEmails.has(data.email.toLowerCase())) {
        errors.push({ row: rowNum, message: `El email ${data.email} ya está registrado` });
        skipped++;
        continue;
      }

      await db.Church.create({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        pastor: data.pastor ?? null,
        pastorPhone: data.pastorPhone ?? null,
        pastorEmail: data.pastorEmail ?? null,
        capacity: data.capacity ?? null,
        status: data.status ?? 'active',
        foundedDate: data.foundedDate ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        createdBy: actorId,
        updatedBy: actorId,
      });

      existingNames.add(`${data.name.toLowerCase()}|${data.city.toLowerCase()}`);
      if (data.email) {
        existingEmails.add(data.email.toLowerCase());
      }
      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      errors.push({ row: rowNum, message });
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

export async function executeBulkImport(
  input: BulkImportInput,
  churchId: string,
  actorId: string,
): Promise<ImportResult> {
  const validated = bulkImportSchema.parse(input);

  switch (validated.entity) {
    case 'members':
      return importMembers(churchId, actorId, validated.rows, validated.groupId);
    case 'students':
      return importStudents(churchId, actorId, validated.rows, validated.groupId);
    case 'groups':
      return importGroups(churchId, actorId, validated.rows);
    case 'users':
      return importUsers(churchId, actorId, validated.rows);
    case 'churches':
      return importChurches(churchId, actorId, validated.rows);
    default:
      throw new ValidationError(`Entidad "${validated.entity}" no soportada para importación`);
  }
}
