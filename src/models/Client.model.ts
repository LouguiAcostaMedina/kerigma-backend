import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';

export type ClientPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface ClientAttributes {
  id: string;
  name: string;
  slug: string;
  plan: ClientPlan;
  maxChurches: number;
  maxUsers: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientCreationAttributes = Optional<
  ClientAttributes,
  'id' | 'maxChurches' | 'maxUsers' | 'contactName' | 'contactEmail' | 'contactPhone' | 'isActive' | 'trialEndsAt' | 'createdAt' | 'updatedAt'
>;

export class Client
  extends Model<ClientAttributes, ClientCreationAttributes>
  implements ClientAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public plan!: ClientPlan;
  public maxChurches!: number;
  public maxUsers!: number;
  public contactName!: string | null;
  public contactEmail!: string | null;
  public contactPhone!: string | null;
  public isActive!: boolean;
  public trialEndsAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public churches?: Church[];
}

export default function defineClient(sequelize: Sequelize): typeof Client {
  Client.init(
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
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      plan: {
        type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
      },
      maxChurches: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      contactName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      contactPhone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      trialEndsAt: {
        type: DataTypes.DATE,
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
      tableName: 'Clients',
      timestamps: true,
      indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['plan'] },
        { fields: ['isActive'] },
      ],
    },
  );

  return Client;
}
