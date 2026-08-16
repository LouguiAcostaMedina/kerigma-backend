import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { BibleStudent } from '../models/BibleStudent.model';
import type { BibleLessonProgress } from '../models/BibleLessonProgress.model';
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from '../schemas/student.schema';
import { BIBLE_LESSON_TITLES, TOTAL_BIBLE_LESSONS } from '../constants/lessons';
import { NotFoundError, ValidationError } from '../utils/errors';
import { summarizeLessonProgress } from '../utils/lessonProgress';

export interface LessonProgressView {
  lessonNumber: number;
  lessonTitle: string;
  isCompleted: boolean;
  completedAt: Date | null;
  score: string | null;
  notes: string | null;
}

export interface StudentSummary {
  id: string;
  churchId: string;
  groupId: string;
  disciplePairId: string | null;
  mentorId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: BibleStudent['gender'];
  enrollmentDate: string;
  program: BibleStudent['program'];
  level: BibleStudent['level'];
  status: BibleStudent['status'];
  isActive: boolean;
  notes: string | null;
  tags: string[] | null;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  isEligibleForGraduation: boolean;
  lessons: LessonProgressView[];
  createdAt: Date;
  updatedAt: Date;
  groupName: string | null;
  instructorName: string | null;
  startDate: string;
  photo: string | null;
  studentCode: string | null;
}

function lessonTitleFor(lessonNumber: number): string {
  return BIBLE_LESSON_TITLES[lessonNumber - 1] ?? `Lección ${lessonNumber}`;
}

function toLessonView(lesson: BibleLessonProgress): LessonProgressView {
  return {
    lessonNumber: lesson.lessonNumber,
    lessonTitle: lesson.lessonTitle ?? lessonTitleFor(lesson.lessonNumber),
    isCompleted: lesson.isCompleted,
    completedAt: lesson.completedAt,
    score: lesson.score,
    notes: lesson.notes,
  };
}

function toStudentSummary(student: BibleStudent): StudentSummary {
  const lessons = [...(student.lessons ?? [])].sort((a, b) => a.lessonNumber - b.lessonNumber);
  const progress = summarizeLessonProgress(lessons);

  return {
    id: student.id,
    churchId: student.churchId,
    groupId: student.groupId,
    disciplePairId: student.disciplePairId,
    mentorId: student.mentorId,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    phone: student.phone,
    gender: student.gender,
    enrollmentDate: student.enrollmentDate,
    program: student.program,
    level: student.level,
    status: student.status,
    isActive: student.isActive,
    notes: student.notes,
    tags: student.tags,
    completedLessons: progress.completedLessons,
    totalLessons: progress.totalLessons,
    progressPercentage: progress.progressPercentage,
    isEligibleForGraduation: progress.isEligibleForGraduation,
    lessons: lessons.map(toLessonView),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    groupName: student.group?.name ?? null,
    instructorName: student.mentor
      ? [student.mentor.firstName, student.mentor.lastName].filter(Boolean).join(' ')
      : null,
    startDate: student.enrollmentDate,
    photo: null,
    studentCode: null,
  };
}

async function findStudent(churchId: string, studentId: string): Promise<BibleStudent> {
  const student = await db.BibleStudent.findOne({
    where: { id: studentId, churchId },
    include: [
      { model: db.Group, as: 'group', attributes: ['id', 'name'] },
      { model: db.DisciplePair, as: 'disciplePair', attributes: ['id'] },
      { model: db.User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: db.BibleLessonProgress, as: 'lessons', separate: true },
    ],
  });
  if (!student) {
    throw new NotFoundError('Estudiante no encontrado');
  }
  return student;
}

