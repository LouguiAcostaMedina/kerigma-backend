import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { BibleStudent } from './BibleStudent.model';

export interface BibleLessonProgressAttributes {
  id: string;
  churchId: string;
  bibleStudentId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  score: string | null;
  notes: string | null;
  completedBy: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BibleLessonProgressCreationAttributes = Optional<
  BibleLessonProgressAttributes,
  | 'id'
  | 'lessonTitle'
  | 'isCompleted'
  | 'completedAt'
  | 'score'
  | 'notes'
  | 'completedBy'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class BibleLessonProgress
  extends Model<BibleLessonProgressAttributes, BibleLessonProgressCreationAttributes>
  implements BibleLessonProgressAttributes
{
  public id!: string;
  public churchId!: string;
  public bibleStudentId!: string;
  public lessonNumber!: number;
  public lessonTitle!: string | null;
  public isCompleted!: boolean;
  public completedAt!: Date | null;
  public score!: string | null;
  public notes!: string | null;
  public completedBy!: string | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public bibleStudent?: BibleStudent;
}

export default function defineBibleLessonProgress(sequelize: Sequelize): typeof BibleLessonProgress {
  BibleLessonProgress.init(
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
      bibleStudentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      lessonNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lessonTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      completedBy: {
        type: DataTypes.UUID,
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
      tableName: 'BibleLessonsProgress',
      timestamps: true,
      indexes: [
        { name: 'idx_lessons_student_lesson', unique: true, fields: ['bibleStudentId', 'lessonNumber'] },
        { fields: ['churchId'] },
        { fields: ['bibleStudentId', 'isCompleted'] },
      ],
    },
  );

  return BibleLessonProgress;
}
