'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PrayerRequests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      churchId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      memberId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      requesterName: { type: Sequelize.STRING(200), allowNull: false },
      requesterPhone: { type: Sequelize.STRING(20), allowNull: true },
      requesterEmail: { type: Sequelize.STRING(150), allowNull: true },
      subject: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      priority: { type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'), allowNull: false, defaultValue: 'normal' },
      status: { type: Sequelize.ENUM('pending', 'in_progress', 'answered', 'closed'), allowNull: false, defaultValue: 'pending' },
      assignedTo: { type: Sequelize.UUID, allowNull: true, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      resolutionNotes: { type: Sequelize.TEXT, allowNull: true },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      isAnonymous: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('PastoralVisits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      churchId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Churches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      memberId: { type: Sequelize.UUID, allowNull: true, references: { model: 'Members', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      visitorName: { type: Sequelize.STRING(200), allowNull: false },
      visitDate: { type: Sequelize.DATE, allowNull: false },
      visitType: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'pastoral' },
      reason: { type: Sequelize.TEXT, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      outcome: { type: Sequelize.TEXT, allowNull: true },
      followUpNeeded: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      followUpDate: { type: Sequelize.DATEONLY, allowNull: true },
      followUpNotes: { type: Sequelize.TEXT, allowNull: true },
      prayerRequestId: { type: Sequelize.UUID, allowNull: true, references: { model: 'PrayerRequests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      conductedBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('PrayerRequests', ['churchId']);
    await queryInterface.addIndex('PrayerRequests', ['status']);
    await queryInterface.addIndex('PrayerRequests', ['priority']);
    await queryInterface.addIndex('PrayerRequests', ['churchId', 'status']);
    await queryInterface.addIndex('PastoralVisits', ['churchId']);
    await queryInterface.addIndex('PastoralVisits', ['memberId']);
    await queryInterface.addIndex('PastoralVisits', ['followUpNeeded']);
    await queryInterface.addIndex('PastoralVisits', ['churchId', 'visitDate']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PastoralVisits');
    await queryInterface.dropTable('PrayerRequests');
  },
};
