import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { BibleStudentLevel, BibleStudentProgram, BibleStudentStatus, Gender } from '../types/models';
import type { Group } from './Group.model';
import type { User } from './User.model';
import type { DisciplePair } from './DisciplePair.model';
import type { BibleLessonProgress } from './BibleLessonProgress.model';

export interface BibleStudentAttributes {
  id: string;
  churchId: string;
  groupId: string;
  disciplePairId: string | null;
  mentorId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  district: string | null;
  enrollmentDate: string;
  program: BibleStudentProgram;
  level: BibleStudentLevel;
  currentGrade: string | null;
  attendancePercentage: number | null;
  completedLessons: number;
  totalLessons: number | null;
  status: BibleStudentStatus;
  graduationDate: string | null;
  certificateIssued: boolean;
  certificateNumber: string | null;
  isBeliever: boolean;
  baptized: boolean;
  baptismDate: string | null;
  churchMember: boolean;
  isActive: boolean;
  notes: string | null;
  tags: string[] | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BibleStudentCreationAttributes = Optional<
  BibleStudentAttributes,
  | 'id'
  | 'disciplePairId'
  | 'mentorId'
  | 'email'
  | 'phone'
  | 'dateOfBirth'
  | 'gender'
  | 'address'
  | 'city'
  | 'district'
  | 'enrollmentDate'
  | 'program'
  | 'level'
  | 'currentGrade'
  | 'attendancePercentage'
  | 'completedLessons'
  | 'totalLessons'
  | 'status'
  | 'graduationDate'
  | 'certificateIssued'
  | 'certificateNumber'
  | 'isBeliever'
  | 'baptized'
  | 'baptismDate'
  | 'churchMember'
  | 'isActive'
  | 'notes'
  | 'tags'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class BibleStudent
  extends Model<BibleStudentAttributes, BibleStudentCreationAttributes>
  implements BibleStudentAttributes
{
  public id!: string;
  public churchId!: string;
  public groupId!: string;
  public disciplePairId!: string | null;
  public mentorId!: string | null;
  public firstName!: string;
  public lastName!: string;
  public email!: string | null;
  public phone!: string | null;
  public dateOfBirth!: string | null;
  public gender!: Gender | null;
  public address!: string | null;
  public city!: string | null;
  public district!: string | null;
  public enrollmentDate!: string;
  public program!: BibleStudentProgram;
  public level!: BibleStudentLevel;
  public currentGrade!: string | null;
  public attendancePercentage!: number | null;
  public completedLessons!: number;
  public totalLessons!: number | null;
  public status!: BibleStudentStatus;
  public graduationDate!: string | null;
  public certificateIssued!: boolean;
  public certificateNumber!: string | null;
  public isBeliever!: boolean;
  public baptized!: boolean;
  public baptismDate!: string | null;
  public churchMember!: boolean;
  public isActive!: boolean;
  public notes!: string | null;
  public tags!: string[] | null;
  public createdBy!: string | null;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public group?: Group;
  public mentor?: User | null;
  public disciplePair?: DisciplePair | null;
  public lessons?: BibleLessonProgress[];

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

export default function defineBibleStudent(sequelize: Sequelize): typeof BibleStudent {
  BibleStudent.init(
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
      disciplePairId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      mentorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      district: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      enrollmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      program: {
        type: DataTypes.ENUM(
          'basic_bible',
          'intermediate_bible',
          'advanced_bible',
          'theology',
          'discipleship',
          'leadership',
          'missions',
          'evangelism',
          'counseling',
          'other',
        ),
        allowNull: false,
        defaultValue: 'basic_bible',
      },
      level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'graduate'),
        allowNull: false,
        defaultValue: 'beginner',
      },
      currentGrade: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
      },
      attendancePercentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      completedLessons: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalLessons: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('enrolled', 'active', 'completed', 'dropped', 'suspended', 'graduated'),
        allowNull: false,
        defaultValue: 'enrolled',
      },
      graduationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      certificateIssued: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      certificateNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isBeliever: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      baptized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      baptismDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      churchMember: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
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
      tableName: 'BibleStudents',
      timestamps: true,
      indexes: [
        { fields: ['groupId'] },
        { fields: ['disciplePairId'] },
        { fields: ['mentorId'] },
        { fields: ['churchId', 'status'] },
        { name: 'idx_bible_students_certificate', unique: true, fields: ['certificateNumber'] },
      ],
    },
  );

  return BibleStudent;
}
