import db from './src/config/db.js';

const seedData = async () => {
  try {
    // Ensure the type column exists (just in case)
    await db.query(`
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'school';
    `);

    // Insert countries
    await db.query(`
      INSERT INTO countries (name, code) VALUES
      ('Kenya', 'KE'),
      ('United States', 'US'),
      ('United Kingdom', 'UK'),
      ('Canada', 'CA'),
      ('Australia', 'AU')
      ON CONFLICT (code) DO NOTHING;
    `);

    // Insert institutions – using a subquery to avoid duplicates
    await db.query(`
      INSERT INTO institutions (name, type, country_id)
      SELECT 'Thika Technical Institute', 'college', id
      FROM countries
      WHERE code = 'KE'
      AND NOT EXISTS (SELECT 1 FROM institutions WHERE name = 'Thika Technical Institute');
    `);

    console.log('✅ Seed data inserted successfully.');
  } catch (err) {
    console.error('❌ Error seeding data:', err);
  } finally {
    process.exit();
  }
};

seedData();