// frontend/src/context/MoodContext.jsx
import { createContext, useContext, useState, useRef, useCallback } from 'react';

const MoodContext = createContext(null);

// ─── Event → Mood mapping (per architecture diagram) ──────
const EVENT_TO_MOOD = {
  // Learning events
  'task-complete': 'happy',
  'focus-complete': 'focused',
  'orbit-start': 'excited',
  'orbit-pass': 'happy',             // Passed but no level up
  'orbit-fail': 'calm',              // Failed (<50%) → calm + retry
  'level-up': 'celebrating',         // Passed + leveled up
  'goal-complete': 'celebrating',    // Phase C
  'goal-progress': 'celebrating',    // Phase C
  'skill-complete': 'celebrating',   // Phase C
  'weakness-detected': 'calm',
  'mentorship-linked': 'focused',
  'opportunity-approved': 'celebrating',
  'progress-up': 'excited',
  'idle': 'neutral',
};

const MOOD_DURATIONS = {
  happy: 90 * 1000,       // 1.5 min
  excited: 60 * 1000,     // 1 min
  focused: 120 * 1000,    // 2 min
  celebrating: 45 * 1000, // 45 s
  calm: 150 * 1000,       // 2.5 min (longer to encourage retry)
  thinking: 60 * 1000,
  sad: 90 * 1000,
  neutral: 0,
};

export function MoodProvider({ children }) {
  const [mood, setMoodState] = useState('neutral');
  const [context, setContext] = useState({ eventName: null, meta: {} });
  const resetTimerRef = useRef(null);

  const setMood = useCallback((newMood, customDuration) => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setMoodState(newMood);
    if (newMood === 'neutral') return;
    const duration = customDuration ?? MOOD_DURATIONS[newMood] ?? 90000;
    resetTimerRef.current = setTimeout(() => {
      setMoodState('neutral');
      setContext({ eventName: null, meta: {} });
      resetTimerRef.current = null;
    }, duration);
  }, []);

  const triggerMood = useCallback((eventName, meta = {}) => {
    const targetMood = meta.mood || EVENT_TO_MOOD[eventName] || 'neutral';
    setContext({ eventName, meta });
    setMood(targetMood, meta.duration);
  }, [setMood]);

  const resetMood = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setMoodState('neutral');
    setContext({ eventName: null, meta: {} });
  }, []);

  return (
    <MoodContext.Provider value={{ mood, context, setMood, triggerMood, resetMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used within a <MoodProvider>');
  return ctx;
}