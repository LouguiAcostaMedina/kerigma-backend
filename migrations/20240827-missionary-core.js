/**
 * MISSIONARY-CORE.JS - Núcleo misionero del Sistema de Gestión Misionera
 * Sprint 2 - Migración DDL multi-tenant
 *
 * Crea las tablas del dominio misionero, todas con churchId
 * (aislamiento multi-tenant por iglesia):
 *   Quarters, WeeklyMetrics, BibleStudents, BibleLessonsProgress,
 *   DisciplePairs, AttendanceRecords, QuarterlyGoals
 *
 * Cambios Sprint 2:
 *   - WeeklyMetrics: miembros presentes, estudio diario, participantes
 *     de célula y de estudios bíblicos.
 *   - BibleStudents: disciplePairId (pareja de discipulado asignada).
 *   - DisciplePairs: parejas entre miembros (member1Id/member2Id).
 *   - AttendanceRecords: registro individual por miembro (isPresent,
 *     studiedDaily).
 *   - QuarterlyGoals: tipos Comunión, Relacionamiento y Misión + valor
 *     alcanzado al cierre (achievedValue).
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // =============================================
      // 1. TABLA DE TRIMESTRES
      // =============================================
      await queryInterface.createTable(
        'Quarters',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(100), allowNull: false },
          year: { type: Sequelize.INTEGER, allowNull: false },
          period: {
            type: Sequelize.ENUM('first', 'second', 'third', 'fourth', 'annual'),
            allowNull: false,
            defaultValue: 'first',
          },
          startDate: { type: Sequelize.DATEONLY, allowNull: false },
          endDate: { type: Sequelize.DATEONLY, allowNull: false },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          isCurrent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          createdBy: { type: Sequelize.UUID, allowNull: true },
          updatedBy: { type: Sequelize.UUID, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('Quarters', ['churchId', 'year', 'period'], {
        name: 'idx_quarters_church_year_period',
        unique: true,
        transaction,
      });
      await queryInterface.addIndex('Quarters', ['churchId', 'isCurrent'], { transaction });
      await queryInterface.addIndex('Quarters', ['isActive'], { transaction });

      // =============================================
      // 2. TABLA DE MÉTRICAS SEMANALES
      // =============================================
      await queryInterface.createTable(
        'WeeklyMetrics',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          groupId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Groups', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          quarterId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Quarters', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          weekStart: { type: Sequelize.DATEONLY, allowNull: false },
          weekEnd: { type: Sequelize.DATEONLY, allowNull: false },
          membersPresent: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          dailyBibleStudy: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          smallGroupParticipants: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          bibleStudiesParticipants: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalMeetings: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          averageAttendance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          maxAttendance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          minAttendance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          newMembers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          leftMembers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          netGrowth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalMembersStart: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalMembersEnd: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          newConversions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          baptisms: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          decisionsForChrist: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          newStudents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          graduatedStudents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          activeStudents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          evangelisticEvents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          communityServices: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          specialMeetings: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          offerings: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          tithes: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          specialOfferings: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          challenges: { type: Sequelize.TEXT, allowNull: true },
          achievements: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'draft',
          },
          approvedBy: { type: Sequelize.UUID, allowNull: true },
          approvedAt: { type: Sequelize.DATE, allowNull: true },
          rejectionReason: { type: Sequelize.TEXT, allowNull: true },
          createdBy: { type: Sequelize.UUID, allowNull: false },
          updatedBy: { type: Sequelize.UUID, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('WeeklyMetrics', ['churchId', 'groupId', 'weekStart'], {
        name: 'idx_weekly_metrics_group_week',
        unique: true,
        transaction,
      });
      await queryInterface.addIndex('WeeklyMetrics', ['groupId'], { transaction });
      await queryInterface.addIndex('WeeklyMetrics', ['quarterId'], { transaction });
      await queryInterface.addIndex('WeeklyMetrics', ['churchId', 'status'], { transaction });

      // =============================================
      // 3. TABLA DE ESTUDIANTES BÍBLICOS
      // =============================================
      await queryInterface.createTable(
        'BibleStudents',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          groupId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Groups', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mentorId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          firstName: { type: Sequelize.STRING(100), allowNull: false },
          lastName: { type: Sequelize.STRING(100), allowNull: false },
          email: { type: Sequelize.STRING(150), allowNull: true },
          phone: { type: Sequelize.STRING(20), allowNull: true },
          dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
          gender: {
            type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
            allowNull: true,
          },
          address: { type: Sequelize.TEXT, allowNull: true },
          city: { type: Sequelize.STRING(100), allowNull: true },
          district: { type: Sequelize.STRING(100), allowNull: true },
          enrollmentDate: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
          program: {
            type: Sequelize.ENUM(
              'basic_bible',
              'intermediate_bible',
              'advanced_bible',
              'theology',
              'discipleship',
              'leadership',
              'missions',
              'evangelism',
              'counseling',
              'other',
            ),
            allowNull: false,
            defaultValue: 'basic_bible',
          },
          level: {
            type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'graduate'),
            allowNull: false,
            defaultValue: 'beginner',
          },
          currentGrade: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
          attendancePercentage: { type: Sequelize.INTEGER, allowNull: true },
          completedLessons: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalLessons: { type: Sequelize.INTEGER, allowNull: true },
          status: {
            type: Sequelize.ENUM('enrolled', 'active', 'completed', 'dropped', 'suspended', 'graduated'),
            allowNull: false,
            defaultValue: 'enrolled',
          },
          graduationDate: { type: Sequelize.DATEONLY, allowNull: true },
          certificateIssued: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          certificateNumber: { type: Sequelize.STRING(50), allowNull: true },
          isBeliever: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          baptized: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          baptismDate: { type: Sequelize.DATEONLY, allowNull: true },
          churchMember: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          tags: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true, defaultValue: [] },
          createdBy: { type: Sequelize.UUID, allowNull: true },
          updatedBy: { type: Sequelize.UUID, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('BibleStudents', ['groupId'], { transaction });
      await queryInterface.addIndex('BibleStudents', ['mentorId'], { transaction });
      await queryInterface.addIndex('BibleStudents', ['churchId', 'status'], { transaction });
      await queryInterface.addIndex('BibleStudents', ['certificateNumber'], {
        name: 'idx_bible_students_certificate',
        unique: true,
        where: {
          certificateNumber: Sequelize.literal('"certificateNumber" IS NOT NULL'),
        },
        transaction,
      });

      // =============================================
      // 4. TABLA DE PROGRESO DE LECCIONES BÍBLICAS
      // =============================================
      await queryInterface.createTable(
        'BibleLessonsProgress',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          bibleStudentId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'BibleStudents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          lessonNumber: { type: Sequelize.INTEGER, allowNull: false },
          lessonTitle: { type: Sequelize.STRING(255), allowNull: true },
          isCompleted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          completedBy: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          createdBy: { type: Sequelize.UUID, allowNull: true },
          updatedBy: { type: Sequelize.UUID, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('BibleLessonsProgress', ['bibleStudentId', 'lessonNumber'], {
        name: 'idx_lessons_student_lesson',
        unique: true,
        transaction,
      });
      await queryInterface.addIndex('BibleLessonsProgress', ['churchId'], { transaction });
      await queryInterface.addIndex('BibleLessonsProgress', ['bibleStudentId', 'isCompleted'], { transaction });

      // =============================================
      // 5. TABLA DE PAREJAS DE DISCIPULADO
      // =============================================
      await queryInterface.createTable(
        'DisciplePairs',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          groupId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Groups', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          member1Id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Members', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          member2Id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Members', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          mentorId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          discipleId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'BibleStudents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          status: {
            type: Sequelize.ENUM('active', 'paused', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'active',
          },
          startedAt: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
          endedAt: { type: Sequelize.DATEONLY, allowNull: true },
          meetingSchedule: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdBy: { type: Sequelize.UUID, allowNull: true },
          updatedBy: { type: Sequelize.UUID, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('DisciplePairs', ['churchId'], { transaction });
      await queryInterface.addIndex('DisciplePairs', ['groupId'], { transaction });
      await queryInterface.addIndex('DisciplePairs', ['member1Id'], { transaction });
      await queryInterface.addIndex('DisciplePairs', ['member2Id'], { transaction });
      await queryInterface.addIndex('DisciplePairs', ['mentorId'], { transaction });
      await queryInterface.addIndex('DisciplePairs', ['discipleId', 'status'], { transaction });

      // BibleStudents -> DisciplePairs (FK circular, se agrega tras crear ambas)
      await queryInterface.addColumn(
        'BibleStudents',
        'disciplePairId',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'DisciplePairs', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addIndex('BibleStudents', ['disciplePairId'], { transaction });

      // =============================================
      // 6. TABLA DE REGISTROS DE ASISTENCIA (individual por miembro)
      // =============================================
      await queryInterface.createTable(
        'AttendanceRecords',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          groupId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Groups', key: 'id' },
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
          meetingDate: { type: Sequelize.DATEONLY, allowNull: false },
          meetingType: {
            type: Sequelize.ENUM('regular', 'special', 'evangelism', 'community', 'prayer', 'study', 'other'),
            allowNull: false,
            defaultValue: 'regular',
          },
          isPresent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          studiedDaily: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          notes: { type: Sequelize.TEXT, allowNull: true },
          recordedBy: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('AttendanceRecords', ['groupId', 'memberId', 'meetingDate', 'meetingType'], {
        name: 'idx_attendance_member_date',
        unique: true,
        transaction,
      });
      await queryInterface.addIndex('AttendanceRecords', ['churchId'], { transaction });
      await queryInterface.addIndex('AttendanceRecords', ['groupId', 'meetingDate'], { transaction });
      await queryInterface.addIndex('AttendanceRecords', ['memberId'], { transaction });
      await queryInterface.addIndex('AttendanceRecords', ['recordedBy'], { transaction });

      // =============================================
      // 7. TABLA DE OBJETIVOS TRIMESTRALES
      // =============================================
      await queryInterface.createTable(
        'QuarterlyGoals',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
          churchId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Churches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          quarterId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Quarters', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          groupId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Groups', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          goalType: {
            type: Sequelize.ENUM('comunion', 'relacionamiento', 'mision'),
            allowNull: false,
            defaultValue: 'comunion',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          targetValue: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          currentValue: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          achievedValue: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          unit: { type: Sequelize.STRING(50), allowNull: true },
          status: {
            type: Sequelize.ENUM('not_started', 'in_progress', 'achieved', 'missed', 'cancelled'),
            allowNull: false,
            defaultValue: 'not_started',
          },
          startDate: { type: Sequelize.DATEONLY, allowNull: true },
          dueDate: { type: Sequelize.DATEONLY, allowNull: true },
          createdBy: { type: Sequelize.UUID, allowNull: true },
          updatedBy: { type: Sequelize.UUID, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        },
        { transaction },
      );
      await queryInterface.addIndex('QuarterlyGoals', ['quarterId'], { transaction });
      await queryInterface.addIndex('QuarterlyGoals', ['groupId'], { transaction });
      await queryInterface.addIndex('QuarterlyGoals', ['churchId', 'status'], { transaction });

      await transaction.commit();
      console.log('✅ Migración missionary-core completada exitosamente');
      console.log('📊 Tablas creadas: Quarters, WeeklyMetrics, BibleStudents, BibleLessonsProgress, DisciplePairs, AttendanceRecords, QuarterlyGoals');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración missionary-core:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('BibleStudents', 'disciplePairId', { transaction });
      await queryInterface.dropTable('QuarterlyGoals', { transaction });
      await queryInterface.dropTable('AttendanceRecords', { transaction });
      await queryInterface.dropTable('DisciplePairs', { transaction });
      await queryInterface.dropTable('BibleLessonsProgress', { transaction });
      await queryInterface.dropTable('BibleStudents', { transaction });
      await queryInterface.dropTable('WeeklyMetrics', { transaction });
      await queryInterface.dropTable('Quarters', { transaction });

      await transaction.commit();
      console.log('✅ Rollback missionary-core completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback missionary-core:', error.message);
      throw error;
    }
  },
};
