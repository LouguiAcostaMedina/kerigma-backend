/**
 * 20260817-add-member-consent.js
 * Agrega campos de consentimiento de datos personales a la tabla Members
 * conforme a la Ley N° 29733 de Protección de Datos Personales (Perú).
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Members',
        'consentGiven',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Members',
        'consentDate',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Members',
        'consentIp',
        {
          type: Sequelize.STRING(45),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Members',
        'consentVersion',
        {
          type: Sequelize.STRING(10),
          allowNull: true,
          defaultValue: '1.0',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Members',
        'dataRetentionStatus',
        {
          type: Sequelize.ENUM('active', 'anonymized', 'pending_deletion'),
          allowNull: false,
          defaultValue: 'active',
        },
        { transaction },
      );

      await queryInterface.addIndex('Members', ['consentGiven'], { transaction });
      await queryInterface.addIndex('Members', ['dataRetentionStatus'], { transaction });

      await transaction.commit();
      console.log('✅ Migración add-member-consent completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-member-consent:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Members', 'consentGiven', { transaction });
      await queryInterface.removeColumn('Members', 'consentDate', { transaction });
      await queryInterface.removeColumn('Members', 'consentIp', { transaction });
      await queryInterface.removeColumn('Members', 'consentVersion', { transaction });
      await queryInterface.removeColumn('Members', 'dataRetentionStatus', { transaction });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Members_dataRetentionStatus" CASCADE;',
        { transaction },
      );

      await transaction.commit();
      console.log('✅ Rollback add-member-consent completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-member-consent:', error.message);
      throw error;
    }
  },
};
