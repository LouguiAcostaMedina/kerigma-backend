import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';
import type { Member } from './Member.model';
import type { User } from './User.model';

export type PrayerRequestStatus = 'pending' | 'in_progress' | 'answered' | 'closed';
export type PrayerRequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface PrayerRequestAttributes {
  id: string;
  churchId: string;
  memberId: string | null;
  requesterName: string;
  requesterPhone: string | null;
  requesterEmail: string | null;
  subject: string;
  description: string;
  priority: PrayerRequestPriority;
  status: PrayerRequestStatus;
  assignedTo: string | null;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  isAnonymous: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type PrayerRequestCreationAttributes = Optional<
  PrayerRequestAttributes,
  'id' | 'memberId' | 'requesterPhone' | 'requesterEmail' | 'priority' | 'status' | 'assignedTo' | 'resolutionNotes' | 'resolvedAt' | 'isAnonymous' | 'isPublic' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class PrayerRequest
  extends Model<PrayerRequestAttributes, PrayerRequestCreationAttributes>
  implements PrayerRequestAttributes
{
  public id!: string;
  public churchId!: string;
  public memberId!: string | null;
  public requesterName!: string;
  public requesterPhone!: string | null;
  public requesterEmail!: string | null;
  public subject!: string;
  public description!: string;
  public priority!: PrayerRequestPriority;
  public status!: PrayerRequestStatus;
  public assignedTo!: string | null;
  public resolutionNotes!: string | null;
  public resolvedAt!: Date | null;
  public isAnonymous!: boolean;
  public isPublic!: boolean;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public church?: Church;
  public member?: Member;
  public assignee?: User;
}

export interface PastoralVisitAttributes {
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
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type PastoralVisitCreationAttributes = Optional<
  PastoralVisitAttributes,
  'id' | 'memberId' | 'notes' | 'outcome' | 'followUpNeeded' | 'followUpDate' | 'followUpNotes' | 'prayerRequestId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class PastoralVisit
  extends Model<PastoralVisitAttributes, PastoralVisitCreationAttributes>
  implements PastoralVisitAttributes
{
  public id!: string;
  public churchId!: string;
  public memberId!: string | null;
  public visitorName!: string;
  public visitDate!: Date;
  public visitType!: string;
  public reason!: string;
  public notes!: string | null;
  public outcome!: string | null;
  public followUpNeeded!: boolean;
  public followUpDate!: Date | null;
  public followUpNotes!: string | null;
  public prayerRequestId!: string | null;
  public conductedBy!: string;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public church?: Church;
  public member?: Member;
  public conductor?: User;
}

export default function definePrayerRequest(sequelize: Sequelize): typeof PrayerRequest {
  PrayerRequest.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      churchId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      memberId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      requesterName: { type: DataTypes.STRING(200), allowNull: false },
      requesterPhone: { type: DataTypes.STRING(20), allowNull: true },
      requesterEmail: { type: DataTypes.STRING(150), allowNull: true },
      subject: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false, defaultValue: 'normal',
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'answered', 'closed'),
        allowNull: false, defaultValue: 'pending',
      },
      assignedTo: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      isAnonymous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdBy: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'PrayerRequests',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['memberId'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['assignedTo'] },
        { fields: ['churchId', 'status'] },
        { fields: ['churchId', 'createdAt'] },
        { fields: ['createdBy'] },
      ],
    },
  );

  PastoralVisit.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      churchId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      memberId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      visitorName: { type: DataTypes.STRING(200), allowNull: false },
      visitDate: { type: DataTypes.DATE, allowNull: false },
      visitType: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pastoral' },
      reason: { type: DataTypes.TEXT, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      outcome: { type: DataTypes.TEXT, allowNull: true },
      followUpNeeded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      followUpDate: { type: DataTypes.DATEONLY, allowNull: true },
      followUpNotes: { type: DataTypes.TEXT, allowNull: true },
      prayerRequestId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'PrayerRequests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      conductedBy: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      createdBy: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'PastoralVisits',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['memberId'] },
        { fields: ['visitType'] },
        { fields: ['followUpNeeded'] },
        { fields: ['prayerRequestId'] },
        { fields: ['conductedBy'] },
        { fields: ['churchId', 'visitDate'] },
        { fields: ['churchId', 'followUpNeeded'] },
        { fields: ['createdBy'] },
      ],
    },
  );

  return PrayerRequest;
}
