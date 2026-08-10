/**
 * ADD-CUSTOM-REPORTS.JS - Sprint 2
 * Crea la tabla CustomReports para el módulo de Reportes personalizados.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'CustomReports',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          churchId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          name: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          category: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          entity: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          fields: {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: [],
          },
          filters: {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {},
          },
          groupBy: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          aggregateFunction: {
            type: Sequelize.STRING(50),
            allowNull: true,
          },
          aggregateField: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          sortBy: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          sortOrder: {
            type: Sequelize.ENUM('ASC', 'DESC'),
            allowNull: true,
          },
          limit: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          isScheduled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          scheduleConfig: {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {},
          },
          lastExecutedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          timesExecuted: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          isPublic: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          sharedWithUserIds: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: true,
            defaultValue: [],
          },
          createdBy: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          updatedBy: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('CustomReports', ['userId'], { transaction });
      await queryInterface.addIndex('CustomReports', ['churchId'], { transaction });
      await queryInterface.addIndex('CustomReports', ['category'], { transaction });

      await transaction.commit();
      console.log('✅ Migración add-custom-reports completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-custom-reports:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('CustomReports', { transaction });
      await transaction.commit();
      console.log('✅ Rollback add-custom-reports completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-custom-reports:', error.message);
      throw error;
    }
  },
};
