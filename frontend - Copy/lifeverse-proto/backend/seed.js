import pool from './db.js';

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed badges
    const badges = [
      { name: 'First Step', description: 'Complete your first goal', icon: 'ti-footprint', color: 'green', xp_reward: 50, category: 'goals', requirement_type: 'goals_completed', requirement_value: 1 },
      { name: 'Goal Getter', description: 'Complete 5 goals', icon: 'ti-target', color: 'purple', xp_reward: 150, category: 'goals', requirement_type: 'goals_completed', requirement_value: 5 },
      { name: 'Overachiever', description: 'Complete 25 goals', icon: 'ti-trophy', color: 'amber', xp_reward: 500, category: 'goals', requirement_type: 'goals_completed', requirement_value: 25 },
      { name: 'Streak Starter', description: 'Maintain a 3-day streak', icon: 'ti-flame', color: 'coral', xp_reward: 75, category: 'streak', requirement_type: 'streak_days', requirement_value: 3 },
      { name: 'On Fire', description: 'Maintain a 7-day streak', icon: 'ti-flame', color: 'red', xp_reward: 200, category: 'streak', requirement_type: 'streak_days', requirement_value: 7 },
      { name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'ti-bolt', color: 'amber', xp_reward: 1000, category: 'streak', requirement_type: 'streak_days', requirement_value: 30 },
      { name: 'Social Butterfly', description: 'Join 3 communities', icon: 'ti-users', color: 'blue', xp_reward: 100, category: 'social', requirement_type: 'communities_joined', requirement_value: 3 },
      { name: 'Level Up!', description: 'Reach level 5', icon: 'ti-star', color: 'purple', xp_reward: 250, category: 'level', requirement_type: 'level_reached', requirement_value: 5 },
      { name: 'Scholar', description: 'Reach level 10', icon: 'ti-school', color: 'teal', xp_reward: 500, category: 'level', requirement_type: 'level_reached', requirement_value: 10 },
      { name: 'Contributor', description: 'Post in a community', icon: 'ti-message', color: 'green', xp_reward: 50, category: 'social', requirement_type: 'posts_made', requirement_value: 1 },
    ];

    for (const badge of badges) {
      await client.query(
        `INSERT INTO badges (name, description, icon, color, xp_reward, category, requirement_type, requirement_value)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [badge.name, badge.description, badge.icon, badge.color, badge.xp_reward, badge.category, badge.requirement_type, badge.requirement_value]
      );
    }

    // Seed official communities
    const communities = [
      { name: 'Mathematics Hub', description: 'Master maths from algebra to calculus. Share problems and solutions!', subject: 'Mathematics', icon: 'ti-math-function', banner_color: 'blue', is_official: true },
      { name: 'Science Lab', description: 'Explore physics, chemistry, and biology. Curious minds welcome!', subject: 'Science', icon: 'ti-flask', banner_color: 'green', is_official: true },
      { name: 'Literature Circle', description: 'Discuss books, writing, and language arts. Share your stories.', subject: 'English', icon: 'ti-book', banner_color: 'amber', is_official: true },
      { name: 'Code Academy', description: 'Learn programming together. Beginners to advanced coders welcome!', subject: 'Computer Science', icon: 'ti-code', banner_color: 'purple', is_official: true },
      { name: 'History Explorers', description: 'Journey through time. Discuss world history, events, and people.', subject: 'History', icon: 'ti-map', banner_color: 'coral', is_official: true },
      { name: 'Study Buddies', description: 'General study tips, motivation, and accountability. We grow together!', subject: 'General', icon: 'ti-users', banner_color: 'teal', is_official: true },
    ];

    for (const comm of communities) {
      await client.query(
        `INSERT INTO communities (name, description, subject, icon, banner_color, is_official)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [comm.name, comm.description, comm.subject, comm.icon, comm.banner_color, comm.is_official]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(console.error);