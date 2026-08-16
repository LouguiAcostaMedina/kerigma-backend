import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'assign'
  | 'bulk'
  | 'import'
  | 'login'
  | 'logout'
  | 'invite'
  | 'reset_password';

export interface AuditLogAttributes {
  id: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  actorUserId: string;
  changes: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditLogCreationAttributes = Optional<
  AuditLogAttributes,
  'id' | 'changes' | 'createdAt' | 'updatedAt'
>;

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: string;
  public entity!: string;
  public entityId!: string;
  public action!: AuditAction;
  public actorUserId!: string;
  public changes!: Record<string, unknown> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function defineAuditLog(sequelize: Sequelize): typeof AuditLog {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      entity: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(
          'create',
          'update',
          'delete',
          'status_change',
          'assign',
          'bulk',
          'import',
          'login',
          'logout',
          'invite',
          'reset_password',
        ),
        allowNull: false,
      },
      actorUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      changes: {
        type: DataTypes.JSONB,
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
      tableName: 'AuditLogs',
      timestamps: true,
      indexes: [
        { fields: ['entity', 'entityId'] },
        { fields: ['actorUserId'] },
        { fields: ['entity', 'action'] },
        { fields: ['createdAt'] },
      ],
    },
  );

  return AuditLog;
}
