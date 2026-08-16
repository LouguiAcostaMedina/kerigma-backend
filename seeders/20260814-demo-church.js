/**
 * DEMO-CHURCH.JS
 * Seeder idempotente con datos demo reales: una iglesia y los usuarios del equipo
 * misionero (super admin global, pastor, líder y director de la iglesia).
 * - No borra nada existente; omite registros que ya existan.
 * - Las contraseñas iniciales son temporales: cambiar después del primer inicio.
 * - Ejecutar con: npm run seed
 */

'use strict';

const bcrypt = require('bcryptjs');

const PASSWORD = process.env.SEED_DEMO_PASSWORD || 'DemoMisionero2026!';

function hash() {
  return bcrypt.hashSync(PASSWORD, 10);
}

module.exports = {
  async up(queryInterface) {
    const db = queryInterface.sequelize;

    const church = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Iglesia Misionera Central',
      address: 'Av. Los Misioneros 123',
      city: 'Lima',
      state: 'Lima',
      country: 'Perú',
      zipCode: '15001',
      latitude: '-12.046374',
      longitude: '-77.042793',
      phone: '+51 1 555 0101',
      email: 'central@misionero.com',
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const users = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        email: 'admin@misionero.com',
        password: hash(),
        firstName: 'Admin',
        lastName: 'Misionero',
        role: 'super_admin',
        churchId: null,
        isActive: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        email: 'pastor@misionero.com',
        password: hash(),
        firstName: 'Pastor',
        lastName: 'Central',
        role: 'admin',
        churchId: church.id,
        isActive: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        email: 'lider@misionero.com',
        password: hash(),
        firstName: 'Líder',
        lastName: 'Célula Central',
        role: 'leader',
        churchId: church.id,
        isActive: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        email: 'director@misionero.com',
        password: hash(),
        firstName: 'Director',
        lastName: 'Misiones',
        role: 'director',
        churchId: church.id,
        isActive: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const transaction = await db.transaction();

    try {
      const existingChurch = await db.query('SELECT id FROM "Churches" WHERE id = ?', {
        type: db.QueryTypes.SELECT,
        replacements: [church.id],
        transaction,
      });
      if (existingChurch.length === 0) {
        await db.query(
          `INSERT INTO "Churches"
            ("id", "name", "address", "city", "state", "country", "zipCode", "latitude", "longitude",
             "phone", "email", "status", "isActive", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              church.id, church.name, church.address, church.city, church.state, church.country,
              church.zipCode, church.latitude, church.longitude, church.phone, church.email,
              church.status, church.isActive, church.createdAt, church.updatedAt,
            ],
            transaction,
          },
        );
        console.log('🏛️  Iglesia demo creada:', church.name);
      } else {
        console.log('🏛️  Iglesia demo ya existía, omitiendo');
      }

      for (const user of users) {
        const existing = await db.query('SELECT id FROM "Users" WHERE email = ?', {
          type: db.QueryTypes.SELECT,
          replacements: [user.email],
          transaction,
        });
        if (existing.length > 0) {
          console.log('👤 Usuario ya existía, omitiendo:', user.email);
          continue;
        }
        await db.query(
          `INSERT INTO "Users"
            ("id", "email", "password", "firstName", "lastName", "role", "churchId",
             "isActive", "isApproved", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              user.id, user.email, user.password, user.firstName, user.lastName, user.role,
              user.churchId, user.isActive, user.isApproved, user.createdAt, user.updatedAt,
            ],
            transaction,
          },
        );
        console.log('👤 Usuario demo creado:', user.email, `(${user.role})`);
      }

      await transaction.commit();
      console.log('✅ Seeder demo-church completado. Contraseña temporal: ' + PASSWORD);
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en seeder demo-church:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const db = queryInterface.sequelize;
    const transaction = await db.transaction();

    try {
      await db.query('DELETE FROM "Users" WHERE id IN (?, ?, ?, ?)', {
        replacements: [
          '22222222-2222-4222-8222-222222222222',
          '33333333-3333-4333-8333-333333333333',
          '44444444-4444-4444-8444-444444444444',
          '55555555-5555-4555-8555-555555555555',
        ],
        transaction,
      });
      await db.query('DELETE FROM "Churches" WHERE id = ?', {
        replacements: ['11111111-1111-4111-8111-111111111111'],
        transaction,
      });

      await transaction.commit();
      console.log('✅ Undo seeder demo-church completado');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en undo seeder demo-church:', error.message);
      throw error;
    }
  },
};
