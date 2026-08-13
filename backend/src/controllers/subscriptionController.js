// backend/src/controllers/subscriptionController.js
import db from '../config/db.js';
import Stripe from 'stripe';
import { 
  TIER_PRICES, 
  TRIAL_DAYS, 
  TIER_FEATURES, 
  getTierDescription,
  getUserAccess,
  TRIAL_TIERS
} from '../services/subscriptionService.js';

// ✅ FIX: Conditional Stripe initialization
let stripe = null;
const stripeEnabled = process.env.STRIPE_SECRET_KEY && 
                     process.env.STRIPE_SECRET_KEY !== 'your_stripe_secret_key_here' &&
                     process.env.STRIPE_SECRET_KEY.startsWith('sk_');

if (stripeEnabled) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully');
} else {
  console.log('ℹ️ Stripe disabled - running in bypass mode');
  console.log(`   BYPASS_PAYMENT: ${process.env.BYPASS_PAYMENT || 'false'}`);
}

// Helper function to check if Stripe is available
const isStripeAvailable = () => {
  return stripe !== null && stripeEnabled;
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      { id: 'free', name: 'Free', price: 0, features: TIER_FEATURES.free },
      { id: 'plus', name: 'Plus', price: 1, features: TIER_FEATURES.plus },
      { id: 'pro', name: 'Pro', price: 2, features: TIER_FEATURES.pro },
      { id: 'premium', name: 'Premium', price: 3, features: TIER_FEATURES.premium },
      { id: 'ultimate', name: 'Ultimate', price: 4, features: TIER_FEATURES.ultimate }
    ];
    res.json(plans);
  } catch (err) {
    console.error('Plans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;
    const price = TIER_PRICES[tier];
    
    if (!price) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Check if BYPASS_PAYMENT is enabled OR Stripe is not available
    if (process.env.BYPASS_PAYMENT === 'true' || !isStripeAvailable()) {
      console.log(`ℹ️ Bypass mode: Upgrading user ${userId} to ${tier}`);
      
      await db.query(
        `UPDATE users 
         SET subscription_tier = $1, 
             subscription_end_date = NOW() + INTERVAL '1 month',
             subscription_status = 'active'
         WHERE id = $2`,
        [tier, userId]
      );
      
      await db.query(
        `INSERT INTO user_subscriptions (user_id, tier, amount, status)
         VALUES ($1, $2, $3, 'active')`,
        [userId, tier, TIER_PRICES[tier] / 100]
      );
      
      return res.json({ 
        success: true, 
        message: `Upgraded to ${tier} (bypass mode)`,
        bypass: true,
        tier: tier
      });
    }

    // Normal Stripe flow
    const userResult = await db.query(
      'SELECT trial_used FROM users WHERE id = $1',
      [userId]
    );
    const hasUsedTrial = userResult.rows[0]?.trial_used || false;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `LifeVerse ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
            description: getTierDescription(tier),
          },
          unit_amount: price * 100,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      ...(hasUsedTrial ? {} : {
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
        },
      }),
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        tier: tier,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleStripeWebhook = async (req, res) => {
  // If Stripe is not available, just acknowledge
  if (!isStripeAvailable()) {
    console.log('ℹ️ Webhook received but Stripe is disabled');
    return res.json({ received: true, bypass: true });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.client_reference_id;
      const tier = session.metadata.tier;
      
      const userResult = await db.query(
        'SELECT trial_used FROM users WHERE id = $1',
        [userId]
      );
      const hasUsedTrial = userResult.rows[0]?.trial_used || false;
      
      await db.query(
        `UPDATE users 
         SET subscription_tier = $1, 
             subscription_end_date = NOW() + INTERVAL '1 month',
             subscription_status = 'active',
             stripe_customer_id = $2,
             stripe_subscription_id = $3,
             trial_used = CASE WHEN $4 THEN trial_used ELSE TRUE END
         WHERE id = $5`,
        [tier, session.customer, session.subscription, hasUsedTrial, userId]
      );
      
      await db.query(
        `INSERT INTO user_subscriptions (user_id, tier, amount, stripe_payment_id, status, is_trial)
         VALUES ($1, $2, $3, $4, 'active', $5)`,
        [userId, tier, TIER_PRICES[tier] / 100, session.payment_intent, !hasUsedTrial]
      );
      
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await db.query(
        `UPDATE users SET subscription_status = 'canceled' WHERE stripe_subscription_id = $1`,
        [subscription.id]
      );
      break;
  }

  res.json({ received: true });
};

export const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const access = await getUserAccess(userId);
    res.json(access);
  } catch (err) {
    console.error('Subscription fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier } = req.body;
    
    if (!TRIAL_TIERS.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier for trial' });
    }
    
    const userResult = await db.query(
      'SELECT trial_used FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows[0]?.trial_used) {
      return res.status(400).json({ 
        error: 'You have already used your free trial. Please subscribe to continue.' 
      });
    }
    
    await db.query(
      `UPDATE users 
       SET subscription_tier = $1,
           trial_start_date = NOW(),
           trial_end_date = NOW() + INTERVAL '12 days',
           trial_used = TRUE,
           subscription_status = 'trial'
       WHERE id = $2`,
      [tier, userId]
    );
    
    await db.query(
      `INSERT INTO user_subscriptions (user_id, tier, amount, status, is_trial)
       VALUES ($1, $2, $3, 'trial', TRUE)`,
      [userId, tier, 0]
    );
    
    res.json({ 
      success: true, 
      message: `Free trial started! You have 12 days of ${tier} access.`,
      trialEndDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
    });
  } catch (err) {
    console.error('Trial start error:', err);
    res.status(500).json({ error: 'Failed to start free trial' });
  }
};

export const getTrialStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const access = await getUserAccess(userId);
    res.json(access);
  } catch (err) {
    console.error('Trial status error:', err);
    res.status(500).json({ error: 'Failed to get trial status' });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const access = await getUserAccess(userId);
    
    // Also check institutional subscription
    const userResult = await db.query(
      'SELECT institution, institution_subscription_valid FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0] || {};
    
    res.json({
      ...access,
      isInstitutional: user.institution_subscription_valid || false,
      institution: user.institution || null,
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};