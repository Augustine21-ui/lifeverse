import { getUserAccess } from '../services/subscriptionService.js';

export const checkFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const access = await getUserAccess(userId);
      
      // Admin always has access
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user has premium access
      if (!access.isActive && !access.isInstitutional) {
        return res.status(403).json({
          error: 'Subscription required',
          message: `Please subscribe to access ${featureName}`,
          subscription_required: true
        });
      }
      
      // Feature-specific checks
      const restrictedFeatures = ['Bridge', 'StudySphere', 'Assignments', 'Timetable'];
      
      if (restrictedFeatures.includes(featureName)) {
        // These features require institutional or premium access
        if (!access.isInstitutional && access.plan === 'trial' && access.daysRemaining <= 0) {
          return res.status(403).json({
            error: 'Trial expired',
            message: 'Your trial has expired. Please subscribe to continue.',
            subscription_required: true
          });
        }
      }
      
      next();
    } catch (err) {
      console.error('Feature access check error:', err);
      res.status(500).json({ error: 'Failed to check feature access' });
    }
  };
};