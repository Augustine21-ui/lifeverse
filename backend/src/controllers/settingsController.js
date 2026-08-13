import db from '../config/db.js';

export const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT 
        email_notifications, 
        dark_mode, 
        language, 
        daily_reminder, 
        weekly_report, 
        push_notifications
       FROM user_settings 
       WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        emailNotifications: true,
        darkMode: true,
        language: 'en',
        dailyReminder: '09:00',
        weeklyReport: true,
        pushNotifications: true
      });
    }
    
    const settings = result.rows[0];
    res.json({
      emailNotifications: settings.email_notifications,
      darkMode: settings.dark_mode,
      language: settings.language,
      dailyReminder: settings.daily_reminder,
      weeklyReport: settings.weekly_report,
      pushNotifications: settings.push_notifications
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      darkMode,
      language,
      dailyReminder,
      weeklyReport,
      pushNotifications
    } = req.body;
    
    await db.query(
      `INSERT INTO user_settings (
        user_id, email_notifications, dark_mode, language, 
        daily_reminder, weekly_report, push_notifications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        email_notifications = EXCLUDED.email_notifications,
        dark_mode = EXCLUDED.dark_mode,
        language = EXCLUDED.language,
        daily_reminder = EXCLUDED.daily_reminder,
        weekly_report = EXCLUDED.weekly_report,
        push_notifications = EXCLUDED.push_notifications,
        updated_at = NOW()`,
      [
        userId,
        emailNotifications !== undefined ? emailNotifications : true,
        darkMode !== undefined ? darkMode : true,
        language || 'en',
        dailyReminder || '09:00',
        weeklyReport !== undefined ? weeklyReport : true,
        pushNotifications !== undefined ? pushNotifications : true
      ]
    );
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};