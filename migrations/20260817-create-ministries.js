'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ministries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      churchId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'general' },
      leaderId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      meetingSchedule: { type: Sequelize.STRING(200), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('MinistryAssignments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      ministryId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Ministries', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      memberId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      role: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'volunteer' },
      startDate: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      endDate: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('Ministries', ['churchId']);
    await queryInterface.addIndex('Ministries', ['category']);
    await queryInterface.addIndex('Ministries', ['isActive']);
    await queryInterface.addIndex('MinistryAssignments', ['ministryId']);
    await queryInterface.addIndex('MinistryAssignments', ['memberId']);
    await queryInterface.addIndex('MinistryAssignments', ['isActive']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MinistryAssignments');
    await queryInterface.dropTable('Ministries');
  },
};
