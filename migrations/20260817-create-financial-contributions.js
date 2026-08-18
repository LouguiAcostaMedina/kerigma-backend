/**
 * 20260817-create-financial-contributions.js
 * Crea la tabla FinancialContributions para el registro de diezmos, ofrendas y aportes financieros.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'FinancialContributions',
        {
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
          memberId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Members', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          category: {
            type: Sequelize.ENUM('diezmo', 'ofrenda_misionera', 'escuela_sabatica', 'proyectos_especiales', 'otros'),
            allowNull: false,
          },
          amount: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
          },
          currency: {
            type: Sequelize.STRING(3),
            allowNull: false,
            defaultValue: 'PEN',
          },
          period: {
            type: Sequelize.STRING(7),
            allowNull: false,
          },
          paymentMethod: {
            type: Sequelize.ENUM('efectivo', 'transferencia', 'deposito', 'tarjeta', 'otro'),
            allowNull: false,
            defaultValue: 'efectivo',
          },
          receiptNumber: {
            type: Sequelize.STRING(50),
            allowNull: true,
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          recordedBy: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('FinancialContributions', ['churchId'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['memberId'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['category'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['period'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['churchId', 'category', 'period'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['churchId', 'category', 'createdAt'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['recordedBy'], { transaction });
      await queryInterface.addIndex('FinancialContributions', ['createdAt'], { transaction });

      await transaction.commit();
      console.log('✅ Migración create-financial-contributions completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración create-financial-contributions:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('FinancialContributions', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_FinancialContributions_category" CASCADE;',
        { transaction },
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_FinancialContributions_paymentMethod" CASCADE;',
        { transaction },
      );

      await transaction.commit();
      console.log('✅ Rollback create-financial-contributions completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback create-financial-contributions:', error.message);
      throw error;
    }
  },
};
