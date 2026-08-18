'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      churchId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Churches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      groupId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      eventType: {
        type: Sequelize.ENUM('worship', 'study', 'social', 'outreach', 'meeting', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      recurrence: {
        type: Sequelize.ENUM('none', 'weekly', 'biweekly', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'none',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('Activities', ['churchId']);
    await queryInterface.addIndex('Activities', ['groupId']);
    await queryInterface.addIndex('Activities', ['eventType']);
    await queryInterface.addIndex('Activities', ['startDate']);
    await queryInterface.addIndex('Activities', ['isActive']);
    await queryInterface.addIndex('Activities', ['churchId', 'startDate']);
    await queryInterface.addIndex('Activities', ['churchId', 'eventType']);
    await queryInterface.addIndex('Activities', ['createdBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Activities');
  },
};
