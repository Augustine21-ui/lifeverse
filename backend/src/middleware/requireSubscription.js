// backend/src/middleware/requireSubscription.js
import db from '../config/db.js';

export const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user subscription status
    const result = await db.query(
      `SELECT 
        subscription_plan, 
        trial_end_date, 
        subscription_end_date,
        institution_subscription_valid
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const now = new Date();
    let hasAccess = false;
    
    // Check access based on subscription type
    if (user.institution_subscription_valid) {
      // Institutional subscription - always active
      hasAccess = true;
    } else if (user.subscription_plan === 'trial' && user.trial_end_date) {
      // Trial subscription - check if still valid
      hasAccess = new Date(user.trial_end_date) > now;
    } else if (user.subscription_plan === 'basic' || user.subscription_plan === 'premium') {
      // Paid plans - check subscription end date
      hasAccess = user.subscription_end_date && new Date(user.subscription_end_date) > now;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Subscription required. Please subscribe to access this feature.',
        subscription_required: true 
      });
    }
    
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};