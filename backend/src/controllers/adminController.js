// backend/src/controllers/adminController.js
import db from '../config/db.js';

// ---------- Dashboard Stats ----------
export const getStats = async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    
    // Try to get active users, fallback to 0 if column missing
    let activeUsers = 0;
    try {
      const res = await db.query("SELECT COUNT(*) FROM users WHERE is_active = true");
      activeUsers = parseInt(res.rows[0].count);
    } catch (err) {
      // Column doesn't exist, fallback to total users or 0
      console.warn('is_active column missing, setting activeUsers to 0');
      activeUsers = 0;
    }

    const newUsersToday = await db.query("SELECT COUNT(*) FROM users WHERE created_at::date = NOW()::date");
    const totalSchools = await db.query('SELECT COUNT(DISTINCT institution) FROM users WHERE institution IS NOT NULL');
    
    // Similarly for subscriptions – handle gracefully
    let activeSubscriptions = 0;
    try {
      const res = await db.query('SELECT COUNT(*) FROM subscriptions WHERE is_active = true AND (end_date IS NULL OR end_date > NOW())');
      activeSubscriptions = parseInt(res.rows[0].count);
    } catch (err) {
      console.warn('subscriptions table or column missing, setting activeSubscriptions to 0');
    }

    const usersByRole = await db.query('SELECT role, COUNT(*) FROM users GROUP BY role');
    const usersByInstitution = await db.query(
      'SELECT institution, COUNT(*) FROM users WHERE institution IS NOT NULL GROUP BY institution ORDER BY COUNT DESC LIMIT 10'
    );

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeUsers,
      newUsersToday: parseInt(newUsersToday.rows[0].count),
      totalSchools: parseInt(totalSchools.rows[0].count),
      activeSubscriptions,
      usersByRole: usersByRole.rows,
      usersByInstitution: usersByInstitution.rows,
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- User Management ----------
export const getUsers = async (req, res) => {
  try {
    const { role, search, institution, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      where += ` AND role = $${paramIndex++}`;
      params.push(role);
    }
    if (institution) {
      where += ` AND institution = $${paramIndex++}`;
      params.push(institution);
    }
    if (search) {
      where += ` AND (full_name ILIKE $${paramIndex++} OR username ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = await db.query(`SELECT COUNT(*) FROM users WHERE ${where}`, params);
    const total = parseInt(countQuery.rows[0].count);

    const query = `
      SELECT id, full_name, username, email, role, institution, xp, level, created_at, is_active, last_login
      FROM users WHERE ${where}
      ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const users = await db.query(query, params);
    res.json({ users: users.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, username, email, role, institution, is_active } = req.body;
  try {
    const result = await db.query(
      `UPDATE users SET full_name = $1, username = $2, email = $3, role = $4, institution = $5, is_active = $6
       WHERE id = $7 RETURNING *`,
      [full_name, username, email, role, institution, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Subscription Management ----------
export const getSubscriptions = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    let paramIndex = 1;

    if (status === 'active') {
      where += ` AND is_active = true AND (end_date IS NULL OR end_date > NOW())`;
    } else if (status === 'expired') {
      where += ` AND (is_active = false OR end_date < NOW())`;
    }
    if (search) {
      where += ` AND institution_name ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    const countQuery = await db.query(`SELECT COUNT(*) FROM subscriptions WHERE ${where}`, params);
    const total = parseInt(countQuery.rows[0].count);

    const query = `
      SELECT * FROM subscriptions WHERE ${where}
      ORDER BY end_date ASC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const subs = await db.query(query, params);
    res.json({ subscriptions: subs.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getSubscriptions error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { plan, end_date, is_active } = req.body;
  try {
    const result = await db.query(
      `UPDATE subscriptions SET plan = $1, end_date = $2, is_active = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [plan, end_date, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateSubscription error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createSubscription = async (req, res) => {
  const { institution_name, plan, end_date } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO subscriptions (institution_name, plan, end_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [institution_name, plan, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createSubscription error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Performance Metrics ----------
export const getPerformance = async (req, res) => {
  try {
    // Average XP per user
    const avgXp = await db.query('SELECT AVG(xp) FROM users');
    
    // Total tasks completed – use orbit_sessions if tasks table doesn't exist
    let tasksCompleted = 0;
    try {
      const tasksRes = await db.query("SELECT COUNT(*) FROM orbit_sessions WHERE status = 'completed'");
      tasksCompleted = parseInt(tasksRes.rows[0].count);
    } catch (err) {
      // Fallback: if table doesn't exist, keep 0
      console.warn('orbit_sessions table not found – tasksCompleted set to 0');
    }

    // Total challenges completed – use orbit_challenges if user_challenges doesn't exist
    let challengesCompleted = 0;
    try {
      const challengesRes = await db.query("SELECT COUNT(*) FROM orbit_challenges WHERE status = 'completed'");
      challengesCompleted = parseInt(challengesRes.rows[0].count);
    } catch (err) {
      console.warn('orbit_challenges table not found – challengesCompleted set to 0');
    }

    // Active users last 7 days (needs `last_login` column)
    let activeLast7Days = 0;
    try {
      const activeRes = await db.query("SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '7 days'");
      activeLast7Days = parseInt(activeRes.rows[0].count);
    } catch (err) {
      console.warn('last_login column missing – activeLast7Days set to 0');
    }

    // Top learners by XP
    const topLearners = await db.query('SELECT full_name, username, xp FROM users ORDER BY xp DESC LIMIT 10');

    res.json({
      avgXp: parseFloat(avgXp.rows[0].avg) || 0,
      tasksCompleted,
      challengesCompleted,
      activeLast7Days,
      topLearners: topLearners.rows,
    });
  } catch (err) {
    console.error('getPerformance error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Announcements (using bridge_announcements) ----------
export const getAnnouncements = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.full_name as author_name 
      FROM bridge_announcements a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAnnouncements error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createAnnouncement = async (req, res) => {
  const { title, content, target_roles } = req.body;
  const userId = req.user.id;
  try {
    const result = await db.query(
      `INSERT INTO bridge_announcements (user_id, title, content, target_roles)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, content, target_roles]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- System Health ----------
export const getSystemHealth = (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
};