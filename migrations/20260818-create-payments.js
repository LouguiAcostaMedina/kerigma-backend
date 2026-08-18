'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      churchId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Churches', key: 'id' } },
      memberId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Members', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'PEN' },
      type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'tithe' },
      method: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'card' },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
      providerRef: { type: Sequelize.STRING(200), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Payments');
  },
};
