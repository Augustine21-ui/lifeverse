// backend/scripts/seedPostgres.cjs
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 1. Try loading .env with dotenv (explicit path)
const envPath = path.resolve(__dirname, '../.env');
console.log(`Attempting to load .env from: ${envPath}`);

// Check if dotenv is installed
let dotenvLoaded = false;
try {
  require('dotenv').config({ path: envPath });
  if (process.env.DATABASE_URL) {
    dotenvLoaded = true;
    console.log('✅ .env loaded with dotenv');
  }
} catch (e) {
  console.log('dotenv not available, falling back to manual parse');
}

// 2. If dotenv failed, manually parse the file
if (!dotenvLoaded || !process.env.DATABASE_URL) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.+)\s*$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
        if (key === 'DATABASE_URL') {
          console.log('✅ DATABASE_URL manually parsed from .env');
        }
      }
    }
  } else {
    console.error(`❌ .env file not found at: ${envPath}`);
    process.exit(1);
  }
}

const connectionString = process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_CY4pociIVO2K@ep-bold-base-af9oxjrq.c-2.us-west-2.aws.neon.tech/neondb';
if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in .env');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');

// Neon requires SSL – add if missing
let finalConnectionString = connectionString;
if (!finalConnectionString.includes('sslmode=')) {
  finalConnectionString += (finalConnectionString.includes('?') ? '&' : '?') + 'sslmode=require';
}

const client = new Client({
  connectionString: finalConnectionString,
  ssl: true,   // simpler SSL
  keepAlive: true,
  connectionTimeoutMillis: 30000, // 30 seconds timeout
  idleTimeoutMillis: 30000,
});

// ------------------- Seed logic (same as before) -------------------
async function seed() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Delete old demo user
    await client.query(`DELETE FROM users WHERE email = 'demo@lifeverse.com'`);

    const hashedPassword = await bcrypt.hash('Demo123!', 10);

    // Insert demo user
    const userRes = await client.query(`
      INSERT INTO users (
        email, password_hash, full_name, username, xp, level, streak_days,
        mood, date_of_birth, education_level, institution_subscription_valid,
        is_active, email_verified, created_at, updated_at, last_activity_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
      RETURNING id
    `, [
      'demo@lifeverse.com',
      hashedPassword,
      'Alex Taylor',
      'demo_user',
      1250, 3, 7, 'happy',
      '2005-05-15', 'bachelors', true,
      true, true
    ]);

    const userId = userRes.rows[0].id;
    console.log(`✅ Demo user created (id: ${userId})`);

    // Tasks
    const tasks = [
      { title: 'Complete React module', xp_reward: 50, is_completed: true },
      { title: 'Practice algorithms', xp_reward: 30, is_completed: false },
      { title: 'Review Orbit lesson', xp_reward: 20, is_completed: false },
      { title: 'Prepare for study group', xp_reward: 40, is_completed: false },
    ];
    for (const t of tasks) {
      await client.query(`
        INSERT INTO tasks (user_id, title, xp_reward, is_completed, due_date, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [userId, t.title, t.xp_reward, t.is_completed, t.is_completed ? new Date() : new Date(Date.now() + 86400000 * 2)]);
    }
    console.log(`✅ ${tasks.length} tasks created`);

    // Focus sessions (last 7 days)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const duration = [15, 25, 30, 45][Math.floor(Math.random() * 4)];
      const startTime = new Date(date);
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(10 + duration / 60, 0, 0, 0);
      await client.query(`
        INSERT INTO focus_sessions (user_id, duration, start_time, end_time, completed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, duration, startTime, endTime, true, new Date()]);
    }
    console.log('✅ Focus sessions created');

    // Orbit sessions
    const orbitTopics = ['Cortex', 'CluePath', 'Pathfinder', 'Reflex'];
    for (const topic of orbitTopics) {
      await client.query(`
        INSERT INTO orbit_sessions (user_id, subject, topic, orbit_type, status, completed_at, score, xp_earned)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, 'Computer Science', topic, 'practice', 'completed', new Date(), Math.floor(Math.random() * 30) + 70, Math.floor(Math.random() * 50) + 50]);
    }
    console.log('✅ Orbit sessions created');

    // Social posts
    const posts = [
      {
        content: 'Looking for a study partner for Algorithms and Data Structures. Anyone interested?',
        location: 'Mumbai',
        time_ago: '1w ago',
        questions: 2,
        stars: 1,
      },
      {
        content: 'Just completed a 25-min focus session! Feeling productive 💪',
        location: 'Global',
        time_ago: '2d ago',
        questions: 0,
        stars: 3,
      },
    ];
    for (const p of posts) {
      await client.query(`
        INSERT INTO posts (user_id, content, location, time_ago, questions, stars, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [userId, p.content, p.location, p.time_ago, p.questions, p.stars]);
    }
    console.log('✅ Social posts created');

    // Timetable entries
    const timetableEntries = [
      { day_of_week: 1, subject: 'Maths', start_time: '09:00', end_time: '10:30', location: 'Room 101' },
      { day_of_week: 1, subject: 'Physics', start_time: '11:00', end_time: '12:30', location: 'Lab 2' },
      { day_of_week: 2, subject: 'Chemistry', start_time: '09:00', end_time: '10:30', location: 'Room 202' },
      { day_of_week: 3, subject: 'History', start_time: '14:00', end_time: '15:30', location: 'Room 305' },
      { day_of_week: 4, subject: 'Biology', start_time: '10:00', end_time: '11:30', location: 'Lab 4' },
      { day_of_week: 5, subject: 'English', start_time: '13:00', end_time: '14:30', location: 'Room 408' },
    ];
    for (const entry of timetableEntries) {
      await client.query(`
        INSERT INTO timetable_entries (user_id, day_of_week, subject, start_time, end_time, location, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [userId, entry.day_of_week, entry.subject, entry.start_time, entry.end_time, entry.location]);
    }
    console.log('✅ Timetable entries created');

    // Opportunities
    const opportunities = [
      {
        title: 'Junior Software Developer',
        description: 'Build web applications for African startups.',
        age_min: 18,
        age_max: 28,
        skills_required: ['JavaScript', 'React', 'Node.js'],
        education_level: 'bachelors',
        application_link: 'https://techhub.ke/careers',
        category: 'Technology',
        type: 'job',
        is_verified: true,
        status: 'active',
      },
      {
        title: 'Data Science Intern',
        description: 'Analyze agricultural data using machine learning.',
        age_min: 20,
        age_max: 26,
        skills_required: ['Python', 'Pandas', 'Machine Learning'],
        education_level: 'masters',
        application_link: 'https://aiforafrica.com/internships',
        category: 'Data Science',
        type: 'internship',
        is_verified: true,
        status: 'active',
      },
    ];
    for (const opp of opportunities) {
      await client.query(`
        INSERT INTO opportunities (
          title, description, age_min, age_max,
          skills_required, education_level, application_link,
          category, type, is_verified, status, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [
        opp.title,
        opp.description,
        opp.age_min,
        opp.age_max,
        opp.skills_required,
        opp.education_level,
        opp.application_link,
        opp.category,
        opp.type,
        opp.is_verified,
        opp.status,
        userId
      ]);
    }
    console.log('✅ Opportunities created');

    console.log('🎉 Demo seeding complete!');
    await client.end();
  } catch (error) {
    console.error('❌ Seed error:', error);
    await client.end();
    process.exit(1);
  }
}

seed();