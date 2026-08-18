import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { Church } from './Church.model';
import type { User } from './User.model';
import type { Member } from './Member.model';

export type DocumentCategory = 'policy' | 'certificate' | 'report' | 'photo' | 'video' | 'audio' | 'template' | 'other';

export interface ChurchDocumentAttributes {
  id: string;
  churchId: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  memberId: string | null;
  groupId: string | null;
  isPublic: boolean;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type ChurchDocumentCreationAttributes = Optional<
  ChurchDocumentAttributes,
  'id' | 'description' | 'fileSize' | 'mimeType' | 'memberId' | 'groupId' | 'isPublic' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class ChurchDocument
  extends Model<ChurchDocumentAttributes, ChurchDocumentCreationAttributes>
  implements ChurchDocumentAttributes
{
  public id!: string;
  public churchId!: string;
  public title!: string;
  public description!: string | null;
  public category!: DocumentCategory;
  public fileUrl!: string;
  public fileName!: string;
  public fileSize!: number | null;
  public mimeType!: string | null;
  public memberId!: string | null;
  public groupId!: string | null;
  public isPublic!: boolean;
  public uploadedBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public church?: Church;
  public uploader?: User;
  public member?: Member;
}

export default function defineChurchDocument(sequelize: Sequelize): typeof ChurchDocument {
  ChurchDocument.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      churchId: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: {
        type: DataTypes.ENUM('policy', 'certificate', 'report', 'photo', 'video', 'audio', 'template', 'other'),
        allowNull: false, defaultValue: 'other',
      },
      fileUrl: { type: DataTypes.TEXT, allowNull: false },
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      fileSize: { type: DataTypes.BIGINT, allowNull: true },
      mimeType: { type: DataTypes.STRING(100), allowNull: true },
      memberId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      groupId: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'Groups', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      uploadedBy: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'ChurchDocuments',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['churchId'] },
        { fields: ['category'] },
        { fields: ['memberId'] },
        { fields: ['groupId'] },
        { fields: ['uploadedBy'] },
        { fields: ['isPublic'] },
        { fields: ['churchId', 'category'] },
        { fields: ['churchId', 'createdAt'] },
      ],
    },
  );
  return ChurchDocument;
}
