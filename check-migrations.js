require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const seq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});
(async () => {
  try {
    // Get all migration files on disk
    const migrationsDir = path.join(__dirname, 'migrations');
    const diskFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    console.log('Migrations on disk (' + diskFiles.length + '):');
    diskFiles.forEach(f => console.log('  ' + f));
    
    // Get all applied migrations from sequelize_meta
    const [applied] = await seq.query('SELECT name FROM sequelize_meta ORDER BY name');
    const appliedNames = applied.map(r => r.name);
    console.log('\nApplied in DB (' + appliedNames.length + '):');
    appliedNames.forEach(n => console.log('  ' + n));
    
    // Find missing
    const missing = diskFiles.filter(f => !appliedNames.includes(f));
    console.log('\nMISSING (on disk but NOT applied) (' + missing.length + '):');
    missing.forEach(f => console.log('  !! ' + f));
    
    // Find extra
    const extra = appliedNames.filter(n => !diskFiles.includes(n));
    if (extra.length > 0) {
      console.log('\nEXTRA (applied but not on disk) (' + extra.length + '):');
      extra.forEach(n => console.log('  ?? ' + n));
    }
    
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    await seq.close();
  }
})();
