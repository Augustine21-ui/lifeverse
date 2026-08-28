// backend/src/controllers/libraryController.js
import { query } from '../db.js';

// ─── Categories ──────────────────────────────────────────────────────

export const getCategories = async (req, res) => {
  const userId = req.user.id;
  try {
    // Get user's institution_id (if any)
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    
    let result;
    if (institution_id) {
      // Institution user - get their institution's categories
      result = await query(
        `SELECT * FROM library_categories 
         WHERE institution_id = $1 
         ORDER BY parent_id NULLS FIRST, name`,
        [institution_id]
      );
    } else {
      // Student - get all public categories from their institution via academic groups
      // First find the student's institution through their academic groups
      const instRes = await query(
        `SELECT ag.institution_id 
         FROM user_academic_groups uag
         JOIN academic_groups ag ON uag.academic_group_id = ag.id
         WHERE uag.user_id = $1
         LIMIT 1`,
        [userId]
      );
      if (instRes.rows.length === 0) {
        return res.json([]);
      }
      const studentInstId = instRes.rows[0].institution_id;
      result = await query(
        `SELECT * FROM library_categories 
         WHERE institution_id = $1 
         ORDER BY parent_id NULLS FIRST, name`,
        [studentInstId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req, res) => {
  const userId = req.user.id;
  const { name, description, parent_id } = req.body;
  try {
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Only institution users can create categories' });
    
    const result = await query(
      `INSERT INTO library_categories (institution_id, name, description, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [institution_id, name, description, parent_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Only institution users can delete categories' });
    
    const bookCheck = await query('SELECT id FROM library_books WHERE category_id = $1', [id]);
    if (bookCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with books. Move or delete books first.' });
    }
    
    await query('DELETE FROM library_categories WHERE id = $1 AND institution_id = $2', [id, institution_id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Books ───────────────────────────────────────────────────────────

export const getBooks = async (req, res) => {
  const userId = req.user.id;
  const { category, subject, search, course } = req.query;
  try {
    // Get user's institution_id
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    
    let institutionId = institution_id;
    
    // If student (no institution_id), get from academic_groups
    if (!institutionId) {
      const instRes = await query(
        `SELECT ag.institution_id 
         FROM user_academic_groups uag
         JOIN academic_groups ag ON uag.academic_group_id = ag.id
         WHERE uag.user_id = $1
         LIMIT 1`,
        [userId]
      );
      if (instRes.rows.length > 0) {
        institutionId = instRes.rows[0].institution_id;
      } else {
        return res.json([]);
      }
    }
    
    let sql = `
      SELECT b.*, 
             c.name as category_name,
             p.current_page, p.percentage, p.is_finished, p.last_read_at
      FROM library_books b
      LEFT JOIN library_categories c ON b.category_id = c.id
      LEFT JOIN library_read_progress p ON p.book_id = b.id AND p.user_id = $1
      WHERE b.institution_id = $2 AND b.is_approved = true
    `;
    const params = [userId, institutionId];
    let paramIndex = 3;
    
    if (category) {
      sql += ` AND b.category_id = $${paramIndex++}`;
      params.push(parseInt(category));
    }
    if (subject) {
      sql += ` AND b.subject = $${paramIndex++}`;
      params.push(subject);
    }
    if (course) {
      sql += ` AND b.course_id = $${paramIndex++}`;
      params.push(parseInt(course));
    }
    if (search) {
      sql += ` AND (b.title ILIKE $${paramIndex++} OR b.author ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex+1})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }
    
    sql += ` ORDER BY b.title ASC`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getBook = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT b.*, c.name as category_name,
              p.current_page, p.percentage, p.is_finished, p.last_read_at
       FROM library_books b
       LEFT JOIN library_categories c ON b.category_id = c.id
       LEFT JOIN library_read_progress p ON p.book_id = b.id AND p.user_id = $1
       WHERE b.id = $2`,
      [userId, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createBook = async (req, res) => {
  const userId = req.user.id;
  const { title, author, description, file_url, cover_image_url, subject, course_id, unit, pages, category_id } = req.body;
  try {
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Only institution users can upload books' });
    
    const result = await query(
      `INSERT INTO library_books 
       (institution_id, category_id, title, author, description, file_url, cover_image_url, 
        subject, course_id, unit, pages, uploaded_by, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [institution_id, category_id || null, title, author || null, description || null, 
       file_url, cover_image_url || null, subject || null, course_id || null, 
       unit || null, pages || null, userId, true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateBook = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, author, description, file_url, cover_image_url, subject, course_id, unit, pages, category_id } = req.body;
  try {
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Only institution users can update books' });
    
    const result = await query(
      `UPDATE library_books SET
        title = COALESCE($1, title),
        author = COALESCE($2, author),
        description = COALESCE($3, description),
        file_url = COALESCE($4, file_url),
        cover_image_url = COALESCE($5, cover_image_url),
        subject = COALESCE($6, subject),
        course_id = COALESCE($7, course_id),
        unit = COALESCE($8, unit),
        pages = COALESCE($9, pages),
        category_id = COALESCE($10, category_id),
        updated_at = NOW()
       WHERE id = $11 AND institution_id = $12 RETURNING *`,
      [title, author, description, file_url, cover_image_url, subject, course_id, unit, pages, category_id, id, institution_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteBook = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    if (!institution_id) return res.status(403).json({ error: 'Only institution users can delete books' });
    
    await query('DELETE FROM library_books WHERE id = $1 AND institution_id = $2', [id, institution_id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Reading Progress ───────────────────────────────────────────────

export const updateProgress = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { current_page } = req.body;
  try {
    const bookRes = await query('SELECT pages FROM library_books WHERE id = $1', [id]);
    if (bookRes.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    const totalPages = bookRes.rows[0].pages || 100;
    
    const percentage = Math.round((current_page / totalPages) * 100);
    const is_finished = percentage >= 100;
    
    const result = await query(
      `INSERT INTO library_read_progress (user_id, book_id, current_page, total_pages, percentage, is_finished, last_read_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, book_id) DO UPDATE SET
        current_page = EXCLUDED.current_page,
        percentage = EXCLUDED.percentage,
        is_finished = EXCLUDED.is_finished,
        last_read_at = NOW()
       RETURNING *`,
      [userId, id, current_page, totalPages, percentage, is_finished]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getProgress = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT * FROM library_read_progress WHERE user_id = $1 AND book_id = $2`,
      [userId, id]
    );
    if (result.rows.length === 0) {
      return res.json({ current_page: 1, percentage: 0, is_finished: false });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Bookmarks ──────────────────────────────────────────────────────

export const getBookmarks = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT * FROM library_bookmarks WHERE user_id = $1 AND book_id = $2 ORDER BY page_number`,
      [userId, id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const createBookmark = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { page_number, note } = req.body;
  try {
    const result = await query(
      `INSERT INTO library_bookmarks (user_id, book_id, page_number, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, book_id, page_number) DO UPDATE SET note = EXCLUDED.note
       RETURNING *`,
      [userId, id, page_number, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteBookmark = async (req, res) => {
  const userId = req.user.id;
  const { id, bookmarkId } = req.params;
  try {
    await query(
      'DELETE FROM library_bookmarks WHERE id = $1 AND user_id = $2 AND book_id = $3',
      [bookmarkId, userId, id]
    );
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Continue Reading ──────────────────────────────────────────────

export const getContinueReading = async (req, res) => {
  const userId = req.user.id;
  try {
    // Get user's institution_id
    const userRes = await query('SELECT institution_id FROM users WHERE id = $1', [userId]);
    const institution_id = userRes.rows[0]?.institution_id;
    
    let institutionId = institution_id;
    if (!institutionId) {
      const instRes = await query(
        `SELECT ag.institution_id 
         FROM user_academic_groups uag
         JOIN academic_groups ag ON uag.academic_group_id = ag.id
         WHERE uag.user_id = $1
         LIMIT 1`,
        [userId]
      );
      if (instRes.rows.length > 0) {
        institutionId = instRes.rows[0].institution_id;
      } else {
        return res.json([]);
      }
    }
    
    const result = await query(
      `SELECT b.*, p.current_page, p.percentage, p.is_finished, p.last_read_at
       FROM library_books b
       JOIN library_read_progress p ON p.book_id = b.id
       WHERE p.user_id = $1 AND p.is_finished = false
       AND b.institution_id = $2
       ORDER BY p.last_read_at DESC`,
      [userId, institutionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};