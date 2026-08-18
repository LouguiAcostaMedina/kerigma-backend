'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
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
      channel: {
        type: Sequelize.ENUM('email', 'whatsapp', 'both'),
        allowNull: false,
        defaultValue: 'email',
      },
      recipientUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      recipientEmail: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      recipientPhone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      templateName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      templateData: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
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
    });

    await queryInterface.addIndex('Notifications', ['churchId']);
    await queryInterface.addIndex('Notifications', ['channel']);
    await queryInterface.addIndex('Notifications', ['status']);
    await queryInterface.addIndex('Notifications', ['recipientUserId']);
    await queryInterface.addIndex('Notifications', ['recipientEmail']);
    await queryInterface.addIndex('Notifications', ['templateName']);
    await queryInterface.addIndex('Notifications', ['churchId', 'createdAt']);
    await queryInterface.addIndex('Notifications', ['churchId', 'channel']);
    await queryInterface.addIndex('Notifications', ['createdBy']);
    await queryInterface.addIndex('Notifications', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notifications');
  },
};
