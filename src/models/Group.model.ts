import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { GroupCategory, GroupStatus, GroupType, MeetingDay } from '../types/models';
import type { User } from './User.model';
import type { Member } from './Member.model';
import type { DisciplePair } from './DisciplePair.model';

export interface GroupAttributes {
  id: string;
  name: string;
  description: string | null;
  churchId: string;
  leaderId: string;
  mainTeacherId: string | null;
  associateTeacherId: string | null;
  type: GroupType;
  category: GroupCategory;
  meetingDay: MeetingDay;
  meetingTime: string;
  meetingDuration: number | null;
  meetingLocation: string | null;
  maxCapacity: number | null;
  currentSize: number;
  isActive: boolean;
  status: GroupStatus;
  startDate: string | null;
  endDate: string | null;
  isOpenToNewMembers: boolean;
  requiresApproval: boolean;
  resources: Record<string, unknown> | null;
  goals: unknown[] | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type GroupCreationAttributes = Optional<
  GroupAttributes,
  | 'id'
  | 'description'
  | 'mainTeacherId'
  | 'associateTeacherId'
  | 'type'
  | 'category'
  | 'meetingDuration'
  | 'meetingLocation'
  | 'maxCapacity'
  | 'currentSize'
  | 'isActive'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'isOpenToNewMembers'
  | 'requiresApproval'
  | 'resources'
  | 'goals'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

export class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public churchId!: string;
  public leaderId!: string;
  public mainTeacherId!: string | null;
  public associateTeacherId!: string | null;
  public type!: GroupType;
  public category!: GroupCategory;
  public meetingDay!: MeetingDay;
  public meetingTime!: string;
  public meetingDuration!: number | null;
  public meetingLocation!: string | null;
  public maxCapacity!: number | null;
  public currentSize!: number;
  public isActive!: boolean;
  public status!: GroupStatus;
  public startDate!: string | null;
  public endDate!: string | null;
  public isOpenToNewMembers!: boolean;
  public requiresApproval!: boolean;
  public resources!: Record<string, unknown> | null;
  public goals!: unknown[] | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public leader?: User;
  public mainTeacher?: User | null;
  public associateTeacher?: User | null;
  public members?: Member[];
  public disciplePairs?: DisciplePair[];

  public getMeetingInfo(): { day: string; time: string; location: string | null } {
    return { day: this.meetingDay, time: this.meetingTime, location: this.meetingLocation };
  }
}

export default function defineGroup(sequelize: Sequelize): typeof Group {
  Group.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      churchId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      leaderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      mainTeacherId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      associateTeacherId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          'youth',
          'adults',
          'children',
          'seniors',
          'couples',
          'singles',
          'women',
          'men',
          'students',
          'professionals',
          'mixed',
        ),
        allowNull: false,
        defaultValue: 'mixed',
      },
      category: {
        type: DataTypes.ENUM(
          'bible_study',
          'prayer',
          'evangelism',
          'discipleship',
          'worship',
          'service',
          'fellowship',
          'training',
          'mission',
        ),
        allowNull: false,
        defaultValue: 'bible_study',
      },
      meetingDay: {
        type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        allowNull: false,
      },
      meetingTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      meetingDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 90,
      },
      meetingLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      currentSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM('planning', 'active', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planning',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      isOpenToNewMembers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      resources: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      goals: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
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
      tableName: 'Groups',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['leaderId'] },
        { fields: ['mainTeacherId'] },
        { fields: ['associateTeacherId'] },
        { fields: ['type', 'category'] },
        { fields: ['isActive', 'status'] },
      ],
    },
  );

  return Group;
}
