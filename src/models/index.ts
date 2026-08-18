import { createSequelize, testConnection } from '../config/database';
import defineChurch, { Church } from './Church.model';
import defineUser, { User } from './User.model';
import defineGroup, { Group } from './Group.model';
import defineQuarter, { Quarter } from './Quarter.model';
import defineMember, { Member } from './Member.model';
import defineWeeklyMetric, { WeeklyMetric } from './WeeklyMetric.model';
import defineBibleStudent, { BibleStudent } from './BibleStudent.model';
import defineBibleLessonProgress, { BibleLessonProgress } from './BibleLessonProgress.model';
import defineDisciplePair, { DisciplePair } from './DisciplePair.model';
import defineAttendanceRecord, { AttendanceRecord } from './AttendanceRecord.model';
import defineQuarterlyGoal, { QuarterlyGoal } from './QuarterlyGoal.model';
import defineCustomReport, { CustomReport } from './CustomReport.model';
import defineAuditLog, { AuditLog } from './AuditLog.model';
import defineFinancialContribution, { FinancialContribution } from './FinancialContribution.model';
import defineActivity, { Activity } from './Activity.model';
import defineNotification, { Notification } from './Notification.model';
import defineAssociation, { Association } from './Association.model';
import defineDistrict, { District } from './District.model';
import defineMinistry, { Ministry, MinistryAssignment } from './Ministry.model';
import definePrayerRequest, { PrayerRequest, PastoralVisit } from './PrayerRequest.model';
import defineChurchDocument, { ChurchDocument } from './ChurchDocument.model';
import defineFeatureFlag, { FeatureFlag } from './FeatureFlag.model';
import defineClient, { Client } from './Client.model';
import definePayment, { Payment } from './Payment.model';

const sequelize = createSequelize();

defineChurch(sequelize);
defineUser(sequelize);
defineGroup(sequelize);
defineQuarter(sequelize);
defineMember(sequelize);
defineWeeklyMetric(sequelize);
defineBibleStudent(sequelize);
defineBibleLessonProgress(sequelize);
defineDisciplePair(sequelize);
defineAttendanceRecord(sequelize);
defineQuarterlyGoal(sequelize);
defineCustomReport(sequelize);
defineAuditLog(sequelize);
defineFinancialContribution(sequelize);
defineActivity(sequelize);
defineNotification(sequelize);
defineAssociation(sequelize);
defineDistrict(sequelize);
defineMinistry(sequelize);
definePrayerRequest(sequelize);
defineChurchDocument(sequelize);
defineFeatureFlag(sequelize);
defineClient(sequelize);
definePayment(sequelize);

// =============================================
// ASOCIACIONES
// =============================================

// Church - User
Church.hasMany(User, { foreignKey: 'churchId', as: 'members' });
User.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Church - User (pastor y líder asignados)
Church.belongsTo(User, { foreignKey: 'pastorId', as: 'pastorUser' });
Church.belongsTo(User, { foreignKey: 'leaderId', as: 'leaderUser' });

// User (líder) - Group
User.hasMany(Group, { foreignKey: 'leaderId', as: 'ledGroups' });
Group.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });

// User - CustomReport
User.hasMany(CustomReport, { foreignKey: 'userId', as: 'customReports', onDelete: 'CASCADE' });
CustomReport.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// User (maestro principal) - Group
User.hasMany(Group, { foreignKey: 'mainTeacherId', as: 'groupsAsMainTeacher' });
Group.belongsTo(User, { foreignKey: 'mainTeacherId', as: 'mainTeacher' });

// User (maestro asociado) - Group
User.hasMany(Group, { foreignKey: 'associateTeacherId', as: 'groupsAsAssociateTeacher' });
Group.belongsTo(User, { foreignKey: 'associateTeacherId', as: 'associateTeacher' });

