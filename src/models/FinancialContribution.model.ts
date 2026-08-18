import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Group } from './Group.model';
import type { User } from './User.model';

export type ContributionCategory =
  | 'diezmo'
  | 'ofrenda_misionera'
  | 'escuela_sabatica'
  | 'proyectos_especiales'
  | 'otros';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'deposito' | 'tarjeta' | 'otro';

export interface FinancialContributionAttributes {
  id: string;
  churchId: string;
  memberId: string;
  category: ContributionCategory;
  amount: number;
  currency: string;
  period: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type FinancialContributionCreationAttributes = Optional<
  FinancialContributionAttributes,
  'id' | 'currency' | 'paymentMethod' | 'receiptNumber' | 'notes' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class FinancialContribution
  extends Model<FinancialContributionAttributes, FinancialContributionCreationAttributes>
  implements FinancialContributionAttributes
{
  public id!: string;
  public churchId!: string;
  public memberId!: string;
  public category!: ContributionCategory;
  public amount!: number;
  public currency!: string;
  public period!: string;
  public paymentMethod!: PaymentMethod;
  public receiptNumber!: string | null;
  public notes!: string | null;
  public recordedBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public group?: Group;
  public member?: unknown;
  public actor?: User;
}

export default function defineFinancialContribution(sequelize: Sequelize): typeof FinancialContribution {
  FinancialContribution.init(
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
        allowNull: false,
        references: { model: 'Members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: {
        type: DataTypes.ENUM('diezmo', 'ofrenda_misionera', 'escuela_sabatica', 'proyectos_especiales', 'otros'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'PEN',
      },
      period: {
        type: DataTypes.STRING(7),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM('efectivo', 'transferencia', 'deposito', 'tarjeta', 'otro'),
        allowNull: false,
        defaultValue: 'efectivo',
      },
      receiptNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recordedBy: {
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
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'FinancialContributions',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['memberId'] },
        { fields: ['category'] },
        { fields: ['period'] },
        { fields: ['churchId', 'category', 'period'] },
        { fields: ['churchId', 'category', 'createdAt'] },
        { fields: ['recordedBy'] },
        { fields: ['createdAt'] },
      ],
    },
  );

  return FinancialContribution;
}
