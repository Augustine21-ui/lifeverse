import db from '../config/db.js';

// === TIER CONFIGURATION ===
export const TIER_PRICES = {
  free: 0,
  plus: 499,
  pro: 999,
  premium: 1999,
  ultimate: 4999
};

export const TRIAL_DAYS = 12;

export const TRIAL_TIERS = ['plus', 'pro', 'premium', 'ultimate'];

export const TIER_FEATURES = {
  free: {
    name: 'Free',
    description: 'Basic learning features',
    features: ['Orbit Access', 'Focus Timer', 'Tasks', 'Goals', 'Badges', 'Leaderboard']
  },
  plus: {
    name: 'Plus',
    description: 'Enhanced learning tools',
    features: ['All Free features', 'AI Tutor', 'Skills Dashboard', 'Social Buzz']
  },
  pro: {
    name: 'Pro',
    description: 'Advanced learning suite',
    features: ['All Plus features', 'StudySphere Access', 'Assignments', 'Timetable']
  },
  premium: {
    name: 'Premium',
    description: 'Complete learning platform',
    features: ['All Pro features', 'Bridge Access', 'Parent/Teacher Integration', 'Institutional Content']
  },
  ultimate: {
    name: 'Ultimate',
    description: 'Full institutional access',
    features: ['All Premium features', 'Custom Curriculum', 'Analytics', 'Teacher Dashboard']
  }
};

export const getTierDescription = (tier) => {
  return TIER_FEATURES[tier]?.description || 'Access to LifeVerse learning features';
};

// === USER ACCESS ===
export const getUserAccess = async (userId) => {
  try {
    const result = await db.query(
      `SELECT 
        subscription_tier, 
        subscription_status, 
        trial_start_date, 
        trial_end_date, 
        subscription_end_date,
        institution_subscription_valid
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { isActive: false, plan: 'none', status: 'inactive' };
    }
    
    const user = result.rows[0];
    const now = new Date();
    let isActive = false;
    let daysRemaining = 0;
    let plan = user.subscription_tier || 'none';
    let status = user.subscription_status || 'inactive';
    
    // 1. Check institutional subscription
    if (user.institution_subscription_valid) {
      return {
        isActive: true,
        plan: 'institutional',
        status: 'active',
        isInstitutional: true,
        daysRemaining: 'unlimited',
        tier: 'premium'
      };
    }
    
    // 2. Check trial
    if (status === 'trial' && user.trial_end_date) {
      const endDate = new Date(user.trial_end_date);
      isActive = endDate > now;
      daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      return {
        isActive,
        plan: 'trial',
        status: isActive ? 'trial' : 'expired',
        isInstitutional: false,
        daysRemaining,
        tier: user.subscription_tier || 'free'
      };
    }
    
    // 3. Check paid subscription
    if (status === 'active' && user.subscription_end_date) {
      const endDate = new Date(user.subscription_end_date);
      isActive = endDate > now;
      daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      return {
        isActive,
        plan: user.subscription_tier || 'basic',
        status: isActive ? 'active' : 'expired',
        isInstitutional: false,
        daysRemaining,
        tier: user.subscription_tier || 'basic'
      };
    }
    
    // 4. Free/default
    return {
      isActive: false,
      plan: 'none',
      status: 'inactive',
      isInstitutional: false,
      daysRemaining: 0,
      tier: 'none'
    };
  } catch (err) {
    console.error('getUserAccess error:', err);
    return { isActive: false, plan: 'none', status: 'inactive' };
  }
};

// === INSTITUTION SUBSCRIPTION CHECK ===
export const isInstitutionSubscribed = async (institutionName) => {
  try {
    const result = await db.query(
      'SELECT subscription_end_date FROM institutions WHERE LOWER(name) = LOWER($1)',
      [institutionName.trim()]
    );
    if (result.rows.length === 0) return false;
    const endDate = new Date(result.rows[0].subscription_end_date);
    return endDate > new Date();
  } catch (err) {
    console.error('isInstitutionSubscribed error:', err);
    return false;
  }
};