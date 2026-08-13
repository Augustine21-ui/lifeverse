// frontend/src/hooks/useSubscription.js
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useSubscription() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (typeof api.getSubscriptionStatus !== 'function') {
          console.warn('getSubscriptionStatus API method not available');
          setStatus({ isActive: false, plan: 'none' });
          setLoading(false);
          return;
        }
        const data = await api.getSubscriptionStatus();
        setStatus(data);
      } catch (err) {
        console.error('Failed to get subscription status:', err);
        setStatus({ isActive: false, plan: 'none' });
      } finally {
        setLoading(false);
      }
    };
    checkSubscription();
  }, []);

  return { status, loading };
}