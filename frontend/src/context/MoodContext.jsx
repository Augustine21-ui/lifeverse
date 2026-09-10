// frontend/src/context/MoodContext.jsx
import { createContext, useContext, useState, useRef, useCallback } from 'react';

const MoodContext = createContext(null);

// ─── Event → Mood mapping (updated per architecture diagram) ─────
const EVENT_TO_MOOD = {
  // Learning events
  'task-complete': 'happy',          // Task finished
  'focus-complete': 'focused',       // Focus session done
  'orbit-start': 'excited',          // Planet clicked / suggestion accepted
  'orbit-pass': 'happy',             // Passed an orbit challenge
  'orbit-fail': 'calm',              // ⬅️ CHANGED: fail → calm (diagram)
  'progress-up': 'excited',          // Progress milestone
  'level-up': 'celebrating',         // ⬅️ CHANGED: level up → celebrating
  'weakness-detected': 'calm',       // ⬅️ NEW: <50% detected
  'mentorship-linked': 'focused',    // ⬅️ NEW: mentorship matched
  'mentorship-request': 'excited',   // ⬅️ NEW: sent/received request
  'idle': 'neutral',
};

// Auto‑reset durations (ms)
const MOOD_DURATIONS = {
  happy: 90 * 1000,
  excited: 60 * 1000,
  focused: 120 * 1000,
  celebrating: 45 * 1000,
  calm: 150 * 1000,      // Calm lingers longer (weakness state)
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