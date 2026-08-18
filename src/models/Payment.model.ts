import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';
import type { Member } from './Member.model';

export type PaymentCurrency = 'PEN' | 'USD';
export type PaymentType = 'tithe' | 'offering' | 'donation';
export type PaymentMethod = 'card' | 'bank_transfer' | 'yape' | 'plin';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentAttributes {
  id: string;
  churchId: string;
  memberId: string | null;
  amount: number;
  currency: PaymentCurrency;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  providerRef: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  'id' | 'memberId' | 'currency' | 'status' | 'providerRef' | 'description' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: string;
  public churchId!: string;
  public memberId!: string | null;
  public amount!: number;
  public currency!: PaymentCurrency;
  public type!: PaymentType;
  public method!: PaymentMethod;
  public status!: PaymentStatus;
  public providerRef!: string | null;
  public description!: string | null;
  public metadata!: Record<string, unknown> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public church?: Church;
  public member?: Member;
}

export default function definePayment(sequelize: Sequelize): typeof Payment {
  Payment.init(
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
      memberId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.ENUM('PEN', 'USD'),
        allowNull: false,
        defaultValue: 'PEN',
      },
      type: {
        type: DataTypes.ENUM('tithe', 'offering', 'donation'),
        allowNull: false,
        defaultValue: 'tithe',
      },
      method: {
        type: DataTypes.ENUM('card', 'bank_transfer', 'yape', 'plin'),
        allowNull: false,
        defaultValue: 'card',
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      providerRef: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
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
      tableName: 'Payments',
      timestamps: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['memberId'] },
        { fields: ['status'] },
        { fields: ['type'] },
        { fields: ['createdAt'] },
        { fields: ['churchId', 'status'] },
        { fields: ['churchId', 'type'] },
      ],
    },
  );

  return Payment;
}
