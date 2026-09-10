// frontend/src/context/MoodContext.jsx
import { createContext, useContext, useState, useRef, useCallback } from 'react';

const MoodContext = createContext(null);

// ─── Mood rules ────────────────────────────────────────────────────
// Maps events to moods. Add more as features grow.
const EVENT_TO_MOOD = {
  'task-complete': 'happy',
  'focus-complete': 'focused',
  'orbit-start': 'excited',      // user clicked a suggestion / started orbit
  'orbit-pass': 'happy',         // passed a challenge
  'orbit-fail': 'neutral',       // failed → back to neutral
  'progress-up': 'excited',      // progress % increased significantly
  'level-up': 'happy',           // leveled up
  'idle': 'neutral',             // default
};

// How long each mood lasts before auto-reset to neutral (ms)
const MOOD_DURATIONS = {
  happy: 90 * 1000,       // 1.5 min
  excited: 60 * 1000,     // 1 min
  focused: 120 * 1000,    // 2 min
  neutral: 0,             // no auto-reset needed
  calm: 120 * 1000,
  thinking: 60 * 1000,
  celebrating: 30 * 1000,
  sad: 90 * 1000,
};

export function MoodProvider({ children }) {
  const [mood, setMoodState] = useState('neutral');
  const resetTimerRef = useRef(null);

  // Core setter with auto-reset
  const setMood = useCallback((newMood, customDuration) => {
    // Clear any pending reset
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setMoodState(newMood);

    // Skip auto-reset for neutral
    if (newMood === 'neutral') return;

    const duration = customDuration ?? MOOD_DURATIONS[newMood] ?? 90000;
    resetTimerRef.current = setTimeout(() => {
      setMoodState('neutral');
      resetTimerRef.current = null;
    }, duration);
  }, []);

  // Trigger by event name (used everywhere in the app)
  const triggerMood = useCallback((eventName, overrides = {}) => {
    const targetMood = overrides.mood || EVENT_TO_MOOD[eventName] || 'neutral';
    setMood(targetMood, overrides.duration);
  }, [setMood]);

  // Reset to neutral immediately
  const resetMood = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setMoodState('neutral');
  }, []);

  return (
    <MoodContext.Provider value={{ mood, setMood, triggerMood, resetMood }}>
      {children}
    </MoodContext.Provider>
  );
}

// Hook
export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) {
    throw new Error('useMood must be used within a <MoodProvider>');
  }
  return ctx;
}