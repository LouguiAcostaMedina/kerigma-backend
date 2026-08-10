import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { User } from './User.model';

export type ReportEntity =
  | 'members'
  | 'groups'
  | 'students'
  | 'users'
  | 'churches'
  | 'attendance'
  | 'goals'
  | 'metrics';

export interface ReportFilterValue {
  field: string;
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'in'
    | 'between'
    | 'isNull'
    | 'notNull';
  value?: string | number | boolean | Array<string | number> | null;
}

export interface CustomReportAttributes {
  id: string;
  userId: string;
  churchId: string | null;
  name: string;
  description: string | null;
  category: string | null;
  entity: ReportEntity;
  fields: string[];
  filters: ReportFilterValue[];
  groupBy: string | null;
  aggregateFunction: string | null;
  aggregateField: string | null;
  sortBy: string | null;
  sortOrder: 'ASC' | 'DESC' | null;
  limit: number | null;
  isScheduled: boolean;
  scheduleConfig: Record<string, unknown>;
  lastExecutedAt: Date | null;
  timesExecuted: number;
  isPublic: boolean;
  sharedWithUserIds: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomReportCreationAttributes = Optional<
  CustomReportAttributes,
  | 'id'
  | 'churchId'
  | 'description'
  | 'category'
  | 'fields'
  | 'filters'
  | 'groupBy'
  | 'aggregateFunction'
  | 'aggregateField'
  | 'sortBy'
  | 'sortOrder'
  | 'limit'
  | 'isScheduled'
  | 'scheduleConfig'
  | 'lastExecutedAt'
  | 'timesExecuted'
  | 'isPublic'
  | 'sharedWithUserIds'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class CustomReport
  extends Model<CustomReportAttributes, CustomReportCreationAttributes>
  implements CustomReportAttributes
{
  public id!: string;
  public userId!: string;
  public churchId!: string | null;
  public name!: string;
  public description!: string | null;
  public category!: string | null;
  public entity!: ReportEntity;
  public fields!: string[];
  public filters!: ReportFilterValue[];
  public groupBy!: string | null;
  public aggregateFunction!: string | null;
  public aggregateField!: string | null;
  public sortBy!: string | null;
  public sortOrder!: 'ASC' | 'DESC' | null;
  public limit!: number | null;
  public isScheduled!: boolean;
  public scheduleConfig!: Record<string, unknown>;
  public lastExecutedAt!: Date | null;
  public timesExecuted!: number;
  public isPublic!: boolean;
  public sharedWithUserIds!: string[];
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public author?: User;
}

export default function defineCustomReport(sequelize: Sequelize): typeof CustomReport {
  CustomReport.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      churchId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      entity: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fields: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      filters: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      groupBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      aggregateFunction: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      aggregateField: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      sortBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.ENUM('ASC', 'DESC'),
        allowNull: true,
      },
      limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isScheduled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scheduleConfig: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      lastExecutedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      timesExecuted: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sharedWithUserIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
    },
    {
      sequelize,
      tableName: 'CustomReports',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['churchId'] },
        { fields: ['category'] },
      ],
    },
  );

  return CustomReport;
}
