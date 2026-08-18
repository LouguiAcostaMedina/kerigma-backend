import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';
import type { Group } from './Group.model';
import type { User } from './User.model';

export type EventType =
  | 'worship'
  | 'study'
  | 'social'
  | 'outreach'
  | 'meeting'
  | 'other';

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface ActivityAttributes {
  id: string;
  churchId: string;
  groupId: string | null;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  recurrence: RecurrenceType;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type ActivityCreationAttributes = Optional<
  ActivityAttributes,
  'id' | 'description' | 'endDate' | 'location' | 'groupId' | 'recurrence' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Activity
  extends Model<ActivityAttributes, ActivityCreationAttributes>
  implements ActivityAttributes
{
  public id!: string;
  public churchId!: string;
  public groupId!: string | null;
  public title!: string;
  public description!: string | null;
  public eventType!: EventType;
  public startDate!: Date;
  public endDate!: Date | null;
  public location!: string | null;
  public recurrence!: RecurrenceType;
  public isActive!: boolean;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public church?: Church;
  public group?: Group;
  public creator?: User;
}

export default function defineActivity(sequelize: Sequelize): typeof Activity {
  Activity.init(
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
        references: { model: 'Churches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventType: {
        type: DataTypes.ENUM('worship', 'study', 'social', 'outreach', 'meeting', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      recurrence: {
        type: DataTypes.ENUM('none', 'weekly', 'biweekly', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'none',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      tableName: 'Activities',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['groupId'] },
        { fields: ['eventType'] },
        { fields: ['startDate'] },
        { fields: ['isActive'] },
        { fields: ['churchId', 'startDate'] },
        { fields: ['churchId', 'eventType'] },
        { fields: ['createdBy'] },
      ],
    },
  );

  return Activity;
}
