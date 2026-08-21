// backend/src/controllers/institutionController.js
import db from '../config/db.js';
import { parse } from 'csv-parse/sync'; // npm install csv-parse

// ---------- Dashboard ----------
export const getDashboard = async (req, res) => {
  const institutionId = req.user.institution_id;
  if (!institutionId) {
    return res.status(403).json({ error: 'User not linked to an institution' });
  }
  try {
    // Stats
    const totalStudents = await db.query('SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role = $2', [institutionId, 'student']);
    const totalTeachers = await db.query('SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role = $2', [institutionId, 'teacher']);
    const totalGroups = await db.query('SELECT COUNT(*) FROM academic_groups WHERE institution_id = $1', [institutionId]);
    const totalResources = await db.query('SELECT COUNT(*) FROM resources WHERE target_type = $1 AND target_id = $2', ['institution', institutionId]);
    
    // Students list with group details
    const students = await db.query(`
      SELECT u.id, u.full_name, u.username, u.email, u.education_level, u.year_of_study,
             ag.name as group_name, ag.type as group_type
      FROM users u
      LEFT JOIN academic_groups ag ON u.academic_group_id = ag.id
      WHERE u.institution_id = $1 AND u.role = 'student'
      ORDER BY u.full_name
    `, [institutionId]);

    // Teachers list with assigned groups
    const teachers = await db.query(`
      SELECT u.id, u.full_name, u.email,
             COALESCE(
               (SELECT json_agg(json_build_object('group_id', ag.id, 'group_name', ag.name, 'group_type', ag.type))
                FROM teacher_assignments ta
                JOIN academic_groups ag ON ta.academic_group_id = ag.id
                WHERE ta.teacher_id = u.id
               ), '[]'::json
             ) as assigned_groups
      FROM users u
      WHERE u.institution_id = $1 AND u.role = 'teacher'
      ORDER BY u.full_name
    `, [institutionId]);

    // Groups (courses/classes)
    const groups = await db.query(`
      SELECT id, name, type, education_level, parent_group_id
      FROM academic_groups
      WHERE institution_id = $1
      ORDER BY type, name
    `, [institutionId]);

    // Announcements (for the dashboard)
    const announcements = await db.query(`
      SELECT a.*, u.full_name as author_name
      FROM institution_announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.institution_id = $1
      ORDER BY a.created_at DESC
      LIMIT 5
    `, [institutionId]);

    res.json({
      stats: {
        totalStudents: parseInt(totalStudents.rows[0].count),
        totalTeachers: parseInt(totalTeachers.rows[0].count),
        totalGroups: parseInt(totalGroups.rows[0].count),
        totalResources: parseInt(totalResources.rows[0].count),
      },
      students: students.rows,
      teachers: teachers.rows,
      groups: groups.rows,
      announcements: announcements.rows,
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Update Student's Group ----------
export const updateStudentGroup = async (req, res) => {
  const { studentId, academicGroupId, educationLevel, yearOfStudy } = req.body;
  const institutionId = req.user.institution_id;
  try {
    // Verify student belongs to this institution
    const check = await db.query(
      'SELECT id FROM users WHERE id = $1 AND institution_id = $2 AND role = $3',
      [studentId, institutionId, 'student']
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Student not found or not in your institution' });
    }
    await db.query(
      `UPDATE users SET academic_group_id = $1, education_level = $2, year_of_study = $3
       WHERE id = $4`,
      [academicGroupId, educationLevel, yearOfStudy, studentId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('updateStudentGroup error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Student StudySphere ----------
export const getStudentStudySphere = async (req, res) => {
  const userId = req.user.id;
  try {
    const userData = await db.query(
      'SELECT institution_id, academic_group_id, education_level FROM users WHERE id = $1',
      [userId]
    );
    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { institution_id, academic_group_id, education_level } = userData.rows[0];
    
    // Get timetable for the student's group
    let timetable = [];
    if (academic_group_id) {
      const timetableRes = await db.query(
        `SELECT * FROM timetables WHERE academic_group_id = $1 ORDER BY day_of_week, start_time`,
        [academic_group_id]
      );
      timetable = timetableRes.rows;
    }
    
    // Get resources for the student's group and institution
    const resourcesRes = await db.query(`
      SELECT * FROM resources
      WHERE (target_type = 'institution' AND target_id = $1)
         OR (target_type = 'academic_group' AND target_id = $2)
      ORDER BY created_at DESC
    `, [institution_id, academic_group_id || 0]);
    
    // Get announcements for the institution
    const announcementsRes = await db.query(
      `SELECT * FROM institution_announcements
       WHERE institution_id = $1
       ORDER BY created_at DESC`,
      [institution_id]
    );
    
    res.json({
      timetable,
      resources: resourcesRes.rows,
      announcements: announcementsRes.rows,
    });
  } catch (err) {
    console.error('getStudentStudySphere error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Groups (Academic) ----------
export const createGroup = async (req, res) => {
  const { name, type, educationLevel, parentGroupId } = req.body;
  const institutionId = req.user.institution_id;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO academic_groups (institution_id, name, type, education_level, parent_group_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [institutionId, name, type, educationLevel || null, parentGroupId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createGroup error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name, type, educationLevel, parentGroupId } = req.body;
  const institutionId = req.user.institution_id;
  try {
    const result = await db.query(
      `UPDATE academic_groups SET name = $1, type = $2, education_level = $3, parent_group_id = $4
       WHERE id = $5 AND institution_id = $6 RETURNING *`,
      [name, type, educationLevel, parentGroupId, id, institutionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found or not in your institution' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateGroup error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteGroup = async (req, res) => {
  const { id } = req.params;
  const institutionId = req.user.institution_id;
  try {
    const result = await db.query(
      `DELETE FROM academic_groups WHERE id = $1 AND institution_id = $2 RETURNING id`,
      [id, institutionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('deleteGroup error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Timetable ----------
export const createTimetableEntry = async (req, res) => {
  const { academicGroupId, day, startTime, endTime, subject, teacherId, room } = req.body;
  const institutionId = req.user.institution_id;
  if (!academicGroupId || !day || !startTime || !endTime || !subject) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const groupCheck = await db.query(
      'SELECT id FROM academic_groups WHERE id = $1 AND institution_id = $2',
      [academicGroupId, institutionId]
    );
    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid academic group' });
    }
    const result = await db.query(
      `INSERT INTO timetables (academic_group_id, day_of_week, start_time, end_time, subject, teacher_id, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [academicGroupId, day, startTime, endTime, subject, teacherId || null, room || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createTimetableEntry error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const uploadTimetableCSV = async (req, res) => {
  const institutionId = req.user.institution_id;
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }
  try {
    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
    });
    let inserted = 0;
    for (const row of records) {
      const { group_id, day, start_time, end_time, subject, teacher_id, room } = row;
      if (!group_id || !day || !start_time || !end_time || !subject) continue;
      const groupCheck = await db.query(
        'SELECT id FROM academic_groups WHERE id = $1 AND institution_id = $2',
        [group_id, institutionId]
      );
      if (groupCheck.rows.length === 0) continue;
      await db.query(
        `INSERT INTO timetables (academic_group_id, day_of_week, start_time, end_time, subject, teacher_id, room)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [group_id, day, start_time, end_time, subject, teacher_id || null, room || null]
      );
      inserted++;
    }
    res.json({ success: true, inserted });
  } catch (err) {
    console.error('uploadTimetableCSV error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getTimetableByGroup = async (req, res) => {
  const { groupId } = req.params;
  const institutionId = req.user.institution_id;
  try {
    const groupCheck = await db.query(
      'SELECT id FROM academic_groups WHERE id = $1 AND institution_id = $2',
      [groupId, institutionId]
    );
    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid group' });
    }
    const result = await db.query(
      `SELECT t.*, u.full_name as teacher_name
       FROM timetables t
       LEFT JOIN users u ON t.teacher_id = u.id
       WHERE t.academic_group_id = $1
       ORDER BY t.day_of_week, t.start_time`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTimetableByGroup error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Resources ----------
export const createResource = async (req, res) => {
  const { targetType, targetId, title, description, fileUrl, resourceType } = req.body;
  const userId = req.user.id;
  const institutionId = req.user.institution_id;
  if (!targetType || !targetId || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  let valid = false;
  if (targetType === 'institution') {
    valid = parseInt(targetId) === institutionId;
  } else if (targetType === 'academic_group') {
    const check = await db.query(
      'SELECT id FROM academic_groups WHERE id = $1 AND institution_id = $2',
      [targetId, institutionId]
    );
    valid = check.rows.length > 0;
  }
  if (!valid) {
    return res.status(403).json({ error: 'Invalid target' });
  }
  try {
    const result = await db.query(
      `INSERT INTO resources (target_type, target_id, title, description, file_url, resource_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [targetType, targetId, title, description || '', fileUrl || '', resourceType || 'file', userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createResource error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getResources = async (req, res) => {
  const { targetType, targetId } = req.params;
  const institutionId = req.user.institution_id;
  try {
    const result = await db.query(
      `SELECT r.*, u.full_name as uploaded_by_name
       FROM resources r
       LEFT JOIN users u ON r.uploaded_by = u.id
       WHERE r.target_type = $1 AND r.target_id = $2
       ORDER BY r.created_at DESC`,
      [targetType, targetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getResources error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Announcements ----------
export const createAnnouncement = async (req, res) => {
  const { title, content, targetRoles } = req.body;
  const userId = req.user.id;
  const institutionId = req.user.institution_id;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO institution_announcements (institution_id, author_id, title, content, target_roles)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [institutionId, userId, title, content, targetRoles || ['student']]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getAnnouncements = async (req, res) => {
  const institutionId = req.user.institution_id;
  try {
    const result = await db.query(
      `SELECT a.*, u.full_name as author_name
       FROM institution_announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.institution_id = $1
       ORDER BY a.created_at DESC`,
      [institutionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAnnouncements error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Teacher Assignments ----------
export const assignTeacher = async (req, res) => {
  const { teacherId, academicGroupId } = req.body;
  const institutionId = req.user.institution_id;
  if (!teacherId || !academicGroupId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const teacherCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND institution_id = $2 AND role = $3',
      [teacherId, institutionId, 'teacher']
    );
    if (teacherCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid teacher' });
    }
    const groupCheck = await db.query(
      'SELECT id FROM academic_groups WHERE id = $1 AND institution_id = $2',
      [academicGroupId, institutionId]
    );
    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid academic group' });
    }
    await db.query(
      `INSERT INTO teacher_assignments (teacher_id, academic_group_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [teacherId, academicGroupId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('assignTeacher error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const removeTeacherAssignment = async (req, res) => {
  const { teacherId, academicGroupId } = req.params;
  const institutionId = req.user.institution_id;
  try {
    const result = await db.query(
      `DELETE FROM teacher_assignments
       WHERE teacher_id = $1 AND academic_group_id = $2
       AND EXISTS (SELECT 1 FROM academic_groups WHERE id = $2 AND institution_id = $3)`,
      [teacherId, academicGroupId, institutionId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('removeTeacherAssignment error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getHierarchy = async (req, res) => {
  const institutionId = req.user.institution_id;
  try {
    const result = await db.query(
      `SELECT id, name, type, parent_group_id FROM academic_groups 
       WHERE institution_id = $1
       ORDER BY type, name`,
      [institutionId]
    );
    // Build tree
    const map = {};
    const roots = [];
    result.rows.forEach(g => { map[g.id] = { ...g, children: [] }; });
    result.rows.forEach(g => {
      if (g.parent_group_id && map[g.parent_group_id]) {
        map[g.parent_group_id].children.push(map[g.id]);
      } else {
        roots.push(map[g.id]);
      }
    });
    res.json(roots);
  } catch (err) {
    console.error('getHierarchy error:', err);
    res.status(500).json({ error: err.message });
  }
};