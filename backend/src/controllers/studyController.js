// backend/src/controllers/studyController.js
import { query } from '../db.js';

// ─── Notes ──────────────────────────────────────────────────────────

export const getNotes = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT * FROM study_notes WHERE user_id = $1 ORDER BY pinned DESC, updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createNote = async (req, res) => {
  const userId = req.user.id;
  const { title, content, subject, topic, tags, pinned, material_id } = req.body;
  try {
    const result = await query(
      `INSERT INTO study_notes (user_id, title, content, subject, topic, tags, pinned, material_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, title, content, subject || null, topic || null, tags || [], pinned || false, material_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateNote = async (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;
  const { title, content, subject, topic, tags, pinned, material_id } = req.body;
  try {
    const result = await query(
      `UPDATE study_notes SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        subject = COALESCE($3, subject),
        topic = COALESCE($4, topic),
        tags = COALESCE($5, tags),
        pinned = COALESCE($6, pinned),
        material_id = COALESCE($7, material_id),
        updated_at = NOW()
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [title, content, subject, topic, tags, pinned, material_id, noteId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteNote = async (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;
  try {
    const result = await query(
      'DELETE FROM study_notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: err.message });
  }
};

export const pinNote = async (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;
  const { pinned } = req.body;
  try {
    const result = await query(
      `UPDATE study_notes SET pinned = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [pinned, noteId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error pinning note:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Highlights ──────────────────────────────────────────────────────

export const getHighlights = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT * FROM highlights WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching highlights:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createHighlight = async (req, res) => {
  const userId = req.user.id;
  const { material_id, content, page_position } = req.body;
  try {
    const result = await query(
      `INSERT INTO highlights (user_id, material_id, content, page_position)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, material_id || null, content, page_position || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating highlight:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Bookmarks ──────────────────────────────────────────────────────

export const getBookmarks = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createBookmark = async (req, res) => {
  const userId = req.user.id;
  const { material_id, url, title } = req.body;
  try {
    const result = await query(
      `INSERT INTO bookmarks (user_id, material_id, url, title)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, material_id || null, url || null, title || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating bookmark:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteBookmark = async (req, res) => {
  const userId = req.user.id;
  const bookmarkId = req.params.id;
  try {
    const result = await query(
      'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id',
      [bookmarkId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bookmark not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting bookmark:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Current Study Context ──────────────────────────────────────────

export const getCurrentStudy = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT subject, topic, grade, learning_style 
       FROM user_study_context 
       WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.json({ subject: null, topic: null, grade: null, learning_style: null });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching current study:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateCurrentStudy = async (req, res) => {
  const userId = req.user.id;
  const { subject, topic, grade, learning_style } = req.body;
  try {
    // Check if exists
    const existing = await query(
      'SELECT id FROM user_study_context WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length === 0) {
      // Insert
      const result = await query(
        `INSERT INTO user_study_context (user_id, subject, topic, grade, learning_style)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, subject, topic, grade, learning_style]
      );
      return res.json(result.rows[0]);
    } else {
      // Update
      const result = await query(
        `UPDATE user_study_context SET
          subject = COALESCE($1, subject),
          topic = COALESCE($2, topic),
          grade = COALESCE($3, grade),
          learning_style = COALESCE($4, learning_style),
          updated_at = NOW()
         WHERE user_id = $5 RETURNING *`,
        [subject, topic, grade, learning_style, userId]
      );
      return res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating current study:', err);
    res.status(500).json({ error: err.message });
  }
};