// Church - Group
Church.hasMany(Group, { foreignKey: 'churchId', as: 'groups', onDelete: 'CASCADE' });
Group.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Church - Quarter
Church.hasMany(Quarter, { foreignKey: 'churchId', as: 'quarters', onDelete: 'CASCADE' });
Quarter.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Group - Member
Group.hasMany(Member, { foreignKey: 'groupId', as: 'members', onDelete: 'CASCADE' });
Member.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// Church - WeeklyMetric
Church.hasMany(WeeklyMetric, { foreignKey: 'churchId', as: 'weeklyMetrics', onDelete: 'CASCADE' });
WeeklyMetric.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Group - WeeklyMetric
Group.hasMany(WeeklyMetric, { foreignKey: 'groupId', as: 'weeklyMetrics', onDelete: 'CASCADE' });
WeeklyMetric.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// Quarter - WeeklyMetric
Quarter.hasMany(WeeklyMetric, { foreignKey: 'quarterId', as: 'weeklyMetrics' });
WeeklyMetric.belongsTo(Quarter, { foreignKey: 'quarterId', as: 'quarter' });

// Church - BibleStudent
Church.hasMany(BibleStudent, { foreignKey: 'churchId', as: 'bibleStudents', onDelete: 'CASCADE' });
BibleStudent.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Group - BibleStudent
Group.hasMany(BibleStudent, { foreignKey: 'groupId', as: 'bibleStudents', onDelete: 'CASCADE' });
BibleStudent.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// User (mentor) - BibleStudent
User.hasMany(BibleStudent, { foreignKey: 'mentorId', as: 'mentoredStudents' });
BibleStudent.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });

// DisciplePair - BibleStudent (estudiante vinculado a una pareja)
DisciplePair.hasMany(BibleStudent, { foreignKey: 'disciplePairId', as: 'bibleStudents', onDelete: 'SET NULL' });
BibleStudent.belongsTo(DisciplePair, { foreignKey: 'disciplePairId', as: 'disciplePair' });

// BibleStudent - BibleLessonProgress
BibleStudent.hasMany(BibleLessonProgress, { foreignKey: 'bibleStudentId', as: 'lessons', onDelete: 'CASCADE' });
BibleLessonProgress.belongsTo(BibleStudent, { foreignKey: 'bibleStudentId', as: 'bibleStudent' });

// Church - BibleLessonProgress
Church.hasMany(BibleLessonProgress, { foreignKey: 'churchId', as: 'lessonsProgress', onDelete: 'CASCADE' });
BibleLessonProgress.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// User - BibleLessonProgress (quien completa la lección)
User.hasMany(BibleLessonProgress, { foreignKey: 'completedBy', as: 'completedLessons' });
BibleLessonProgress.belongsTo(User, { foreignKey: 'completedBy', as: 'completedByUser' });

// Group - DisciplePair
Group.hasMany(DisciplePair, { foreignKey: 'groupId', as: 'disciplePairs', onDelete: 'CASCADE' });
DisciplePair.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// Member (miembro 1 / discipulador) - DisciplePair
Member.hasMany(DisciplePair, { foreignKey: 'member1Id', as: 'pairsAsMentor' });
DisciplePair.belongsTo(Member, { foreignKey: 'member1Id', as: 'member1' });

// Member (miembro 2 / discípulo) - DisciplePair
Member.hasMany(DisciplePair, { foreignKey: 'member2Id', as: 'pairsAsDisciple' });
DisciplePair.belongsTo(Member, { foreignKey: 'member2Id', as: 'member2' });

// User (mentor) - DisciplePair
User.hasMany(DisciplePair, { foreignKey: 'mentorId', as: 'mentoredPairs' });
DisciplePair.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });

// BibleStudent (discípulo) - DisciplePair
BibleStudent.hasMany(DisciplePair, { foreignKey: 'discipleId', as: 'disciplePairs' });
DisciplePair.belongsTo(BibleStudent, { foreignKey: 'discipleId', as: 'disciple' });

// Church - DisciplePair
Church.hasMany(DisciplePair, { foreignKey: 'churchId', as: 'disciplePairs', onDelete: 'CASCADE' });
DisciplePair.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// User - AuditLog
User.hasMany(AuditLog, { foreignKey: 'actorUserId', as: 'auditLogs', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });

