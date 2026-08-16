/**
 * ADD-PERFORMANCE-INDEXES.JS
 * Índices compuestos y funcionales para acelerar las consultas del dashboard,
 * los filtros geográficos y los flujos de asistencia:
 *  - WeeklyMetrics (churchId, weekStart): rango semanal por iglesia.
 *  - AttendanceRecords (churchId, meetingDate): KPIs de asistencia por iglesia.
 *  - QuarterlyGoals (churchId, quarterId): avance de metas por trimestre.
 *  - Members (groupId, isActive): flujos de membresía/asistencia por grupo.
 *  - Churches (city, state) y LOWER(city): filtros y búsqueda geográfica.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex('WeeklyMetrics', ['churchId', 'weekStart'], {
        name: 'idx_weekly_metrics_church_weekstart',
        transaction,
      });
      await queryInterface.addIndex('AttendanceRecords', ['churchId', 'meetingDate'], {
        name: 'idx_attendance_church_meetingdate',
        transaction,
      });
      await queryInterface.addIndex('QuarterlyGoals', ['churchId', 'quarterId'], {
        name: 'idx_quarterly_goals_church_quarter',
        transaction,
      });
      await queryInterface.addIndex('Members', ['groupId', 'isActive'], {
        name: 'idx_members_group_active',
        transaction,
      });
      await queryInterface.addIndex('Churches', ['city', 'state'], {
        name: 'idx_churches_city_state',
        transaction,
      });
      await queryInterface.addIndex('Churches', [Sequelize.literal('LOWER("city")')], {
        name: 'idx_churches_lower_city',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Migración add-performance-indexes completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración add-performance-indexes:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex('WeeklyMetrics', 'idx_weekly_metrics_church_weekstart', { transaction });
      await queryInterface.removeIndex('AttendanceRecords', 'idx_attendance_church_meetingdate', { transaction });
      await queryInterface.removeIndex('QuarterlyGoals', 'idx_quarterly_goals_church_quarter', { transaction });
      await queryInterface.removeIndex('Members', 'idx_members_group_active', { transaction });
      await queryInterface.removeIndex('Churches', 'idx_churches_city_state', { transaction });
      await queryInterface.removeIndex('Churches', 'idx_churches_lower_city', { transaction });

      await transaction.commit();
      console.log('✅ Rollback add-performance-indexes completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback add-performance-indexes:', error.message);
      throw error;
    }
  },
};
