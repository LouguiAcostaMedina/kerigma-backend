import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { User } from './User.model';

export interface AssociationAttributes {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  country: string;
  territory: string | null;
  presidentId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type AssociationCreationAttributes = Optional<
  AssociationAttributes,
  'id' | 'code' | 'description' | 'territory' | 'presidentId' | 'phone' | 'email' | 'address' | 'isActive' | 'createdBy' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Association
  extends Model<AssociationAttributes, AssociationCreationAttributes>
  implements AssociationAttributes
{
  public id!: string;
  public name!: string;
  public code!: string | null;
  public description!: string | null;
  public country!: string;
  public territory!: string | null;
  public presidentId!: string | null;
  public phone!: string | null;
  public email!: string | null;
  public address!: string | null;
  public isActive!: boolean;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public president?: User;
}

export default function defineAssociation(sequelize: Sequelize): typeof Association {
  Association.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      code: { type: DataTypes.STRING(20), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Peru' },
      territory: { type: DataTypes.STRING(200), allowNull: true },
      presidentId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
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
      tableName: 'Associations',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['code'] },
        { fields: ['country'] },
        { fields: ['isActive'] },
        { unique: true, fields: ['name', 'country'] },
      ],
    },
  );
  return Association;
}
