-- Countries
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL
);

-- Institutions (Schools/Universities)
CREATE TABLE IF NOT EXISTS institutions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'school', -- school, college, university
  country_id INTEGER REFERENCES countries(id),
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Curricula
CREATE TABLE IF NOT EXISTS curricula (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country_id INTEGER REFERENCES countries(id),
  education_level VARCHAR(50), -- primary, secondary, college, university
  description TEXT
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  curriculum_id INTEGER REFERENCES curricula(id),
  description TEXT
);

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

-- Academic Materials (PDFs, notes, assignments)
CREATE TABLE IF NOT EXISTS academic_materials (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- pdf, notes, assignment, worksheet, past_paper
  subject_id INTEGER REFERENCES subjects(id),
  topic_id INTEGER REFERENCES topics(id),
  uploader_id INTEGER REFERENCES users(id),
  institution_id INTEGER REFERENCES institutions(id),
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  content_text TEXT, -- extracted text for AI
  summary TEXT, -- AI-generated summary
  keywords TEXT[], -- AI-extracted keywords
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE
);

-- Student Academic Info (profile extension)
CREATE TABLE IF NOT EXISTS student_academic_info (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  country_id INTEGER REFERENCES countries(id),
  education_level VARCHAR(50),
  institution_id INTEGER REFERENCES institutions(id),
  curriculum_id INTEGER REFERENCES curricula(id),
  grade_form_year VARCHAR(50),
  course_degree VARCHAR(255),
  student_number VARCHAR(50),
  admission_number VARCHAR(50),
  registration_number VARCHAR(50),
  preferred_subjects TEXT[],
  learning_goals TEXT,
  daily_study_hours INTEGER,
  reminder_preferences JSONB
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  topic_id INTEGER REFERENCES topics(id),
  institution_id INTEGER REFERENCES institutions(id),
  created_by INTEGER REFERENCES users(id),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  is_published BOOLEAN DEFAULT TRUE
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP DEFAULT NOW(),
  file_path VARCHAR(500),
  content TEXT,
  grade FLOAT,
  feedback TEXT
);

-- Timetable
CREATE TABLE IF NOT EXISTS timetable_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  institution_id INTEGER REFERENCES institutions(id),
  subject_id INTEGER REFERENCES subjects(id),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  teacher_name VARCHAR(255),
  is_recurring BOOLEAN DEFAULT TRUE
);