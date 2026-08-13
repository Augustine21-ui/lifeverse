import db from '../config/db.js';

// ---- Onboarding ----
export const getCountries = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, code FROM countries ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

export const getInstitutions = async (req, res) => {
  try {
    const { search, countryId } = req.query;
    let query = 'SELECT id, name, type, country_id FROM institutions WHERE 1=1';
    const params = [];
    if (search) {
      query += ' AND name ILIKE $1';
      params.push(`%${search}%`);
    }
    if (countryId) {
      query += ` AND country_id = $${params.length + 1}`;
      params.push(countryId);
    }
    query += ' ORDER BY name LIMIT 20';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
};

export const getCurricula = async (req, res) => {
  try {
    const { countryId, educationLevel } = req.query;
    let query = 'SELECT id, name, country_id, education_level FROM curricula WHERE 1=1';
    const params = [];
    if (countryId) {
      query += ' AND country_id = $1';
      params.push(countryId);
    }
    if (educationLevel) {
      query += ` AND education_level = $${params.length + 1}`;
      params.push(educationLevel);
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch curricula' });
  }
};

export const saveAcademicInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      countryId, educationLevel, institutionId, curriculumId,
      gradeFormYear, courseDegree, studentNumber, admissionNumber,
      registrationNumber, preferredSubjects, learningGoals,
      dailyStudyHours, reminderPreferences
    } = req.body;

    await db.query(
      `INSERT INTO student_academic_info (
        user_id, country_id, education_level, institution_id,
        curriculum_id, grade_form_year, course_degree, student_number,
        admission_number, registration_number, preferred_subjects,
        learning_goals, daily_study_hours, reminder_preferences
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id) DO UPDATE SET
        country_id = EXCLUDED.country_id,
        education_level = EXCLUDED.education_level,
        institution_id = EXCLUDED.institution_id,
        curriculum_id = EXCLUDED.curriculum_id,
        grade_form_year = EXCLUDED.grade_form_year,
        course_degree = EXCLUDED.course_degree,
        student_number = EXCLUDED.student_number,
        admission_number = EXCLUDED.admission_number,
        registration_number = EXCLUDED.registration_number,
        preferred_subjects = EXCLUDED.preferred_subjects,
        learning_goals = EXCLUDED.learning_goals,
        daily_study_hours = EXCLUDED.daily_study_hours,
        reminder_preferences = EXCLUDED.reminder_preferences`,
      [userId, countryId, educationLevel, institutionId,
        curriculumId, gradeFormYear, courseDegree, studentNumber,
        admissionNumber, registrationNumber, preferredSubjects,
        learningGoals, dailyStudyHours, reminderPreferences]
    );

    res.json({ success: true, message: 'Academic info saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save academic info' });
  }
};

export const getAcademicInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM student_academic_info WHERE user_id = $1`,
      [userId]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch academic info' });
  }
};

// ---- Subjects ----
export const getSubjects = async (req, res) => {
  try {
    const { curriculumId } = req.query;
    let query = 'SELECT id, name, code, description FROM subjects';
    const params = [];
    if (curriculumId) {
      query += ' WHERE curriculum_id = $1';
      params.push(curriculumId);
    }
    query += ' ORDER BY name';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

// ---- Topics ----
export const getTopics = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const result = await db.query(
      'SELECT id, name, description FROM topics WHERE subject_id = $1 ORDER BY order_index, name',
      [subjectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
};

// ---- Materials ----
export const uploadMaterial = async (req, res) => {
  try {
    const {
      title, type, subjectId, topicId,
      filePath, fileName, fileSize, contentText
    } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `INSERT INTO academic_materials (
        title, type, subject_id, topic_id, uploader_id,
        file_path, file_name, file_size, content_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [title, type, subjectId, topicId, userId,
        filePath, fileName, fileSize, contentText]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload material' });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const { subjectId, topicId, type } = req.query;
    let query = `SELECT am.*, u.full_name as uploader_name,
                 s.name as subject_name, t.name as topic_name
                 FROM academic_materials am
                 LEFT JOIN users u ON am.uploader_id = u.id
                 LEFT JOIN subjects s ON am.subject_id = s.id
                 LEFT JOIN topics t ON am.topic_id = t.id
                 WHERE 1=1`;
    const params = [];
    if (subjectId) {
      query += ' AND am.subject_id = $1';
      params.push(subjectId);
    }
    if (topicId) {
      query += ` AND am.topic_id = $${params.length + 1}`;
      params.push(topicId);
    }
    if (type) {
      query += ` AND am.type = $${params.length + 1}`;
      params.push(type);
    }
    query += ' ORDER BY am.uploaded_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

// ---- Assignments ----
export const createAssignment = async (req, res) => {
  try {
    const { title, description, subjectId, topicId, dueDate } = req.body;
    const userId = req.user.id;
    const result = await db.query(
      `INSERT INTO assignments (title, description, subject_id, topic_id, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, description, subjectId, topicId, userId, dueDate]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT a.*, s.name as subject_name, u.full_name as teacher_name
       FROM assignments a
       LEFT JOIN subjects s ON a.subject_id = s.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.is_published = TRUE
       ORDER BY a.due_date ASC LIMIT 10`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// ---- Timetable ----
export const getTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT te.*, s.name as subject_name
       FROM timetable_entries te
       LEFT JOIN subjects s ON te.subject_id = s.id
       WHERE te.user_id = $1 OR te.institution_id = (
         SELECT institution_id FROM student_academic_info WHERE user_id = $1
       )
       ORDER BY te.day_of_week, te.start_time`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};