export async function createStudent(
  churchId: string,
  actorId: string,
  input: CreateStudentInput,
): Promise<StudentSummary> {
  const group = await db.Group.findOne({ where: { id: input.groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  if (input.mentorId) {
    const mentor = await db.User.findOne({ where: { id: input.mentorId, churchId } });
    if (!mentor) {
      throw new NotFoundError('El mentor indicado no pertenece a su iglesia');
    }
  }

  if (input.disciplePairId) {
    const pair = await db.DisciplePair.findOne({
      where: { id: input.disciplePairId, groupId: input.groupId, churchId },
    });
    if (!pair) {
      throw new ValidationError('La pareja de discipulado no pertenece al grupo indicado');
    }
  }

  const student = await db.BibleStudent.create({
    churchId,
    groupId: input.groupId,
    disciplePairId: input.disciplePairId ?? null,
    mentorId: input.mentorId ?? null,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    gender: input.gender ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    district: input.district ?? null,
    enrollmentDate: input.enrollmentDate ?? new Date().toISOString().slice(0, 10),
    program: input.program ?? 'basic_bible',
    level: input.level ?? 'beginner',
    totalLessons: TOTAL_BIBLE_LESSONS,
    isBeliever: input.isBeliever ?? false,
    baptized: input.baptized ?? false,
    churchMember: input.churchMember ?? false,
    isActive: true,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
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

  return getStudent(churchId, student.id);
}

export async function getStudent(churchId: string, studentId: string): Promise<StudentSummary> {
  const student = await findStudent(churchId, studentId);
  return toStudentSummary(student);
}

export async function updateStudent(
  churchId: string,
  studentId: string,
  actorId: string,
  input: UpdateStudentInput,
): Promise<StudentSummary> {
  const student = await db.BibleStudent.findOne({ where: { id: studentId, churchId } });
  if (!student) {
    throw new NotFoundError('Estudiante no encontrado');
  }

  if (input.mentorId) {
    const mentor = await db.User.findOne({ where: { id: input.mentorId, churchId } });
    if (!mentor) {
      throw new NotFoundError('El mentor indicado no pertenece a su iglesia');
    }
  }

  if (input.disciplePairId) {
    const pair = await db.DisciplePair.findOne({
      where: { id: input.disciplePairId, groupId: student.groupId, churchId },
    });
    if (!pair) {
      throw new ValidationError('La pareja de discipulado no pertenece al grupo del estudiante');
    }
  }

  await student.update({
    firstName: input.firstName ?? student.firstName,
    lastName: input.lastName ?? student.lastName,
    email: input.email !== undefined ? input.email : student.email,
    phone: input.phone !== undefined ? input.phone : student.phone,
    dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : student.dateOfBirth,
    gender: input.gender !== undefined ? input.gender : student.gender,
    address: input.address !== undefined ? input.address : student.address,
    city: input.city !== undefined ? input.city : student.city,
    district: input.district !== undefined ? input.district : student.district,
    enrollmentDate: input.enrollmentDate ?? student.enrollmentDate,
    program: input.program ?? student.program,
    level: input.level ?? student.level,
    disciplePairId: input.disciplePairId !== undefined ? input.disciplePairId : student.disciplePairId,
    isBeliever: input.isBeliever ?? student.isBeliever,
    baptized: input.baptized ?? student.baptized,
    churchMember: input.churchMember ?? student.churchMember,
    notes: input.notes !== undefined ? input.notes : student.notes,
    tags: input.tags !== undefined ? input.tags : student.tags,
    updatedBy: actorId,
  });

  return getStudent(churchId, studentId);
}

const STUDENT_LIST_INCLUDES = [
  { model: db.Group, as: 'group', attributes: ['id', 'name'] },
  { model: db.User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email'] },
  { model: db.BibleLessonProgress, as: 'lessons', separate: true },
];

export async function listStudents(
  scopeChurchId: string | null,
  query: ListStudentsQuery,
): Promise<{ students: StudentSummary[]; total: number }> {
  const { page, limit, search, church, group, instructor, status, level, baptized, sortBy, sortOrder } = query;

  const where: WhereOptions = {};
  if (scopeChurchId) {
    where.churchId = scopeChurchId;
  } else if (church) {
    where.churchId = church;
  }
  if (group) {
    where.groupId = group;
  }
  if (instructor) {
    where.mentorId = instructor;
  }
  if (status) {
    where.status = status;
  }
  if (level) {
    where.level = level;
  }
  if (baptized === 'true') {
    where.baptized = true;
  } else if (baptized === 'false') {
    where.baptized = false;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { firstName: { [Op.iLike]: term } },
      { lastName: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
    ];
  }

  const sortColumn = sortBy === 'progressPercentage' ? 'completedLessons' : sortBy;

  const { rows, count } = await db.BibleStudent.findAndCountAll({
    where,
    include: STUDENT_LIST_INCLUDES,
    order: [[sortColumn as string, sortOrder]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  let students = rows.map(toStudentSummary);
  if (sortBy === 'progressPercentage') {
    students = students.sort((a, b) =>
      sortOrder === 'ASC'
        ? a.progressPercentage - b.progressPercentage
        : b.progressPercentage - a.progressPercentage,
    );
  }

  return { students, total: count };
}

export async function deleteStudent(scopeChurchId: string | null, studentId: string): Promise<void> {
  const where: WhereOptions = { id: studentId };
  if (scopeChurchId) {
    where.churchId = scopeChurchId;
  }
  const student = await db.BibleStudent.findOne({ where });
  if (!student) {
    throw new NotFoundError('Estudiante no encontrado');
  }
  await student.destroy();
}

export async function deleteMultipleStudents(scopeChurchId: string | null, ids: string[]): Promise<void> {
  const where: WhereOptions = { id: { [Op.in]: ids } };
  if (scopeChurchId) {
    where.churchId = scopeChurchId;
  }
  await db.BibleStudent.destroy({ where });
}

export async function updateStudentStatus(
  churchId: string,
  studentId: string,
  actorId: string,
  status: BibleStudent['status'],
): Promise<StudentSummary> {
  const student = await db.BibleStudent.findOne({ where: { id: studentId, churchId } });
  if (!student) {
    throw new NotFoundError('Estudiante no encontrado');
  }
  await student.update({ status, updatedBy: actorId });
  return getStudent(churchId, studentId);
}

export async function updateStudentLevel(
  churchId: string,
  studentId: string,
  actorId: string,
  level: BibleStudent['level'],
): Promise<StudentSummary> {
  const student = await db.BibleStudent.findOne({ where: { id: studentId, churchId } });
  if (!student) {
    throw new NotFoundError('Estudiante no encontrado');
  }
  await student.update({ level, updatedBy: actorId });
  return getStudent(churchId, studentId);
}

export async function exportStudentsToExcel(
  scopeChurchId: string | null,
  query: ListStudentsQuery,
): Promise<Record<string, unknown>[]> {
  const { students } = await listStudents(scopeChurchId, { ...query, page: 1, limit: 500 });
  return students.map((student) => ({
    ID: student.id,
    Nombre: student.firstName,
    Apellido: student.lastName,
    Email: student.email ?? '',
    Teléfono: student.phone ?? '',
    Grupo: student.groupName ?? '',
    Instructor: student.instructorName ?? '',
    Programa: student.program,
    Nivel: student.level,
    Estado: student.status,
    'Lecciones completadas': student.completedLessons,
    'Progreso (%)': student.progressPercentage,
    'Fecha de inscripción': student.enrollmentDate,
    'Creado el': student.createdAt.toISOString().slice(0, 10),
  }));
}

