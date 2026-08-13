import db from './src/config/db.js';

async function seedCommunities() {
  try {
    // Get a user ID to use as creator
    const userRes = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['student']);
    if (userRes.rows.length === 0) {
      console.log('⚠️ No student user found. Please create a student first.');
      process.exit();
      return;
    }
    const userId = userRes.rows[0].id;
    console.log(`👤 Using user ID: ${userId}`);

    const communities = [
      {
        name: 'Mathematics Study Group',
        description: 'A community for math enthusiasts. Share problems, solutions, and study tips.',
        type: 'study_group',
        category: 'Mathematics',
      },
      {
        name: 'Biology Study Group',
        description: 'Discuss biology concepts, revision, and share resources.',
        type: 'study_group',
        category: 'Biology',
      },
      {
        name: 'AI & Technology',
        description: 'Explore the future of AI, machine learning, and tech innovations.',
        type: 'discussion',
        category: 'Technology',
      },
      {
        name: 'Career Advice',
        description: 'Get advice on career paths, internships, and professional development.',
        type: 'discussion',
        category: 'Career',
      },
      {
        name: 'Tech Club',
        description: 'School tech club community. Share projects, code, and collaborate.',
        type: 'club',
        category: 'Technology',
      },
      {
        name: 'Photography Club',
        description: 'Share photos, tips, and learn photography together.',
        type: 'hobby',
        category: 'Photography',
      },
      {
        name: 'Reading Club',
        description: 'Discuss books, share reviews, and discover new reads.',
        type: 'hobby',
        category: 'Reading',
      },
    ];

    let addedCount = 0;
    for (const community of communities) {
      // Check if community already exists
      const check = await db.query(
        'SELECT id FROM communities WHERE name = $1',
        [community.name]
      );
      
      if (check.rows.length === 0) {
        await db.query(
          `INSERT INTO communities (name, description, type, category, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [community.name, community.description, community.type, community.category, userId]
        );
        console.log(`✅ Added: ${community.name}`);
        addedCount++;
      } else {
        console.log(`⏭️ Skipped (already exists): ${community.name}`);
      }
    }

    console.log(`🎉 ${addedCount} sample communities added successfully!`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

seedCommunities();