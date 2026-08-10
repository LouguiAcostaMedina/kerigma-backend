import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { QuarterPeriod } from '../types/models';

export interface QuarterAttributes {
  id: string;
  churchId: string;
  name: string;
  year: number;
  period: QuarterPeriod;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
  description: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type QuarterCreationAttributes = Optional<
  QuarterAttributes,
  'id' | 'period' | 'isActive' | 'isCurrent' | 'description' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

export class Quarter extends Model<QuarterAttributes, QuarterCreationAttributes> implements QuarterAttributes {
  public id!: string;
  public churchId!: string;
  public name!: string;
  public year!: number;
  public period!: QuarterPeriod;
  public startDate!: string;
  public endDate!: string;
  public isActive!: boolean;
  public isCurrent!: boolean;
  public description!: string | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function defineQuarter(sequelize: Sequelize): typeof Quarter {
  Quarter.init(
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      period: {
        type: DataTypes.ENUM('first', 'second', 'third', 'fourth', 'annual'),
        allowNull: false,
        defaultValue: 'first',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isCurrent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      description: {
        type: DataTypes.TEXT,
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
      tableName: 'Quarters',
      timestamps: true,
      indexes: [
        { name: 'idx_quarters_church_year_period', unique: true, fields: ['churchId', 'year', 'period'] },
        { fields: ['churchId', 'isCurrent'] },
        { fields: ['isActive'] },
      ],
    },
  );

  return Quarter;
}
