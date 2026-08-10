import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { AttendanceMeetingType } from '../types/models';
import type { Group } from './Group.model';
import type { Member } from './Member.model';

export interface AttendanceRecordAttributes {
  id: string;
  churchId: string;
  groupId: string;
  memberId: string;
  meetingDate: string;
  meetingType: AttendanceMeetingType;
  isPresent: boolean;
  studiedDaily: boolean;
  notes: string | null;
  recordedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceRecordCreationAttributes = Optional<
  AttendanceRecordAttributes,
  | 'id'
  | 'meetingType'
  | 'isPresent'
  | 'studiedDaily'
  | 'notes'
  | 'recordedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class AttendanceRecord
  extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes>
  implements AttendanceRecordAttributes
{
  public id!: string;
  public churchId!: string;
  public groupId!: string;
  public memberId!: string;
  public meetingDate!: string;
  public meetingType!: AttendanceMeetingType;
  public isPresent!: boolean;
  public studiedDaily!: boolean;
  public notes!: string | null;
  public recordedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public member?: Member;
  public group?: Group;
}

export default function defineAttendanceRecord(sequelize: Sequelize): typeof AttendanceRecord {
  AttendanceRecord.init(
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
      memberId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      meetingDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      meetingType: {
        type: DataTypes.ENUM('regular', 'special', 'evangelism', 'community', 'prayer', 'study', 'other'),
        allowNull: false,
        defaultValue: 'regular',
      },
      isPresent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      studiedDaily: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      recordedBy: { type: DataTypes.UUID, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'AttendanceRecords',
      timestamps: true,
      indexes: [
        {
          name: 'idx_attendance_member_date',
          unique: true,
          fields: ['groupId', 'memberId', 'meetingDate', 'meetingType'],
        },
        { fields: ['churchId'] },
        { fields: ['groupId', 'meetingDate'] },
        { fields: ['memberId'] },
        { fields: ['recordedBy'] },
      ],
    },
  );

  return AttendanceRecord;
}
