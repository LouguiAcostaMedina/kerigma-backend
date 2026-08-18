import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface FeatureFlagAttributes {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FeatureFlagCreationAttributes = Optional<
  FeatureFlagAttributes,
  'id' | 'description' | 'isEnabled' | 'category' | 'createdAt' | 'updatedAt'
>;

export class FeatureFlag
  extends Model<FeatureFlagAttributes, FeatureFlagCreationAttributes>
  implements FeatureFlagAttributes
{
  public id!: string;
  public name!: string;
  public description!: string | null;
  public isEnabled!: boolean;
  public category!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function defineFeatureFlag(sequelize: Sequelize): typeof FeatureFlag {
  FeatureFlag.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'general',
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
      tableName: 'FeatureFlags',
      timestamps: true,
      indexes: [
        { fields: ['name'], unique: true },
        { fields: ['isEnabled'] },
        { fields: ['category'] },
      ],
    },
  );

  return FeatureFlag;
}
