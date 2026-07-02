import db from '../config/db.js';

// ---------- Dashboard Stats ----------
export const getStats = async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const activeUsers = await db.query("SELECT COUNT(*) FROM users WHERE is_active = true");
    const newUsersToday = await db.query("SELECT COUNT(*) FROM users WHERE created_at::date = NOW()::date");
    const totalSchools = await db.query('SELECT COUNT(DISTINCT institution) FROM users WHERE institution IS NOT NULL');
    const activeSubscriptions = await db.query('SELECT COUNT(*) FROM subscriptions WHERE is_active = true AND (end_date IS NULL OR end_date > NOW())');

    const usersByRole = await db.query('SELECT role, COUNT(*) FROM users GROUP BY role');
    const usersByInstitution = await db.query('SELECT institution, COUNT(*) FROM users WHERE institution IS NOT NULL GROUP BY institution ORDER BY COUNT DESC LIMIT 10');

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count),
      newUsersToday: parseInt(newUsersToday.rows[0].count),
      totalSchools: parseInt(totalSchools.rows[0].count),
      activeSubscriptions: parseInt(activeSubscriptions.rows[0].count),
      usersByRole: usersByRole.rows,
      usersByInstitution: usersByInstitution.rows,
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Performance Metrics ----------
export const getPerformance = async (req, res) => {
  try {
    // Average XP per user
    const avgXp = await db.query('SELECT AVG(xp) FROM users');
    // Total tasks completed
    const tasksCompleted = await db.query('SELECT COUNT(*) FROM tasks WHERE is_completed = true');
    // Total challenges completed
    const challengesCompleted = await db.query("SELECT COUNT(*) FROM user_challenges WHERE status = 'approved'");
    // Active users last 7 days (dummy – you need to track last_login or activity)
    const activeLast7Days = await db.query("SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '7 days'");
    // Top learners by XP
    const topLearners = await db.query('SELECT full_name, username, xp FROM users ORDER BY xp DESC LIMIT 10');

    res.json({
      avgXp: parseFloat(avgXp.rows[0].avg) || 0,
      tasksCompleted: parseInt(tasksCompleted.rows[0].count),
      challengesCompleted: parseInt(challengesCompleted.rows[0].count),
      activeLast7Days: parseInt(activeLast7Days.rows[0].count),
      topLearners: topLearners.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Announcements ----------
export const getAnnouncements = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createAnnouncement = async (req, res) => {
  const { title, content, target_roles } = req.body;
  const userId = req.user.id;
  try {
    const result = await db.query(
      `INSERT INTO announcements (author_id, title, content, target_roles)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, content, target_roles]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
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