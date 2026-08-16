/**
 * ADD-USER-PERSONAL-FIELDS.JS
 * Añade los campos personales de usuario (dirección, fecha de nacimiento, género,
 * estado civil, ocupación, contacto de emergencia y notas) a la tabla Users.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Users',
        'address',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'city',
        { type: Sequelize.STRING(100), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'state',
        { type: Sequelize.STRING(100), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'zipCode',
        { type: Sequelize.STRING(20), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'dateOfBirth',
        { type: Sequelize.DATEONLY, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'gender',
        { type: Sequelize.STRING(20), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'maritalStatus',
        { type: Sequelize.STRING(20), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'occupation',
        { type: Sequelize.STRING(150), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'emergencyContact',
        { type: Sequelize.STRING(200), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'emergencyPhone',
        { type: Sequelize.STRING(20), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'notes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await transaction.commit();
      console.log('✅ Migración add-user-personal-fields completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-user-personal-fields:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Users', 'notes', { transaction });
      await queryInterface.removeColumn('Users', 'emergencyPhone', { transaction });
      await queryInterface.removeColumn('Users', 'emergencyContact', { transaction });
      await queryInterface.removeColumn('Users', 'occupation', { transaction });
      await queryInterface.removeColumn('Users', 'maritalStatus', { transaction });
      await queryInterface.removeColumn('Users', 'gender', { transaction });
      await queryInterface.removeColumn('Users', 'dateOfBirth', { transaction });
      await queryInterface.removeColumn('Users', 'zipCode', { transaction });
      await queryInterface.removeColumn('Users', 'state', { transaction });
      await queryInterface.removeColumn('Users', 'city', { transaction });
      await queryInterface.removeColumn('Users', 'address', { transaction });

      await transaction.commit();
      console.log('✅ Rollback add-user-personal-fields completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-user-personal-fields:', error.message);
      throw error;
    }
  },
};
