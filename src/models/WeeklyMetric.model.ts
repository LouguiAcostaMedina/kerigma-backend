import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { WeeklyMetricStatus } from '../types/models';
import type { Group } from './Group.model';
import type { Quarter } from './Quarter.model';

export interface WeeklyMetricAttributes {
  id: string;
  churchId: string;
  groupId: string;
  quarterId: string | null;
  weekStart: string;
  weekEnd: string;
  membersPresent: number;
  dailyBibleStudy: number;
  smallGroupParticipants: number;
  bibleStudiesParticipants: number;
  totalMeetings: number;
  averageAttendance: number;
  maxAttendance: number;
  minAttendance: number;
  newMembers: number;
  leftMembers: number;
  netGrowth: number;
  totalMembersStart: number;
  totalMembersEnd: number;
  newConversions: number;
  baptisms: number;
  decisionsForChrist: number;
  newStudents: number;
  graduatedStudents: number;
  activeStudents: number;
  evangelisticEvents: number;
  communityServices: number;
  specialMeetings: number;
  offerings: string | null;
  tithes: string | null;
  specialOfferings: string | null;
  notes: string | null;
  challenges: string | null;
  achievements: string | null;
  status: WeeklyMetricStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WeeklyMetricCreationAttributes = Optional<
  WeeklyMetricAttributes,
  | 'id'
  | 'quarterId'
  | 'membersPresent'
  | 'dailyBibleStudy'
  | 'smallGroupParticipants'
  | 'bibleStudiesParticipants'
  | 'totalMeetings'
  | 'averageAttendance'
  | 'maxAttendance'
  | 'minAttendance'
  | 'newMembers'
  | 'leftMembers'
  | 'netGrowth'
  | 'totalMembersStart'
  | 'totalMembersEnd'
  | 'newConversions'
  | 'baptisms'
  | 'decisionsForChrist'
  | 'newStudents'
  | 'graduatedStudents'
  | 'activeStudents'
  | 'evangelisticEvents'
  | 'communityServices'
  | 'specialMeetings'
  | 'offerings'
  | 'tithes'
  | 'specialOfferings'
  | 'notes'
  | 'challenges'
  | 'achievements'
  | 'status'
  | 'approvedBy'
  | 'approvedAt'
  | 'rejectionReason'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class WeeklyMetric
  extends Model<WeeklyMetricAttributes, WeeklyMetricCreationAttributes>
  implements WeeklyMetricAttributes
{
  public id!: string;
  public churchId!: string;
  public groupId!: string;
  public quarterId!: string | null;
  public weekStart!: string;
  public weekEnd!: string;
  public membersPresent!: number;
  public dailyBibleStudy!: number;
  public smallGroupParticipants!: number;
  public bibleStudiesParticipants!: number;
  public totalMeetings!: number;
  public averageAttendance!: number;
  public maxAttendance!: number;
  public minAttendance!: number;
  public newMembers!: number;
  public leftMembers!: number;
  public netGrowth!: number;
  public totalMembersStart!: number;
  public totalMembersEnd!: number;
  public newConversions!: number;
  public baptisms!: number;
  public decisionsForChrist!: number;
  public newStudents!: number;
  public graduatedStudents!: number;
  public activeStudents!: number;
  public evangelisticEvents!: number;
  public communityServices!: number;
  public specialMeetings!: number;
  public offerings!: string | null;
  public tithes!: string | null;
  public specialOfferings!: string | null;
  public notes!: string | null;
  public challenges!: string | null;
  public achievements!: string | null;
  public status!: WeeklyMetricStatus;
  public approvedBy!: string | null;
  public approvedAt!: Date | null;
  public rejectionReason!: string | null;
  public createdBy!: string;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public group?: Group;
  public quarter?: Quarter | null;
}

export default function defineWeeklyMetric(sequelize: Sequelize): typeof WeeklyMetric {
  WeeklyMetric.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      churchId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quarterId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      weekStart: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      weekEnd: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      membersPresent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      dailyBibleStudy: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      smallGroupParticipants: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      bibleStudiesParticipants: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalMeetings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      averageAttendance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      maxAttendance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      minAttendance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      newMembers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      leftMembers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      netGrowth: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalMembersStart: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalMembersEnd: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      newConversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      baptisms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      decisionsForChrist: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      newStudents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      graduatedStudents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      activeStudents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      evangelisticEvents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      communityServices: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      specialMeetings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      offerings: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      tithes: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      specialOfferings: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      challenges: { type: DataTypes.TEXT, allowNull: true },
      achievements: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      approvedBy: { type: DataTypes.UUID, allowNull: true },
      approvedAt: { type: DataTypes.DATE, allowNull: true },
      rejectionReason: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: false },
      updatedBy: { type: DataTypes.UUID, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'WeeklyMetrics',
      timestamps: true,
      indexes: [
        { name: 'idx_weekly_metrics_group_week', unique: true, fields: ['churchId', 'groupId', 'weekStart'] },
        { fields: ['groupId'] },
        { fields: ['quarterId'] },
        { fields: ['churchId', 'status'] },
        { fields: ['churchId', 'weekStart'] },
      ],
    },
  );

  return WeeklyMetric;
}
