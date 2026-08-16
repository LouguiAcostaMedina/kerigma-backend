import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type {
  Gender,
  MemberEducation,
  MemberMaritalStatus,
  MemberSpiritualStatus,
  MemberStatus,
} from '../types/models';
import type { Group } from './Group.model';
import type { DisciplePair } from './DisciplePair.model';
import type { AttendanceRecord } from './AttendanceRecord.model';

export interface MemberAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  maritalStatus: MemberMaritalStatus | null;
  address: string | null;
  city: string | null;
  district: string | null;
  groupId: string;
  baptized: boolean;
  baptismDate: string | null;
  conversionDate: string | null;
  spiritualStatus: MemberSpiritualStatus;
  joinDate: string;
  status: MemberStatus;
  attendanceScore: number | null;
  occupation: string | null;
  education: MemberEducation | null;
  emergencyContact: Record<string, unknown> | null;
  isActive: boolean;
  notes: string | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type MemberCreationAttributes = Optional<
  MemberAttributes,
  | 'id'
  | 'email'
  | 'phone'
  | 'dateOfBirth'
  | 'gender'
  | 'maritalStatus'
  | 'address'
  | 'city'
  | 'district'
  | 'baptized'
  | 'baptismDate'
  | 'conversionDate'
  | 'spiritualStatus'
  | 'joinDate'
  | 'status'
  | 'attendanceScore'
  | 'occupation'
  | 'education'
  | 'emergencyContact'
  | 'isActive'
  | 'notes'
  | 'tags'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

export class Member extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string | null;
  public phone!: string | null;
  public dateOfBirth!: string | null;
  public gender!: Gender | null;
  public maritalStatus!: MemberMaritalStatus | null;
  public address!: string | null;
  public city!: string | null;
  public district!: string | null;
  public groupId!: string;
  public baptized!: boolean;
  public baptismDate!: string | null;
  public conversionDate!: string | null;
  public spiritualStatus!: MemberSpiritualStatus;
  public joinDate!: string;
  public status!: MemberStatus;
  public attendanceScore!: number | null;
  public occupation!: string | null;
  public education!: MemberEducation | null;
  public emergencyContact!: Record<string, unknown> | null;
  public isActive!: boolean;
  public notes!: string | null;
  public tags!: string[] | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public group?: Group;
  public pairsAsMentor?: DisciplePair[];
  public pairsAsDisciple?: DisciplePair[];
  public attendanceRecords?: AttendanceRecord[];

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

export default function defineMember(sequelize: Sequelize): typeof Member {
  Member.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true,
      },
      maritalStatus: {
        type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed', 'other'),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      district: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      baptized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      baptismDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      conversionDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      spiritualStatus: {
        type: DataTypes.ENUM(
          'new_believer',
          'growing',
          'mature',
          'leader',
          'teacher',
          'visitor',
          'inactive',
          'other',
        ),
        allowNull: false,
        defaultValue: 'visitor',
      },
      joinDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'transferred', 'graduated'),
        allowNull: false,
        defaultValue: 'active',
      },
      attendanceScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      occupation: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      education: {
        type: DataTypes.ENUM(
          'elementary',
          'high_school',
          'technical',
          'university',
          'graduate',
          'other',
          'not_specified',
        ),
        allowNull: true,
      },
      emergencyContact: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'Members',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['groupId'] },
        { name: 'idx_members_email', unique: true, fields: ['email'] },
        { fields: ['status'] },
        { fields: ['spiritualStatus'] },
        { fields: ['groupId', 'isActive'] },
      ],
    },
  );

  return Member;
}
