import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Association } from './Association.model';
import type { User } from './User.model';

export interface DistrictAttributes {
  id: string;
  associationId: string;
  name: string;
  code: string | null;
  description: string | null;
  territory: string | null;
  directorId: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type DistrictCreationAttributes = Optional<
  DistrictAttributes,
  'id' | 'code' | 'description' | 'territory' | 'directorId' | 'phone' | 'email' | 'isActive' | 'createdBy' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class District
  extends Model<DistrictAttributes, DistrictCreationAttributes>
  implements DistrictAttributes
{
  public id!: string;
  public associationId!: string;
  public name!: string;
  public code!: string | null;
  public description!: string | null;
  public territory!: string | null;
  public directorId!: string | null;
  public phone!: string | null;
  public email!: string | null;
  public isActive!: boolean;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public association?: Association;
  public director?: User;
}

export default function defineDistrict(sequelize: Sequelize): typeof District {
  District.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      associationId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Associations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: DataTypes.STRING(200), allowNull: false },
      code: { type: DataTypes.STRING(20), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      territory: { type: DataTypes.STRING(200), allowNull: true },
      directorId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
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
      tableName: 'Districts',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['associationId'] },
        { fields: ['name'] },
        { fields: ['code'] },
        { fields: ['directorId'] },
        { fields: ['isActive'] },
        { unique: true, fields: ['name', 'associationId'] },
      ],
    },
  );
  return District;
}
