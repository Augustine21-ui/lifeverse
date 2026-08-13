import db from './src/config/db.js';

const seedCurricula = async () => {
  try {
    // Get Kenya's ID
    const kenyaRes = await db.query(`SELECT id FROM countries WHERE name = 'Kenya'`);
    if (kenyaRes.rows.length === 0) {
      console.log('⚠️ Kenya not found in countries table. Please run seed-academic-data.js first.');
      process.exit();
      return;
    }
    const kenyaId = kenyaRes.rows[0].id;

    // Insert curricula using direct INSERT with WHERE NOT EXISTS
    const curricula = [
      { name: 'CBC (Competency Based Curriculum)', level: 'primary' },
      { name: 'CBC (Competency Based Curriculum)', level: 'secondary' },
      { name: '8-4-4 System', level: 'primary' },
      { name: '8-4-4 System', level: 'secondary' },
      { name: 'KNEC TVET Curriculum', level: 'college' },
      { name: 'Commission for University Education (CUE)', level: 'university' },
    ];

    for (const curr of curricula) {
      const result = await db.query(`
        INSERT INTO curricula (name, country_id, education_level)
        SELECT $1::VARCHAR, $2::INTEGER, $3::VARCHAR
        WHERE NOT EXISTS (
          SELECT 1 FROM curricula 
          WHERE name = $1::VARCHAR AND education_level = $3::VARCHAR
        )
      `, [curr.name, kenyaId, curr.level]);
      console.log(`  ✓ ${curr.name} (${curr.level})`);
    }

    console.log('✅ Curricula seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding curricula:', err);
  } finally {
    process.exit();
  }
};

seedCurricula();