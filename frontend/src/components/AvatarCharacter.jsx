// frontend/src/components/AvatarCharacter.jsx
import { useState, useEffect } from 'react';

const SKIN_COLOR = '#f5d0b8';
const HAIR_COLOR = '#8b6b4a';
const SHIRT_COLOR = '#4f8cf7';
const EYE_COLOR = '#2c3e50';

export default function AvatarCharacter({ state = 'idle', size = 80, onClick, className = '' }) {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    // Map state to animation class
    const animMap = {
      idle: 'bounce',
      wave: 'wave',
      happy: 'bounce',
      thinking: 'pulse',
      focused: 'pulse',
      thumbsup: 'none',
      surprised: 'bounce',
      celebrating: 'bounce',
      sad: 'none',
      pointing: 'none',
    };
    setAnimationClass(animMap[state] || '');
  }, [state]);

  // ─── SVG parts based on state ──────────────────────────────────────
  const getEyes = (state) => {
    switch (state) {
      case 'happy':
        return (
          <>
            {/* Happy: curved eyes */}
            <path d="M28 32 Q34 26 40 32" stroke={EYE_COLOR} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M48 32 Q54 26 60 32" stroke={EYE_COLOR} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Thinking: squinty eyes, tilted head */}
            <ellipse cx="34" cy="32" rx="4" ry="3" fill={EYE_COLOR} />
            <ellipse cx="54" cy="32" rx="4" ry="3" fill={EYE_COLOR} />
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Surprised: wide open eyes */}
            <ellipse cx="34" cy="30" rx="6" ry="7" fill="white" stroke={EYE_COLOR} strokeWidth="2" />
            <ellipse cx="34" cy="30" rx="3" ry="4" fill={EYE_COLOR} />
            <ellipse cx="54" cy="30" rx="6" ry="7" fill="white" stroke={EYE_COLOR} strokeWidth="2" />
            <ellipse cx="54" cy="30" rx="3" ry="4" fill={EYE_COLOR} />
          </>
        );
      case 'sad':
        return (
          <>
            {/* Sad: droopy eyes */}
            <ellipse cx="34" cy="32" rx="4" ry="3" fill={EYE_COLOR} />
            <ellipse cx="54" cy="32" rx="4" ry="3" fill={EYE_COLOR} />
            <path d="M30 36 Q40 34 50 36" stroke={EYE_COLOR} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M38 34 Q44 32 50 34" stroke={EYE_COLOR} strokeWidth="1" fill="none" opacity="0.3" />
          </>
        );
      case 'focused':
        return (
          <>
            {/* Focused: determined, straight eyes */}
            <rect x="28" y="30" width="10" height="4" rx="2" fill={EYE_COLOR} />
            <rect x="50" y="30" width="10" height="4" rx="2" fill={EYE_COLOR} />
          </>
        );
      default:
        // Idle / Neutral: normal eyes
        return (
          <>
            <ellipse cx="34" cy="32" rx="4" ry="4" fill={EYE_COLOR} />
            <ellipse cx="54" cy="32" rx="4" ry="4" fill={EYE_COLOR} />
          </>
        );
    }
  };

  const getMouth = (state) => {
    switch (state) {
      case 'happy':
        return <path d="M32 44 Q44 54 56 44" stroke={EYE_COLOR} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'surprised':
        return <ellipse cx="44" cy="46" rx="6" ry="7" fill="#e74c3c" stroke={EYE_COLOR} strokeWidth="1.5" />;
      case 'sad':
        return <path d="M32 48 Q44 40 56 48" stroke={EYE_COLOR} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'thinking':
        return <ellipse cx="44" cy="46" rx="4" ry="3" fill="none" stroke={EYE_COLOR} strokeWidth="1.5" />;
      default:
        return <path d="M32 46 Q44 52 56 46" stroke={EYE_COLOR} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    }
  };

  const getArms = (state) => {
    switch (state) {
      case 'wave':
        return (
          <>
            {/* Right arm waving */}
            <path d="M68 44 Q80 30 88 18" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M68 44 Q80 30 88 18" stroke="#c49b7d" strokeWidth="2" fill="none" opacity="0.3" />
            {/* Left arm down */}
            <path d="M20 44 Q12 52 8 60" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thumbsup':
        return (
          <>
            {/* Right arm with thumb up */}
            <path d="M68 44 Q78 32 82 22" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="84" cy="18" r="4" fill={SKIN_COLOR} />
            <path d="M80 18 L88 14 L86 22 Z" fill={SKIN_COLOR} />
            {/* Left arm */}
            <path d="M20 44 Q14 52 10 60" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        );
      case 'pointing':
        return (
          <>
            {/* Right arm pointing right */}
            <path d="M68 44 Q80 32 88 24" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="90" cy="22" r="4" fill={SKIN_COLOR} />
            {/* Left arm */}
            <path d="M20 44 Q14 52 10 60" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            {/* Both arms relaxed */}
            <path d="M20 44 Q14 52 10 60" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M68 44 Q74 52 78 60" stroke={SKIN_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };

  const getCelebration = (state) => {
    if (state === 'celebrating') {
      return (
        <>
          {/* Confetti particles */}
          <circle cx="20" cy="10" r="3" fill="#e74c3c" />
          <circle cx="70" cy="8" r="4" fill="#f1c40f" />
          <circle cx="40" cy="6" r="3" fill="#2ecc71" />
          <circle cx="80" cy="20" r="2.5" fill="#9b59b6" />
          <circle cx="10" cy="25" r="3.5" fill="#e67e22" />
          <circle cx="88" cy="12" r="3" fill="#3498db" />
        </>
      );
    }
    return null;
  };

  // ─── Animation classes ──────────────────────────────────────────────
  const getAnimationClass = () => {
    switch (state) {
      case 'idle':
      case 'happy':
      case 'celebrating':
        return 'animate-bounce';
      case 'wave':
        return 'animate-wave';
      case 'thinking':
      case 'focused':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  return (
    <>
      <style>{`
        @keyframes avatarBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes avatarWave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(8deg); }
          75% { transform: rotate(-8deg); }
        }
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-bounce {
          animation: avatarBounce 1s ease-in-out infinite;
        }
        .animate-wave {
          animation: avatarWave 1.2s ease-in-out infinite;
        }
        .animate-pulse {
          animation: avatarPulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`cursor-pointer ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <div className={`relative w-full h-full ${getAnimationClass()}`}>
          <svg viewBox="0 0 88 88" className="w-full h-full">
            {/* ─── Body ──────────────────────────────────────────────── */}
            <rect x="24" y="50" width="40" height="28" rx="8" fill={SHIRT_COLOR} />
            <rect x="24" y="50" width="40" height="8" rx="4" fill="#3a6fd1" /> {/* collar */}

            {/* ─── Arms ──────────────────────────────────────────────── */}
            {getArms(state)}

            {/* ─── Head ────────────────────────────────────────────────── */}
            <circle cx="44" cy="28" r="22" fill={SKIN_COLOR} stroke="#c49b7d" strokeWidth="1.5" />

            {/* ─── Hair ────────────────────────────────────────────────── */}
            <path d="M22 28 Q22 8 44 6 Q66 8 66 28 Q66 18 58 12 Q44 8 30 12 Q22 18 22 28Z" fill={HAIR_COLOR} />
            <path d="M20 30 Q20 14 32 10 Q28 18 26 28Z" fill="#7a5a3a" />

            {/* ─── Eyes ────────────────────────────────────────────────── */}
            {getEyes(state)}

            {/* ─── Eyebrows ────────────────────────────────────────────── */}
            {(state === 'thinking' || state === 'sad') && (
              <path d="M28 24 Q34 22 40 24" stroke={EYE_COLOR} strokeWidth="2" fill="none" />
            )}
            {state === 'thinking' && (
              <path d="M48 24 Q54 22 60 24" stroke={EYE_COLOR} strokeWidth="2" fill="none" />
            )}

            {/* ─── Mouth ────────────────────────────────────────────────── */}
            {getMouth(state)}

            {/* ─── Blush ────────────────────────────────────────────────── */}
            {(state === 'happy' || state === 'celebrating' || state === 'surprised') && (
              <>
                <ellipse cx="28" cy="36" rx="5" ry="3" fill="#ff8a80" opacity="0.4" />
                <ellipse cx="60" cy="36" rx="5" ry="3" fill="#ff8a80" opacity="0.4" />
              </>
            )}

            {/* ─── Accessories ──────────────────────────────────────────── */}
            {state === 'celebrating' && getCelebration(state)}
          </svg>
        </div>
      </div>
    </>
  );
}