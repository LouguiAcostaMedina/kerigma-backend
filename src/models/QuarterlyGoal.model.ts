import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { QuarterlyGoalStatus, QuarterlyGoalType } from '../types/models';
import type { Quarter } from './Quarter.model';
import type { Group } from './Group.model';

export interface QuarterlyGoalAttributes {
  id: string;
  churchId: string;
  quarterId: string;
  groupId: string | null;
  goalType: QuarterlyGoalType;
  title: string;
  description: string | null;
  targetValue: string;
  currentValue: string;
  achievedValue: string | null;
  unit: string | null;
  status: QuarterlyGoalStatus;
  startDate: string | null;
  dueDate: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type QuarterlyGoalCreationAttributes = Optional<
  QuarterlyGoalAttributes,
  | 'id'
  | 'groupId'
  | 'goalType'
  | 'description'
  | 'currentValue'
  | 'achievedValue'
  | 'unit'
  | 'status'
  | 'startDate'
  | 'dueDate'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class QuarterlyGoal
  extends Model<QuarterlyGoalAttributes, QuarterlyGoalCreationAttributes>
  implements QuarterlyGoalAttributes
{
  public id!: string;
  public churchId!: string;
  public quarterId!: string;
  public groupId!: string | null;
  public goalType!: QuarterlyGoalType;
  public title!: string;
  public description!: string | null;
  public targetValue!: string;
  public currentValue!: string;
  public achievedValue!: string | null;
  public unit!: string | null;
  public status!: QuarterlyGoalStatus;
  public startDate!: string | null;
  public dueDate!: string | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public quarter?: Quarter;
  public group?: Group | null;
}

export default function defineQuarterlyGoal(sequelize: Sequelize): typeof QuarterlyGoal {
  QuarterlyGoal.init(
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
      quarterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      goalType: {
        type: DataTypes.ENUM('comunion', 'relacionamiento', 'mision'),
        allowNull: false,
        defaultValue: 'comunion',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      targetValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currentValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      achievedValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('not_started', 'in_progress', 'achieved', 'missed', 'cancelled'),
        allowNull: false,
        defaultValue: 'not_started',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
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
    },
    {
      sequelize,
      tableName: 'QuarterlyGoals',
      timestamps: true,
      indexes: [
        { fields: ['quarterId'] },
        { fields: ['groupId'] },
        { fields: ['churchId', 'status'] },
        { fields: ['churchId', 'quarterId'] },
      ],
    },
  );

  return QuarterlyGoal;
}
