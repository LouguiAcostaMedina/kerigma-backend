'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FeatureFlags', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      isEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      category: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'general' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.bulkInsert('FeatureFlags', [
      { id: 'ff000000-0000-0000-0000-000000000001', name: 'calendar', description: 'Calendario de actividades', isEnabled: true, category: 'core', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000002', name: 'tithes', description: 'Diezmos y ofrendas', isEnabled: true, category: 'finance', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000003', name: 'ministries', description: 'Ministerios y voluntariado', isEnabled: true, category: 'core', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000004', name: 'pastoral_care', description: 'Cuidado pastoral y peticiones de oración', isEnabled: true, category: 'pastoral', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000005', name: 'baptism_pipeline', description: 'Pipeline de bautismo', isEnabled: true, category: 'education', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000006', name: 'documents', description: 'Repositorio de documentos', isEnabled: true, category: 'core', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000007', name: 'payments', description: 'Pasarela de pagos en línea', isEnabled: false, category: 'finance', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ff000000-0000-0000-0000-000000000008', name: 'notifications', description: 'Notificaciones email/WhatsApp', isEnabled: true, category: 'communication', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down(queryInterface) { await queryInterface.dropTable('FeatureFlags'); },
};
