import db from './src/config/db.js';

async function createEventTables() {
  try {
    console.log('📦 Creating event tables...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS community_events (
        id SERIAL PRIMARY KEY,
        community_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        created_by INTEGER,
        rsvp_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ community_events table created');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'going',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      )
    `);
    console.log('✅ event_rsvps table created');
    
    console.log('🎉 Event tables created successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

createEventTables();