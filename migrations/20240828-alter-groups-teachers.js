/**
 * ALTER-GROUPS-TEACHERS.JS - Sprint 2
 * Añade los maestros (principal y asociado) a la tabla Groups para el
 * modelo de células/maestros del sistema misionero.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Groups',
        'mainTeacherId',
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
        'Groups',
        'associateTeacherId',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addIndex('Groups', ['mainTeacherId'], { transaction });
      await queryInterface.addIndex('Groups', ['associateTeacherId'], { transaction });

      await transaction.commit();
      console.log('✅ Migración alter-groups-teachers completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración alter-groups-teachers:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Groups', 'associateTeacherId', { transaction });
      await queryInterface.removeColumn('Groups', 'mainTeacherId', { transaction });

      await transaction.commit();
      console.log('✅ Rollback alter-groups-teachers completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback alter-groups-teachers:', error.message);
      throw error;
    }
  },
};
