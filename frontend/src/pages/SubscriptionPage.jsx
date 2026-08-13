import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Check, Zap, Crown, Star, Sparkles, ArrowRight, Shield } from 'lucide-react';

const TIER_ICONS = {
  free: '😊',
  plus: '🚀',
  pro: '💎',
  premium: '👑',
  ultimate: '⭐'
};

const TIER_COLORS = {
  free: 'from-gray-600 to-gray-700',
  plus: 'from-blue-500 to-cyan-500',
  pro: 'from-purple-500 to-pink-500',
  premium: 'from-amber-500 to-yellow-500',
  ultimate: 'from-violet-500 to-indigo-600'
};

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [currentTier, setCurrentTier] = useState('free');
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadPlans();
    loadTrialStatus();
    if (user?.subscription_tier) {
      setCurrentTier(user.subscription_tier);
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      const data = await api.getSubscriptionPlans();
      // ✅ Ensure features is always an array
      const plansWithFeatures = data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : 
                  (plan.features?.features || [])
      }));
      setPlans(plansWithFeatures);
    } catch (err) {
      console.error('Failed to load plans:', err);
      showToast('Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTrialStatus = async () => {
    try {
      const data = await api.getTrialStatus();
      setTrialStatus(data);
    } catch (err) {
      console.error('Failed to load trial status:', err);
    }
  };

  const handleUpgrade = async (tier) => {
    if (tier === 'free') {
      showToast('You are already on the Free plan.', 'info');
      return;
    }

    setUpgrading(true);
    try {
      const data = await api.createCheckoutSession({ tier });
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        showToast(data.message, 'success');
        await refreshUser();
        loadTrialStatus();
      } else {
        showToast('Failed to create checkout session', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upgrade', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const startTrial = async (tier) => {
    try {
      const data = await api.startFreeTrial({ tier });
      showToast(data.message, 'success');
      await refreshUser();
      loadTrialStatus();
    } catch (err) {
      showToast(err.message || 'Failed to start trial', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Choose Your Learning Plan
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="mt-2">
            Upgrade to unlock more features and accelerate your learning journey.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Current plan: <span className="font-bold" style={{ color: 'var(--accent)' }}>{currentTier.toUpperCase()}</span>
          </p>
        </div>

        {/* Trial Banner */}
        {trialStatus?.isTrialActive && (
          <div className="card p-4 mb-6 border-2 border-green-500/30 bg-green-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-green-400 font-semibold">🎉 Free Trial Active!</h3>
                <p className="text-white/60 text-sm">
                  You have <span className="text-white font-bold">{trialStatus.daysRemaining}</span> days left on your {trialStatus.subscription_tier} plan.
                </p>
              </div>
              <button
                onClick={() => handleUpgrade(trialStatus.subscription_tier)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        )}

        {trialStatus?.canStartTrial && (
          <div className="card p-4 mb-6 border-2 border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-amber-400 font-semibold">🚀 Try Premium Free for 12 Days!</h3>
                <p className="text-white/60 text-sm">
                  Get full access to all features for 12 days. No payment required.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['plus', 'pro', 'premium', 'ultimate'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => startTrial(tier)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white text-sm capitalize"
                  >
                    Try {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isUpgrade = plan.id !== 'free' && plan.id !== currentTier;
            const isDowngrade = plan.id !== currentTier && !isUpgrade;
            
            // ✅ Safely get features array
            const features = Array.isArray(plan.features) ? plan.features : [];

            return (
              <div
                key={plan.id}
                className={`card p-6 text-center transition-all hover:scale-105 ${
                  isCurrent ? 'border-2 border-brand-500' : ''
                }`}
                style={{
                  background: isCurrent ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))' : 'var(--bg-card)'
                }}
              >
                <div className="text-4xl mb-2">{TIER_ICONS[plan.id] || '📚'}</div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                    ${plan.price}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>/month</span>
                </div>
                <ul className="mt-4 space-y-2 text-left">
                  {features.length > 0 ? (
                    features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No features listed
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading || isCurrent || isDowngrade}
                  className={`mt-6 w-full py-2 rounded-lg font-medium transition ${
                    isCurrent
                      ? 'bg-green-500/20 text-green-400 cursor-default'
                      : isDowngrade
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-brand-500 to-violet-600 text-white hover:opacity-90'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade Contact Support' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}