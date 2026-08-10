import bcrypt from 'bcryptjs';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import { env } from '../config/env';
import type { UserRole } from '../types/auth';
import type { PublicUser } from './User.types';
import type { Church } from './Church.model';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string | null;
  profileImage: string | null;
  churchId: string | null;
  isActive: boolean;
  isApproved: boolean;
  lastLogin: Date | null;
  loginAttempts: number;
  lockedUntil: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'role'
  | 'phone'
  | 'profileImage'
  | 'churchId'
  | 'isActive'
  | 'isApproved'
  | 'lastLogin'
  | 'loginAttempts'
  | 'lockedUntil'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: UserRole;
  public phone!: string | null;
  public profileImage!: string | null;
  public churchId!: string | null;
  public isActive!: boolean;
  public isApproved!: boolean;
  public lastLogin!: Date | null;
  public loginAttempts!: number;
  public lockedUntil!: Date | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public church?: Church | null;

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public getPublicInfo(): PublicUser {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      role: this.role,
      churchId: this.churchId,
      phone: this.phone,
      profileImage: this.profileImage,
      isActive: this.isActive,
      isApproved: this.isApproved,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public isLocked(): boolean {
    return !!this.lockedUntil && this.lockedUntil.getTime() > Date.now();
  }
}

export default function defineUser(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'director', 'leader', 'reader'),
        allowNull: false,
        defaultValue: 'reader',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      profileImage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      churchId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lockedUntil: {
        type: DataTypes.DATE,
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
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'Users',
      timestamps: true,
      paranoid: true,
      indexes: [
        { name: 'idx_users_email', unique: true, fields: ['email'] },
        { fields: ['role'] },
        { fields: ['churchId'] },
        { fields: ['isActive', 'isApproved'] },
      ],
      hooks: {
        beforeCreate: async (user: User) => {
          user.password = await bcrypt.hash(user.password, env.bcrypt.saltRounds);
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, env.bcrypt.saltRounds);
          }
        },
      },
    },
  );

  return User;
}
