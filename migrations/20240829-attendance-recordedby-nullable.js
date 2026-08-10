/**
 * MIGRATION - Registro de asistencia por QR (check-in público)
 * Sprint 3
 *
 * Hace nullable la columna recordedBy de AttendanceRecords para permitir
 * check-ins públicos (QR) sin usuario autenticado.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'AttendanceRecords',
        'recordedBy',
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
      console.log('✅ Migración recordedBy nullable completada (check-in por QR)');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración recordedBy nullable:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        'DELETE FROM "AttendanceRecords" WHERE "recordedBy" IS NULL',
        { transaction },
      );

      await queryInterface.changeColumn(
        'AttendanceRecords',
        'recordedBy',
        {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        { transaction },
      );

      await transaction.commit();
      console.log('✅ Rollback recordedBy nullable completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback recordedBy nullable:', error.message);
      throw error;
    }
  },
};
