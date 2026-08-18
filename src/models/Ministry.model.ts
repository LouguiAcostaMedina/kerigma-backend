import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';
import type { Member } from './Member.model';
import type { User } from './User.model';

export interface MinistryAttributes {
  id: string;
  churchId: string;
  name: string;
  description: string | null;
  category: string;
  leaderId: string | null;
  meetingSchedule: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type MinistryCreationAttributes = Optional<
  MinistryAttributes,
  'id' | 'description' | 'leaderId' | 'meetingSchedule' | 'isActive' | 'createdBy' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Ministry
  extends Model<MinistryAttributes, MinistryCreationAttributes>
  implements MinistryAttributes
{
  public id!: string;
  public churchId!: string;
  public name!: string;
  public description!: string | null;
  public category!: string;
  public leaderId!: string | null;
  public meetingSchedule!: string | null;
  public isActive!: boolean;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public church?: Church;
  public leader?: User;
  public assignments?: MinistryAssignment[];
}

export interface MinistryAssignmentAttributes {
  id: string;
  ministryId: string;
  memberId: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MinistryAssignmentCreationAttributes = Optional<
  MinistryAssignmentAttributes,
  'id' | 'role' | 'endDate' | 'notes' | 'isActive' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

export class MinistryAssignment
  extends Model<MinistryAssignmentAttributes, MinistryAssignmentCreationAttributes>
  implements MinistryAssignmentAttributes
{
  public id!: string;
  public ministryId!: string;
  public memberId!: string;
  public role!: string;
  public startDate!: Date;
  public endDate!: Date | null;
  public notes!: string | null;
  public isActive!: boolean;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public ministry?: Ministry;
  public member?: Member;
}

export default function defineMinistry(sequelize: Sequelize): typeof Ministry {
  Ministry.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      churchId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'general' },
      leaderId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      meetingSchedule: { type: DataTypes.STRING(200), allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'Ministries',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['category'] },
        { fields: ['leaderId'] },
        { fields: ['isActive'] },
        { unique: true, fields: ['name', 'churchId'] },
      ],
    },
  );

  MinistryAssignment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      ministryId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Ministries', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      memberId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      role: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'volunteer' },
      startDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
      endDate: { type: DataTypes.DATEONLY, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'MinistryAssignments',
      timestamps: true,
      indexes: [
        { fields: ['ministryId'] },
        { fields: ['memberId'] },
        { fields: ['isActive'] },
        { unique: true, fields: ['ministryId', 'memberId'] },
      ],
    },
  );

  return Ministry;
}
