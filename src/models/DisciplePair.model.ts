import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { DisciplePairStatus } from '../types/models';
import type { Group } from './Group.model';
import type { Member } from './Member.model';
import type { User } from './User.model';
import type { BibleStudent } from './BibleStudent.model';

export interface DisciplePairAttributes {
  id: string;
  churchId: string;
  groupId: string;
  member1Id: string | null;
  member2Id: string | null;
  mentorId: string | null;
  discipleId: string | null;
  status: DisciplePairStatus;
  startedAt: string;
  endedAt: string | null;
  meetingSchedule: string | null;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DisciplePairCreationAttributes = Optional<
  DisciplePairAttributes,
  | 'id'
  | 'member1Id'
  | 'member2Id'
  | 'mentorId'
  | 'discipleId'
  | 'status'
  | 'startedAt'
  | 'endedAt'
  | 'meetingSchedule'
  | 'notes'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class DisciplePair
  extends Model<DisciplePairAttributes, DisciplePairCreationAttributes>
  implements DisciplePairAttributes
{
  public id!: string;
  public churchId!: string;
  public groupId!: string;
  public member1Id!: string | null;
  public member2Id!: string | null;
  public mentorId!: string | null;
  public discipleId!: string | null;
  public status!: DisciplePairStatus;
  public startedAt!: string;
  public endedAt!: string | null;
  public meetingSchedule!: string | null;
  public notes!: string | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public member1?: Member | null;
  public member2?: Member | null;
  public group?: Group;
  public mentor?: User | null;
  public disciple?: BibleStudent | null;
  public bibleStudents?: BibleStudent[];
}

export default function defineDisciplePair(sequelize: Sequelize): typeof DisciplePair {
  DisciplePair.init(
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
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      member1Id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      member2Id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      mentorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      discipleId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
      },
      startedAt: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      endedAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      meetingSchedule: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
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
    },
    {
      sequelize,
      tableName: 'DisciplePairs',
      timestamps: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['groupId'] },
        { fields: ['member1Id'] },
        { fields: ['member2Id'] },
        { fields: ['mentorId'] },
        { fields: ['discipleId', 'status'] },
      ],
    },
  );

  return DisciplePair;
}
