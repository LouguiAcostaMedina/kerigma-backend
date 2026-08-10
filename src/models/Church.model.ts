import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { ChurchStatus } from '../types/models';
import type { User } from './User.model';
import type { Group } from './Group.model';
import type { BibleStudent } from './BibleStudent.model';

export interface ChurchAttributes {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialMedia: Record<string, unknown> | null;
  pastor: string | null;
  pastorPhone: string | null;
  pastorEmail: string | null;
  capacity: number | null;
  facilities: Record<string, unknown> | null;
  services: Record<string, unknown> | null;
  status: ChurchStatus;
  foundedDate: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type ChurchCreationAttributes = Optional<
  ChurchAttributes,
  | 'id'
  | 'country'
  | 'zipCode'
  | 'latitude'
  | 'longitude'
  | 'phone'
  | 'email'
  | 'website'
  | 'socialMedia'
  | 'pastor'
  | 'pastorPhone'
  | 'pastorEmail'
  | 'capacity'
  | 'facilities'
  | 'services'
  | 'status'
  | 'foundedDate'
  | 'description'
  | 'isActive'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

export class Church extends Model<ChurchAttributes, ChurchCreationAttributes> implements ChurchAttributes {
  public id!: string;
  public name!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public zipCode!: string | null;
  public latitude!: string | null;
  public longitude!: string | null;
  public phone!: string | null;
  public email!: string | null;
  public website!: string | null;
  public socialMedia!: Record<string, unknown> | null;
  public pastor!: string | null;
  public pastorPhone!: string | null;
  public pastorEmail!: string | null;
  public capacity!: number | null;
  public facilities!: Record<string, unknown> | null;
  public services!: Record<string, unknown> | null;
  public status!: ChurchStatus;
  public foundedDate!: string | null;
  public description!: string | null;
  public isActive!: boolean;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public members?: User[];
  public groups?: Group[];
  public bibleStudents?: BibleStudent[];
}

export default function defineChurch(sequelize: Sequelize): typeof Church {
  Church.init(
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
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Perú',
      },
      zipCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      socialMedia: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      pastor: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      pastorPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      pastorEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      facilities: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      services: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      status: {
        type: DataTypes.ENUM('active', 'construction', 'planning', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      foundedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: 'Churches',
      timestamps: true,
      paranoid: true,
      indexes: [
        { name: 'idx_churches_name_city', unique: true, fields: ['name', 'city'] },
        { name: 'idx_churches_email', unique: true, fields: ['email'] },
        { name: 'idx_churches_status', fields: ['status'] },
      ],
    },
  );

  return Church;
}
