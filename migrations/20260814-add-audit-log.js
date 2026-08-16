/**
 * ADD-AUDIT-LOG.JS
 * Crea la tabla AuditLogs para el registro de auditoría de acciones sobre el sistema
 * (creación, edición, borrado, cambios de estado, etc.) con referencia al actor (Users).
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'AuditLogs',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },
          entity: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          entityId: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          action: {
            type: Sequelize.ENUM(
              'create',
              'update',
              'delete',
              'status_change',
              'assign',
              'bulk',
              'import',
              'login',
              'logout',
              'invite',
              'reset_password',
            ),
            allowNull: false,
          },
          actorUserId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          changes: {
            type: Sequelize.JSONB,
            allowNull: true,
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
        },
        { transaction },
      );

      await queryInterface.addIndex('AuditLogs', ['entity', 'entityId'], { transaction });
      await queryInterface.addIndex('AuditLogs', ['actorUserId'], { transaction });
      await queryInterface.addIndex('AuditLogs', ['entity', 'action'], { transaction });
      await queryInterface.addIndex('AuditLogs', ['createdAt'], { transaction });

      await transaction.commit();
      console.log('✅ Migración add-audit-log completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-audit-log:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('AuditLogs', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AuditLogs_action" CASCADE;', { transaction });

      await transaction.commit();
      console.log('✅ Rollback add-audit-log completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-audit-log:', error.message);
      throw error;
    }
  },
};
