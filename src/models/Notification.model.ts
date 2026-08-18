import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';
import type { User } from './User.model';

export type NotificationChannel = 'email' | 'whatsapp' | 'both';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface NotificationAttributes {
  id: string;
  churchId: string;
  channel: NotificationChannel;
  recipientUserId: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subject: string | null;
  body: string;
  templateName: string | null;
  templateData: Record<string, unknown> | null;
  status: NotificationStatus;
  errorMessage: string | null;
  sentAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'recipientUserId' | 'recipientEmail' | 'recipientPhone' | 'subject' | 'templateName' | 'templateData' | 'errorMessage' | 'sentAt' | 'createdAt' | 'updatedAt'
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public churchId!: string;
  public channel!: NotificationChannel;
  public recipientUserId!: string | null;
  public recipientEmail!: string | null;
  public recipientPhone!: string | null;
  public subject!: string | null;
  public body!: string;
  public templateName!: string | null;
  public templateData!: Record<string, unknown> | null;
  public status!: NotificationStatus;
  public errorMessage!: string | null;
  public sentAt!: Date | null;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public church?: Church;
  public creator?: User;
}

export default function defineNotification(sequelize: Sequelize): typeof Notification {
  Notification.init(
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
        references: { model: 'Churches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      channel: {
        type: DataTypes.ENUM('email', 'whatsapp', 'both'),
        allowNull: false,
        defaultValue: 'email',
      },
      recipientUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      recipientEmail: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      recipientPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      templateName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      templateData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      tableName: 'Notifications',
      timestamps: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['channel'] },
        { fields: ['status'] },
        { fields: ['recipientUserId'] },
        { fields: ['recipientEmail'] },
        { fields: ['templateName'] },
        { fields: ['churchId', 'createdAt'] },
        { fields: ['churchId', 'channel'] },
        { fields: ['createdBy'] },
        { fields: ['createdAt'] },
      ],
    },
  );

  return Notification;
}
