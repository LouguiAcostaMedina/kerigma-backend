/**
 * ADD-CHURCH-PASTOR-LEADER.JS
 * Añade las columnas pastorId y leaderId a la tabla Churches como claves foráneas
 * reales hacia Users, de modo que cada iglesia referencie a su pastor y a su líder.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Churches',
        'pastorId',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Churches',
        'leaderId',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );

      await transaction.commit();
      console.log('✅ Migración add-church-pastor-leader completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-church-pastor-leader:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Churches', 'leaderId', { transaction });
      await queryInterface.removeColumn('Churches', 'pastorId', { transaction });

      await transaction.commit();
      console.log('✅ Rollback add-church-pastor-leader completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-church-pastor-leader:', error.message);
      throw error;
    }
  },
};
