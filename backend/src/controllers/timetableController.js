// backend/src/controllers/timetableController.js
import { query } from '../db.js';

// ─── STUDENT VIEW ────────────────────────────────────────────────

// Get student's timetable for today
export const getMyTimetable = async (req, res) => {
  const userId = req.user.id;
  try {
    const classRes = await query(
      `SELECT ag.id FROM user_academic_groups uag 
       JOIN academic_groups ag ON uag.academic_group_id = ag.id
       WHERE uag.user_id = $1 AND ag.type = 'class'`,
      [userId]
    );
    if (classRes.rows.length === 0) {
      return res.status(404).json({ error: 'No class assigned' });
    }
    const classId = classRes.rows[0].id;
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const result = await query(
      `SELECT te.*, u.full_name as teacher_name, r.name as room_name, c.name as course_name
       FROM timetable_entries te
       LEFT JOIN users u ON te.teacher_id = u.id
       LEFT JOIN rooms r ON te.room_id = r.id
       LEFT JOIN courses c ON te.course_id = c.id
       WHERE te.class_id = $1
       AND (te.is_recurring = TRUE AND te.day_of_week = $2
            OR (te.is_recurring = FALSE AND $3 BETWEEN te.start_date AND te.end_date))
       ORDER BY te.start_time`,
      [classId, dayOfWeek, today]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get student's timetable for a specific day
export const getMyDay = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;
  try {
    const classRes = await query(
      `SELECT ag.id FROM user_academic_groups uag 
       JOIN academic_groups ag ON uag.academic_group_id = ag.id
       WHERE uag.user_id = $1 AND ag.type = 'class'`,
      [userId]
    );
    if (classRes.rows.length === 0) return res.status(404).json({ error: 'No class assigned' });
    const classId = classRes.rows[0].id;
    const dayOfWeek = new Date(date).getDay();
    const result = await query(
      `SELECT te.*, u.full_name as teacher_name, r.name as room_name, c.name as course_name
       FROM timetable_entries te
       LEFT JOIN users u ON te.teacher_id = u.id
       LEFT JOIN rooms r ON te.room_id = r.id
       LEFT JOIN courses c ON te.course_id = c.id
       WHERE te.class_id = $1
       AND (te.is_recurring = TRUE AND te.day_of_week = $2
            OR (te.is_recurring = FALSE AND $3 BETWEEN te.start_date AND te.end_date))
       ORDER BY te.start_time`,
      [classId, dayOfWeek, date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get student's timetable for a week
export const getMyWeek = async (req, res) => {
  const userId = req.user.id;
  const { startDate } = req.params;
  try {
    const classRes = await query(
      `SELECT ag.id FROM user_academic_groups uag 
       JOIN academic_groups ag ON uag.academic_group_id = ag.id
       WHERE uag.user_id = $1 AND ag.type = 'class'`,
      [userId]
    );
    if (classRes.rows.length === 0) return res.status(404).json({ error: 'No class assigned' });
    const classId = classRes.rows[0].id;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const result = await query(
      `SELECT te.*, u.full_name as teacher_name, r.name as room_name, c.name as course_name
       FROM timetable_entries te
       LEFT JOIN users u ON te.teacher_id = u.id
       LEFT JOIN rooms r ON te.room_id = r.id
       LEFT JOIN courses c ON te.course_id = c.id
       WHERE te.class_id = $1
       AND (
         (te.is_recurring = TRUE AND te.day_of_week BETWEEN $2 AND $3)
         OR (te.is_recurring = FALSE AND te.start_date <= $4 AND te.end_date >= $5)
       )
       ORDER BY te.day_of_week, te.start_time`,
      [classId, start.getDay(), end.getDay(), end.toISOString().split('T')[0], start.toISOString().split('T')[0]]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get student's timetable for a month
export const getMyMonth = async (req, res) => {
  const userId = req.user.id;
  const { year, month } = req.params;
  try {
    const classRes = await query(
      `SELECT ag.id FROM user_academic_groups uag 
       JOIN academic_groups ag ON uag.academic_group_id = ag.id
       WHERE uag.user_id = $1 AND ag.type = 'class'`,
      [userId]
    );
    if (classRes.rows.length === 0) return res.status(404).json({ error: 'No class assigned' });
    const classId = classRes.rows[0].id;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const result = await query(
      `SELECT te.*, u.full_name as teacher_name, r.name as room_name, c.name as course_name
       FROM timetable_entries te
       LEFT JOIN users u ON te.teacher_id = u.id
       LEFT JOIN rooms r ON te.room_id = r.id
       LEFT JOIN courses c ON te.course_id = c.id
       WHERE te.class_id = $1
       AND (
         (te.is_recurring = TRUE)
         OR (te.is_recurring = FALSE AND te.start_date <= $2 AND te.end_date >= $3)
       )
       ORDER BY te.day_of_week, te.start_time`,
      [classId, end.toISOString().split('T')[0], start.toISOString().split('T')[0]]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── INSTITUTION MANAGEMENT ──────────────────────────────────────

export const getInstitutionTimetable = async (req, res) => {
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const instId = instRes.rows[0]?.institution_id;
    if (!instId) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `SELECT te.*, u.full_name as teacher_name, r.name as room_name, c.name as course_name,
              ag.name as class_name
       FROM timetable_entries te
       LEFT JOIN users u ON te.teacher_id = u.id
       LEFT JOIN rooms r ON te.room_id = r.id
       LEFT JOIN courses c ON te.course_id = c.id
       LEFT JOIN academic_groups ag ON te.class_id = ag.id
       WHERE te.institution_id = $1
       ORDER BY te.day_of_week, te.start_time`,
      [instId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createTimetableEntry = async (req, res) => {
  const userId = req.user.id;
  const { class_id, course_id, teacher_id, room_id, day_of_week, start_time, end_time, start_date, end_date, is_recurring, semester } = req.body;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `INSERT INTO timetable_entries 
       (institution_id, class_id, course_id, teacher_id, room_id, day_of_week, start_time, end_time, start_date, end_date, is_recurring, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [institution_id, class_id, course_id, teacher_id, room_id, day_of_week, start_time, end_time, start_date, end_date, is_recurring ?? true, semester]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTimetableEntry = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { class_id, course_id, teacher_id, room_id, day_of_week, start_time, end_time, start_date, end_date, is_recurring, semester } = req.body;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `UPDATE timetable_entries SET
        class_id = COALESCE($1, class_id),
        course_id = COALESCE($2, course_id),
        teacher_id = COALESCE($3, teacher_id),
        room_id = COALESCE($4, room_id),
        day_of_week = COALESCE($5, day_of_week),
        start_time = COALESCE($6, start_time),
        end_time = COALESCE($7, end_time),
        start_date = COALESCE($8, start_date),
        end_date = COALESCE($9, end_date),
        is_recurring = COALESCE($10, is_recurring),
        semester = COALESCE($11, semester),
        updated_at = NOW()
       WHERE id = $12 AND institution_id = $13
       RETURNING *`,
      [class_id, course_id, teacher_id, room_id, day_of_week, start_time, end_time, start_date, end_date, is_recurring, semester, id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteTimetableEntry = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      'DELETE FROM timetable_entries WHERE id = $1 AND institution_id = $2 RETURNING id',
      [id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── ROOMS ────────────────────────────────────────────────────────

export const getRooms = async (req, res) => {
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query('SELECT * FROM rooms WHERE institution_id = $1 ORDER BY name', [institution_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createRoom = async (req, res) => {
  const userId = req.user.id;
  const { name, capacity, building, floor } = req.body;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `INSERT INTO rooms (institution_id, name, capacity, building, floor)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [institution_id, name, capacity, building, floor]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, capacity, building, floor } = req.body;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `UPDATE rooms SET
        name = COALESCE($1, name),
        capacity = COALESCE($2, capacity),
        building = COALESCE($3, building),
        floor = COALESCE($4, floor)
       WHERE id = $5 AND institution_id = $6
       RETURNING *`,
      [name, capacity, building, floor, id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      'DELETE FROM rooms WHERE id = $1 AND institution_id = $2 RETURNING id',
      [id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── COURSES ──────────────────────────────────────────────────────

export const getCourses = async (req, res) => {
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query('SELECT * FROM courses WHERE institution_id = $1 ORDER BY name', [institution_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createCourse = async (req, res) => {
  const userId = req.user.id;
  const { name, code, description } = req.body;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `INSERT INTO courses (institution_id, name, code, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [institution_id, name, code, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, code, description } = req.body;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `UPDATE courses SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description)
       WHERE id = $4 AND institution_id = $5
       RETURNING *`,
      [name, code, description, id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      'DELETE FROM courses WHERE id = $1 AND institution_id = $2 RETURNING id',
      [id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── TEACHERS ──────────────────────────────────────────────────────

export const getTeachers = async (req, res) => {
  const userId = req.user.id;
  try {
    const instRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = instRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Not an institution user' });
    const result = await query(
      `SELECT id, full_name, email FROM users 
       WHERE institution_id = $1 AND role = 'teacher'`,
      [institution_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};