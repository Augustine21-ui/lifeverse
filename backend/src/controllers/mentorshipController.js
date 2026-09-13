// backend/src/controllers/mentorshipController.js
// ✅ NEW - Phase D mentorship flow

import db from '../config/db.js';

// ─── List available mentors ────────────────────────────────
export const listMentors = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.id, m.user_id, m.expertise, m.bio, m.years_experience,
              u.full_name, u.username, u.avatar_url
       FROM mentors m
       JOIN users u ON u.id = m.user_id
       WHERE m.is_available = true
       ORDER BY m.years_experience DESC NULLS LAST
       LIMIT 50`
    );
    res.json({ success: true, mentors: result.rows });
  } catch (err) {
    console.error('listMentors error:', err);
    res.json({ success: true, mentors: [] });
  }
};

// ─── Request mentorship (Phase D: focus mood) ─────────────
export const requestMentorship = async (req, res) => {
  try {
    const menteeId = req.user.id;
    const { mentorId, topic } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }

    // Prevent self-mentorship
    if (Number(mentorId) === Number(menteeId)) {
      return res.status(400).json({ error: 'You cannot mentor yourself' });
    }

    // Check duplicate
    const existing = await db.query(
      `SELECT * FROM mentorship_links
       WHERE mentor_id = $1 AND mentee_id = $2 AND status IN ('pending', 'active')`,
      [mentorId, menteeId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Mentorship already requested' });
    }

    const inserted = await db.query(
      `INSERT INTO mentorship_links
         (mentor_id, mentee_id, status, topic, created_at, updated_at)
       VALUES ($1, $2, 'pending', $3, NOW(), NOW())
       RETURNING *`,
      [mentorId, menteeId, topic || null]
    );

    res.status(201).json({
      success: true,
      link: inserted.rows[0],
      moodEvent: 'mentorship-request',   // → excited
    });
  } catch (err) {
    console.error('requestMentorship error:', err);
    res.status(500).json({ error: 'Failed to request mentorship' });
  }
};

// ─── Accept mentorship (mentor accepts) ───────────────────
export const acceptMentorship = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const linkId = req.params.id;

    const updated = await db.query(
      `UPDATE mentorship_links
       SET status = 'active',
           started_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND mentor_id = $2
       RETURNING *`,
      [linkId, mentorId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Mentorship not found or not yours' });
    }

    res.json({
      success: true,
      link: updated.rows[0],
      moodEvent: 'mentorship-linked',   // → focused (both sides)
    });
  } catch (err) {
    console.error('acceptMentorship error:', err);
    res.status(500).json({ error: 'Failed to accept mentorship' });
  }
};

// ─── My mentors / mentees ─────────────────────────────────
export const getMyMentorships = async (req, res) => {
  try {
    const userId = req.user.id;

    const [asMentor, asMentee] = await Promise.all([
      db.query(
        `SELECT ml.*, u.full_name as mentee_name, u.username as mentee_username
         FROM mentorship_links ml
         JOIN users u ON u.id = ml.mentee_id
         WHERE ml.mentor_id = $1
         ORDER BY ml.created_at DESC`,
        [userId]
      ),
      db.query(
        `SELECT ml.*, u.full_name as mentor_name, u.username as mentor_username
         FROM mentorship_links ml
         JOIN users u ON u.id = ml.mentor_id
         WHERE ml.mentee_id = $1
         ORDER BY ml.created_at DESC`,
        [userId]
      ),
    ]);

    res.json({
      success: true,
      asMentor: asMentor.rows,
      asMentee: asMentee.rows,
    });
  } catch (err) {
    console.error('getMyMentorships error:', err);
    res.json({ success: true, asMentor: [], asMentee: [] });
  }
};

// ─── Register as mentor (optional onboarding) ─────────────
export const registerAsMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { expertise, bio, years_experience } = req.body;

    const existing = await db.query(
      `SELECT * FROM mentors WHERE user_id = $1`,
      [userId]
    );

    let row;
    if (existing.rows.length > 0) {
      const updated = await db.query(
        `UPDATE mentors
         SET expertise = $1, bio = $2, years_experience = $3, is_available = true
         WHERE user_id = $4
         RETURNING *`,
        [expertise, bio, years_experience || 0, userId]
      );
      row = updated.rows[0];
    } else {
      const inserted = await db.query(
        `INSERT INTO mentors (user_id, expertise, bio, years_experience, is_available, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         RETURNING *`,
        [userId, expertise, bio, years_experience || 0]
      );
      row = inserted.rows[0];
    }

    res.json({ success: true, mentor: row });
  } catch (err) {
    console.error('registerAsMentor error:', err);
    res.status(500).json({ error: 'Failed to register mentor' });
  }
};