'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ChurchDocuments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      churchId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.ENUM('policy', 'certificate', 'report', 'photo', 'video', 'audio', 'template', 'other'), allowNull: false, defaultValue: 'other' },
      fileUrl: { type: Sequelize.TEXT, allowNull: false },
      fileName: { type: Sequelize.STRING(255), allowNull: false },
      fileSize: { type: Sequelize.BIGINT, allowNull: true },
      mimeType: { type: Sequelize.STRING(100), allowNull: true },
      memberId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      groupId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Groups', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      uploadedBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('ChurchDocuments', ['churchId']);
    await queryInterface.addIndex('ChurchDocuments', ['category']);
    await queryInterface.addIndex('ChurchDocuments', ['memberId']);
    await queryInterface.addIndex('ChurchDocuments', ['isPublic']);
    await queryInterface.addIndex('ChurchDocuments', ['churchId', 'category']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ChurchDocuments');
  },
};
