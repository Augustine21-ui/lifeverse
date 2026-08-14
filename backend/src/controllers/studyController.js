// backend/src/controllers/studyController.js
import db from '../config/db.js';

export const getCurrentStudy = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await db.query(
      'SELECT current_subject, current_topic FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        subject: '', 
        topic: '',
        progress: 0,
        mock: false
      });
    }
    
    const { current_subject, current_topic } = result.rows[0];
    res.json({ 
      subject: current_subject || '', 
      topic: current_topic || '',
      progress: 0,
      mock: false
    });
  } catch (err) {
    console.error('Get study error:', err);
    // Fallback to mock data on error
    res.json({
      subject: 'General Study',
      topic: 'Getting Started',
      progress: 0,
      mock: true,
      message: 'Using mock data - database error'
    });
  }
};

export const updateCurrentStudy = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { subject, topic } = req.body;
    
    await db.query(
      'UPDATE users SET current_subject = $1, current_topic = $2 WHERE id = $3',
      [subject || null, topic || null, userId]
    );
    
    res.json({ 
      success: true, 
      subject, 
      topic,
      mock: false
    });
  } catch (err) {
    console.error('Update study error:', err);
    res.status(500).json({ 
      error: 'Failed to update study context',
      message: err.message
    });
  }
};