'use strict';

const DEMO_CHURCH_ID = 'demo-church-0000-0000-000000000001';
const DEMO_USER_ID = 'demo-user-0000-0000-000000000001';
const DEMO_GROUP_IDS = [
  'demo-group-0000-0000-000000000001',
  'demo-group-0000-0000-000000000002',
];
const DEMO_MEMBER_IDS = [
  'demo-memb-0000-0000-000000000001',
  'demo-memb-0000-0000-000000000002',
  'demo-memb-0000-0000-000000000003',
  'demo-memb-0000-0000-000000000004',
  'demo-memb-0000-0000-000000000005',
];
const DEMO_PRAYER_IDS = [
  'demo-pray-0000-0000-000000000001',
  'demo-pray-0000-0000-000000000002',
  'demo-pray-0000-0000-000000000003',
];
const DEMO_ACTIVITY_IDS = [
  'demo-acti-0000-0000-000000000001',
  'demo-acti-0000-0000-000000000002',
];

// Pre-hashed bcrypt for 'DemoKerigma2024!' (12 rounds)
const DEMO_PASSWORD_HASH =
  '$2a$12$nrc5YzEN.X4OjiGNqBrohO7mbNuAtIammrz/tsWK1MtDZ.yFpshI2';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.DEMO_MODE !== 'true') {
      console.log('⏭️  DEMO_MODE is not enabled – skipping demo seed.');
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Idempotency: skip if demo church already exists
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM "Churches" WHERE id = :id LIMIT 1`,
        { replacements: { id: DEMO_CHURCH_ID }, transaction },
      );
      if (existing.length > 0) {
        console.log('⏭️  Demo data already present – skipping.');
        await transaction.rollback();
        return;
      }

      // 1. Demo church
      await queryInterface.bulkInsert(
        'Churches',
        [
          {
            id: DEMO_CHURCH_ID,
            name: 'Iglesia Adventista Demo',
            address: 'Av. Principal 1234, Urb. Esperanza',
            city: 'Lima',
            state: 'Lima',
            country: 'Perú',
            zipCode: '15001',
            phone: '+51 1 555 0100',
            email: 'demo@kerigma.com',
            pastor: 'Pastor Demo',
            status: 'active',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
      );

      // 2. Demo admin user
      await queryInterface.bulkInsert(
        'Users',
        [
          {
            id: DEMO_USER_ID,
            email: 'demo@kerigma.com',
            password: DEMO_PASSWORD_HASH,
            firstName: 'Usuario',
            lastName: 'Demo',
            role: 'admin',
            churchId: DEMO_CHURCH_ID,
            isActive: true,
            isApproved: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
      );

      // 3. Demo groups
      await queryInterface.bulkInsert(
        'Groups',
        [
          {
            id: DEMO_GROUP_IDS[0],
            name: 'Grupo Jóvenes',
            description: 'Grupo de jóvenes de la iglesia demo',
            churchId: DEMO_CHURCH_ID,
            leaderId: DEMO_USER_ID,
            type: 'youth',
            category: 'bible_study',
            meetingDay: 'wednesday',
            meetingTime: '19:00',
            meetingDuration: 90,
            meetingLocation: 'Sala principal',
            maxCapacity: 30,
            currentSize: 3,
            isActive: true,
            status: 'active',
            isOpenToNewMembers: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_GROUP_IDS[1],
            name: 'Grupo Adultos Mayores',
            description: 'Grupo de adultos mayores de la iglesia demo',
            churchId: DEMO_CHURCH_ID,
            leaderId: DEMO_USER_ID,
            type: 'seniors',
            category: 'prayer',
            meetingDay: 'friday',
            meetingTime: '10:00',
            meetingDuration: 60,
            meetingLocation: 'Capilla',
            maxCapacity: 20,
            currentSize: 2,
            isActive: true,
            status: 'active',
            isOpenToNewMembers: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
      );

      // 4. Demo members
      await queryInterface.bulkInsert(
        'Members',
        [
          {
            id: DEMO_MEMBER_IDS[0],
            firstName: 'María',
            lastName: 'García López',
            email: 'maria.demo@example.com',
            phone: '+51 999 100 001',
            gender: 'female',
            maritalStatus: 'married',
            groupId: DEMO_GROUP_IDS[0],
            baptized: true,
            spiritualStatus: 'mature',
            status: 'active',
            isActive: true,
            occupation: 'Enfermera',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_MEMBER_IDS[1],
            firstName: 'Carlos',
            lastName: 'Ramírez Solís',
            email: 'carlos.demo@example.com',
            phone: '+51 999 100 002',
            gender: 'male',
            maritalStatus: 'single',
            groupId: DEMO_GROUP_IDS[0],
            baptized: true,
            spiritualStatus: 'growing',
            status: 'active',
            isActive: true,
            occupation: 'Ingeniero',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_MEMBER_IDS[2],
            firstName: 'Ana',
            lastName: 'Torres Martínez',
            email: 'ana.demo@example.com',
            phone: '+51 999 100 003',
            gender: 'female',
            maritalStatus: 'married',
            groupId: DEMO_GROUP_IDS[1],
            baptized: true,
            spiritualStatus: 'leader',
            status: 'active',
            isActive: true,
            occupation: 'Profesora',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_MEMBER_IDS[3],
            firstName: 'José',
            lastName: 'Fernández Díaz',
            email: 'jose.demo@example.com',
            phone: '+51 999 100 004',
            gender: 'male',
            maritalStatus: 'widowed',
            groupId: DEMO_GROUP_IDS[1],
            baptized: true,
            spiritualStatus: 'mature',
            status: 'active',
            isActive: true,
            occupation: 'Retirado',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_MEMBER_IDS[4],
            firstName: 'Lucía',
            lastName: 'Vargas Paredes',
            email: 'lucia.demo@example.com',
            phone: '+51 999 100 005',
            gender: 'female',
            maritalStatus: 'single',
            groupId: DEMO_GROUP_IDS[0],
            baptized: false,
            spiritualStatus: 'new_believer',
            status: 'active',
            isActive: true,
            occupation: 'Estudiante',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
      );

      // 5. Demo prayer requests
      await queryInterface.bulkInsert(
        'PrayerRequests',
        [
          {
            id: DEMO_PRAYER_IDS[0],
            churchId: DEMO_CHURCH_ID,
            memberId: DEMO_MEMBER_IDS[0],
            requesterName: 'María García',
            requesterPhone: '+51 999 100 001',
            subject: 'Salud de la familia',
            description: 'Por favor ores por la salud de mi madre que está hospitalizada.',
            priority: 'high',
            status: 'pending',
            isAnonymous: false,
            isPublic: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_PRAYER_IDS[1],
            churchId: DEMO_CHURCH_ID,
            memberId: DEMO_MEMBER_IDS[1],
            requesterName: 'Carlos Ramírez',
            subject: 'Nuevo empleo',
            description: 'Necesito un empleo estable para mantener a mi familia.',
            priority: 'normal',
            status: 'in_progress',
            assignedTo: DEMO_USER_ID,
            isAnonymous: false,
            isPublic: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_PRAYER_IDS[2],
            churchId: DEMO_CHURCH_ID,
            requesterName: 'Anónimo',
            subject: 'Paz interior',
            description: 'Oren por mi vida espiritual, siento que me he alejado de Dios.',
            priority: 'normal',
            status: 'pending',
            isAnonymous: true,
            isPublic: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
      );

      // 6. Demo activities
      await queryInterface.bulkInsert(
        'Activities',
        [
          {
            id: DEMO_ACTIVITY_IDS[0],
            churchId: DEMO_CHURCH_ID,
            title: 'Culto de Adoración Dominical',
            description: 'Culto principal de adoración y alabanza cada domingo.',
            eventType: 'worship',
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000),
            location: 'Templo principal',
            recurrence: 'weekly',
            isActive: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: DEMO_ACTIVITY_IDS[1],
            churchId: DEMO_CHURCH_ID,
            title: 'Reunión de Oración',
            description: 'Reunión semanal de oración y estudio bíblico.',
            eventType: 'study',
            startDate: new Date(Date.now() + 3 * 86400000),
            endDate: new Date(Date.now() + 3 * 86400000 + 5400000),
            location: 'Sala de reuniones',
            recurrence: 'weekly',
            isActive: true,
            createdBy: DEMO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
      );

      await transaction.commit();
      console.log('✅ Demo data seeded successfully.');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Demo seed failed:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    if (process.env.DEMO_MODE !== 'true') return;

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('Activities', { id: DEMO_ACTIVITY_IDS }, { transaction });
      await queryInterface.bulkDelete('PrayerRequests', { id: DEMO_PRAYER_IDS }, { transaction });
      await queryInterface.bulkDelete('Members', { id: DEMO_MEMBER_IDS }, { transaction });
      await queryInterface.bulkDelete('Groups', { id: DEMO_GROUP_IDS }, { transaction });
      await queryInterface.bulkDelete('Users', { id: DEMO_USER_ID }, { transaction });
      await queryInterface.bulkDelete('Churches', { id: DEMO_CHURCH_ID }, { transaction });
      await transaction.commit();
      console.log('✅ Demo data removed.');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
