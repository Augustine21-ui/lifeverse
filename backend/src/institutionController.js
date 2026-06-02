import { query } from './db.js';

export const getActiveInstitutions = async (req, res) => {
  try {
    const result = await query(
      'SELECT name FROM institutions WHERE subscription_status = $1 AND subscription_end_date > NOW()',
      ['active']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};