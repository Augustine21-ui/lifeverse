// frontend/src/components/AnimatedAvatar.jsx
import { useState, useEffect } from 'react';
import * as LottieReact from 'lottie-react';

// Safely get the Lottie component (handles both default and named exports)
const Lottie = LottieReact.default || LottieReact;

// ─── Fallback: generate a simple bouncing emoji animation ──────────
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
    // For now, we always use the fallback (emoji) – you can replace with real JSON later.
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
  }, [state]);

  if (!animationData) {
    return (
      <div
        className={`cursor-pointer ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-2xl">
          😊
        </div>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {Lottie ? (
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
          {state === 'idle' ? '😊' : '😄'}
        </div>
      )}
      {isFallback && (
        <div className="text-[8px] text-white/20 text-center mt-0.5">(demo)</div>
      )}
    </div>
  );
}