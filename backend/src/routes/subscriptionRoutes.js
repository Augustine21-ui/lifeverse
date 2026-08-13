import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { 
  getSubscriptionPlans, 
  createCheckoutSession, 
  handleStripeWebhook,
  getUserSubscription,
  getSubscriptionStatus,  // ← ADD THIS
  startFreeTrial,
  getTrialStatus
} from '../controllers/subscriptionController.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';

const router = express.Router();

// Public webhook (no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// All routes below require authentication
router.use(authenticate);

// === Subscription Status (for frontend) ===
router.get('/status', getSubscriptionStatus);  // ← ADD THIS - what frontend expects
router.get('/my-subscription', getUserSubscription);  // ← Keep this for backward compatibility
router.get('/trial-status', getTrialStatus);

// === Plans & Checkout ===
router.get('/plans', getSubscriptionPlans);
router.post('/create-checkout', createCheckoutSession);
router.post('/start-trial', startFreeTrial);

// === Feature Access Check ===
router.get('/feature/bridge', checkFeatureAccess('Bridge'), (req, res) => {
  res.json({ message: 'Bridge feature accessible' });
});

// === Institutional Subscription Check ===
router.get('/institution-status', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT 
        institution,
        institution_subscription_valid,
        subscription_tier,
        subscription_status
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      institution: user.institution,
      isInstitutional: user.institution_subscription_valid || false,
      subscriptionTier: user.subscription_tier,
      subscriptionStatus: user.subscription_status
    });
  } catch (err) {
    console.error('Institution status error:', err);
    res.status(500).json({ error: 'Failed to get institution status' });
  }
});

export default router;