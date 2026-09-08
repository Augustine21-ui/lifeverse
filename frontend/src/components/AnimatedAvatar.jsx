// frontend/src/components/AnimatedAvatar.jsx
import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

// ─── Import animations (we'll provide placeholder JSON or you can download real ones) ───
// For now, we'll use a base64 fallback or you can import actual JSON files.
// We'll set up a mapping.

// Fallback: if no animation is loaded, we show a simple emoji or static image.
const FALLBACK_ANIMATION = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  layers: [
    {
      ty: 0,
      nm: "Circle",
      sr: 1,
      ks: {
        p: { a: 0, k: [100, 100, 0] },
        s: { a: 0, k: [100, 100, 100] },
        r: { a: 0, k: 0 },
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [100, 100] },
          s: { a: 0, k: [100, 100] },
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.2, 0.5, 1, 1] },
        },
      ],
    },
  ],
};

// ─── Map state to animation file ──────────────────────────────────────────
const ANIMATION_MAP = {
  idle: null,          // will use default bouncing animation
  wave: null,
  happy: null,
  thinking: null,
  focused: null,
  thumbsup: null,
  surprised: null,
  celebrating: null,
  sad: null,
  pointing: null,
};

// You can replace these `null` values with actual imports, e.g.:
// import idleAnimation from '../assets/animations/idle.json';
// Then assign: ANIMATION_MAP.idle = idleAnimation;

// ─── Simple fallback: generate a basic Lottie JSON for idle ────────────
// This is a minimal bouncing circle; you should replace with real animations.
const generateFallbackAnimation = (emoji = '😊') => ({
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  layers: [
    {
      ty: 0,
      nm: "Emoji",
      sr: 1,
      ks: {
        p: { a: 1, k: [{ t: 0, s: [100, 80, 0] }, { t: 30, s: [100, 120, 0] }, { t: 60, s: [100, 80, 0] }] },
        s: { a: 0, k: [100, 100, 100] },
        r: { a: 0, k: 0 },
      },
      shapes: [
        {
          ty: "tx",
          p: { a: 0, k: [100, 110] },
          s: { a: 0, k: [60, 60] },
          t: { a: 0, k: emoji },
        },
      ],
    },
  ],
});

// ─── Component ────────────────────────────────────────────────────────────
export default function AnimatedAvatar({ state = 'idle', size = 80, onClick, className = '' }) {
  const [animationData, setAnimationData] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    // Try to load the animation from the map; if not available, use fallback.
    const anim = ANIMATION_MAP[state];
    if (anim) {
      setAnimationData(anim);
      setIsFallback(false);
    } else {
      // Use fallback: show emoji based on state
      const emojiMap = {
        idle: '😊',
        wave: '👋',
        happy: '😄',
        thinking: '🤔',
        focused: '🧐',
        thumbsup: '👍',
        surprised: '😮',
        celebrating: '🎉',
        sad: '😢',
        pointing: '👉',
      };
      const emoji = emojiMap[state] || '😊';
      setAnimationData(generateFallbackAnimation(emoji));
      setIsFallback(true);
    }
  }, [state]);

  return (
    <div
      className={`cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
          }}
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-2xl">
          😊
        </div>
      )}
      {isFallback && (
        <div className="text-[8px] text-white/20 text-center mt-0.5">(demo)</div>
      )}
    </div>
  );
}