/**
 * ADD-BIBLESTUDENT-SOFT-DELETE.JS
 * Añade la columna deletedAt a BibleStudents y un índice para habilitar soft-delete
 * (paranoid) de estudiantes, consistente con el resto de modelos (Church, User, Group, Member).
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'BibleStudents',
        'deletedAt',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addIndex('BibleStudents', ['deletedAt'], { transaction });

      await transaction.commit();
      console.log('✅ Migración add-biblestudent-soft-delete completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-biblestudent-soft-delete:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex('BibleStudents', ['deletedAt'], { transaction });
      await queryInterface.removeColumn('BibleStudents', 'deletedAt', { transaction });

      await transaction.commit();
      console.log('✅ Rollback add-biblestudent-soft-delete completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-biblestudent-soft-delete:', error.message);
      throw error;
    }
  },
};
