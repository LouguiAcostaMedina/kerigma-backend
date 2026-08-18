'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Clients', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      slug: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      plan: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'free' },
      maxChurches: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      maxUsers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      contactName: { type: Sequelize.STRING(200), allowNull: true },
      contactEmail: { type: Sequelize.STRING(200), allowNull: true },
      contactPhone: { type: Sequelize.STRING(50), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      trialEndsAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addColumn('Churches', 'clientId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Users', 'clientId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.bulkInsert('Clients', [{
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Kerigma Default',
      slug: 'kerigma-default',
      plan: 'enterprise',
      maxChurches: 100,
      maxUsers: 1000,
      contactName: 'Administrador',
      contactEmail: 'admin@kerigma.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'clientId');
    await queryInterface.removeColumn('Churches', 'clientId');
    await queryInterface.dropTable('Clients');
  },
};
