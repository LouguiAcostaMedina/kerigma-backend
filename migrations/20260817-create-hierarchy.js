'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Associations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(200), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'Peru' },
      territory: { type: Sequelize.STRING(200), allowNull: true },
      presidentId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('Districts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      associationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Associations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(200), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      territory: { type: Sequelize.STRING(200), allowNull: true },
      directorId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addColumn('Churches', 'districtId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Districts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('Associations', ['name']);
    await queryInterface.addIndex('Associations', ['country']);
    await queryInterface.addIndex('Associations', ['isActive']);
    await queryInterface.addIndex('Districts', ['associationId']);
    await queryInterface.addIndex('Districts', ['name']);
    await queryInterface.addIndex('Districts', ['isActive']);
    await queryInterface.addIndex('Churches', ['districtId']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Churches', 'districtId');
    await queryInterface.dropTable('Districts');
    await queryInterface.dropTable('Associations');
  },
};
