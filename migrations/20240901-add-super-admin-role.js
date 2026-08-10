/**
 * MIGRATION - Rol explícito 'super_admin'
 *
 * Agrega el valor 'super_admin' al tipo ENUM "enum_Users_role"
 * (columna Users.role) para soportar un SuperAdmin global con acceso
 * al dashboard consolidado de todas las iglesias.
 *
 * Nota: se ejecuta SIN transacción porque PostgreSQL no permite usar
 * ALTER TYPE ... ADD VALUE dentro de un bloque transaccional en
 * versiones < 12 y restringe su uso en la misma transacción en >= 12.
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [types] = await queryInterface.sequelize.query(
      `SELECT typname FROM pg_type WHERE typname = 'enum_Users_role'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    if (types.length === 0) {
      console.log('ℹ️ El tipo "enum_Users_role" no existe; omitiendo migración.');
      return;
    }

    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'super_admin'`,
    );
    console.log('✅ Rol "super_admin" agregado al ENUM "enum_Users_role".');
  },

  async down(queryInterface) {
    const [types] = await queryInterface.sequelize.query(
      `SELECT typname FROM pg_type WHERE typname = 'enum_Users_role'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    if (types.length === 0) {
      return;
    }

    // Recrea el tipo sin 'super_admin'. Fallará si existen filas con ese rol
    // (protege contra pérdida de datos).
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_old"`,
    );
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'director', 'leader', 'reader')`,
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" TYPE "enum_Users_role" USING "role"::text::"enum_Users_role"`,
    );
    await queryInterface.sequelize.query(`DROP TYPE "enum_Users_role_old"`);
    console.log('✅ Rollback: rol "super_admin" eliminado del ENUM "enum_Users_role".');
  },
};