// Church - FinancialContribution
Church.hasMany(FinancialContribution, { foreignKey: 'churchId', as: 'financialContributions', onDelete: 'CASCADE' });
FinancialContribution.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Member - FinancialContribution
Member.hasMany(FinancialContribution, { foreignKey: 'memberId', as: 'contributions', onDelete: 'CASCADE' });
FinancialContribution.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// User (recordedBy) - FinancialContribution
User.hasMany(FinancialContribution, { foreignKey: 'recordedBy', as: 'recordedContributions' });
FinancialContribution.belongsTo(User, { foreignKey: 'recordedBy', as: 'recordedByUser' });

// Group - AttendanceRecord
Group.hasMany(AttendanceRecord, { foreignKey: 'groupId', as: 'attendanceRecords', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// Member - AttendanceRecord
Member.hasMany(AttendanceRecord, { foreignKey: 'memberId', as: 'attendanceRecords', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// User (quien registra) - AttendanceRecord
User.hasMany(AttendanceRecord, { foreignKey: 'recordedBy', as: 'recordedAttendance' });
AttendanceRecord.belongsTo(User, { foreignKey: 'recordedBy', as: 'recordedByUser' });

// Church - AttendanceRecord
Church.hasMany(AttendanceRecord, { foreignKey: 'churchId', as: 'attendanceRecords', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Quarter - QuarterlyGoal
Quarter.hasMany(QuarterlyGoal, { foreignKey: 'quarterId', as: 'quarterlyGoals', onDelete: 'CASCADE' });
QuarterlyGoal.belongsTo(Quarter, { foreignKey: 'quarterId', as: 'quarter' });

// Group - QuarterlyGoal
Group.hasMany(QuarterlyGoal, { foreignKey: 'groupId', as: 'quarterlyGoals' });
QuarterlyGoal.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// Church - QuarterlyGoal
Church.hasMany(QuarterlyGoal, { foreignKey: 'churchId', as: 'quarterlyGoals', onDelete: 'CASCADE' });
QuarterlyGoal.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Association - District
Association.hasMany(District, { foreignKey: 'associationId', as: 'districts', onDelete: 'CASCADE' });
District.belongsTo(Association, { foreignKey: 'associationId', as: 'association' });

// District - Church
District.hasMany(Church, { foreignKey: 'districtId', as: 'churches', onDelete: 'SET NULL' });
Church.belongsTo(District, { foreignKey: 'districtId', as: 'district' });

// Association - User (president)
Association.belongsTo(User, { foreignKey: 'presidentId', as: 'president' });

// District - User (director)
District.belongsTo(User, { foreignKey: 'directorId', as: 'director' });

// Church - Ministry
Church.hasMany(Ministry, { foreignKey: 'churchId', as: 'ministries', onDelete: 'CASCADE' });
Ministry.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// User (leader) - Ministry
User.hasMany(Ministry, { foreignKey: 'leaderId', as: 'ledMinistries' });
Ministry.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });

// Ministry - MinistryAssignment
Ministry.hasMany(MinistryAssignment, { foreignKey: 'ministryId', as: 'assignments', onDelete: 'CASCADE' });
MinistryAssignment.belongsTo(Ministry, { foreignKey: 'ministryId', as: 'ministry' });

// Member - MinistryAssignment
Member.hasMany(MinistryAssignment, { foreignKey: 'memberId', as: 'ministryAssignments', onDelete: 'CASCADE' });
MinistryAssignment.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Church - PrayerRequest
Church.hasMany(PrayerRequest, { foreignKey: 'churchId', as: 'prayerRequests', onDelete: 'CASCADE' });
PrayerRequest.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Member - PrayerRequest
Member.hasMany(PrayerRequest, { foreignKey: 'memberId', as: 'prayerRequests' });
PrayerRequest.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// User (assignedTo) - PrayerRequest
User.hasMany(PrayerRequest, { foreignKey: 'assignedTo', as: 'assignedPrayers' });
PrayerRequest.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Church - PastoralVisit
Church.hasMany(PastoralVisit, { foreignKey: 'churchId', as: 'pastoralVisits', onDelete: 'CASCADE' });
PastoralVisit.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Member - PastoralVisit
Member.hasMany(PastoralVisit, { foreignKey: 'memberId', as: 'pastoralVisits' });
PastoralVisit.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// PrayerRequest - PastoralVisit
PrayerRequest.hasMany(PastoralVisit, { foreignKey: 'prayerRequestId', as: 'visits' });
PastoralVisit.belongsTo(PrayerRequest, { foreignKey: 'prayerRequestId', as: 'prayerRequest' });

// User (conductedBy) - PastoralVisit
User.hasMany(PastoralVisit, { foreignKey: 'conductedBy', as: 'conductedVisits' });
PastoralVisit.belongsTo(User, { foreignKey: 'conductedBy', as: 'conductor' });

// Church - ChurchDocument
Church.hasMany(ChurchDocument, { foreignKey: 'churchId', as: 'documents', onDelete: 'CASCADE' });
ChurchDocument.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// User (uploader) - ChurchDocument
User.hasMany(ChurchDocument, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
ChurchDocument.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Client - Church
Client.hasMany(Church, { foreignKey: 'clientId', as: 'churches' });
Church.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Client - User
Client.hasMany(User, { foreignKey: 'clientId', as: 'users' });
User.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Church - Payment
Church.hasMany(Payment, { foreignKey: 'churchId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Church, { foreignKey: 'churchId', as: 'church' });

// Member - Payment
Member.hasMany(Payment, { foreignKey: 'memberId', as: 'payments' });
Payment.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

export interface DbModels {
  Church: typeof Church;
  User: typeof User;
  Group: typeof Group;
  Quarter: typeof Quarter;
  Member: typeof Member;
  WeeklyMetric: typeof WeeklyMetric;
  BibleStudent: typeof BibleStudent;
  BibleLessonProgress: typeof BibleLessonProgress;
  DisciplePair: typeof DisciplePair;
  AttendanceRecord: typeof AttendanceRecord;
  QuarterlyGoal: typeof QuarterlyGoal;
  CustomReport: typeof CustomReport;
  AuditLog: typeof AuditLog;
  FinancialContribution: typeof FinancialContribution;
  Activity: typeof Activity;
  Notification: typeof Notification;
  Association: typeof Association;
  District: typeof District;
  Ministry: typeof Ministry;
  MinistryAssignment: typeof MinistryAssignment;
  PrayerRequest: typeof PrayerRequest;
  PastoralVisit: typeof PastoralVisit;
  ChurchDocument: typeof ChurchDocument;
  FeatureFlag: typeof FeatureFlag;
  Client: typeof Client;
  Payment: typeof Payment;
  sequelize: typeof sequelize;
}

export const db: DbModels = {
  Church,
  User,
  Group,
  Quarter,
  Member,
  WeeklyMetric,
  BibleStudent,
  BibleLessonProgress,
  DisciplePair,
  AttendanceRecord,
  QuarterlyGoal,
  CustomReport,
  AuditLog,
  FinancialContribution,
  Activity,
  Notification,
  Association,
  District,
  Ministry,
  MinistryAssignment,
  PrayerRequest,
  PastoralVisit,
  ChurchDocument,
  FeatureFlag,
  Client,
  Payment,
  sequelize,
};

export {
  sequelize,
  testConnection,
  Church,
  User,
  Group,
  Quarter,
  Member,
  WeeklyMetric,
  BibleStudent,
  BibleLessonProgress,
  DisciplePair,
  AttendanceRecord,
  QuarterlyGoal,
  CustomReport,
  AuditLog,
  FinancialContribution,
  Activity,
  Notification,
  Association,
  District,
  Ministry,
  MinistryAssignment,
  PrayerRequest,
  PastoralVisit,
  ChurchDocument,
  FeatureFlag,
  Client,
  Payment,
};
