// frontend/src/components/HolographicAvatar.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import AvatarInteractionMenu from './AvatarInteractionMenu';

// ---------- Mood config with expression mapping ----------
const moodConfig = {
  // Mood → { expression, label, glowColor, pulseDuration }
  happy:    { expression: 'happy', label: '😊 Happy', glow: 'rgba(100,200,255,0.8)', pulse: '1.5s', color: '#4fc3f7' },
  excited:  { expression: 'excited', label: '🤩 Excited', glow: 'rgba(255,200,100,0.8)', pulse: '1.2s', color: '#ffb74d' },
  calm:     { expression: 'calm', label: '😌 Calm', glow: 'rgba(100,150,255,0.6)', pulse: '3s', color: '#7c4dff' },
  thinking: { expression: 'thinking', label: '🤔 Thinking', glow: 'rgba(150,150,200,0.6)', pulse: '2s', color: '#9575cd' },
  focused:  { expression: 'focused', label: '🎯 Focused', glow: 'rgba(255,100,50,0.8)', pulse: '1.5s', color: '#ff6b6b' },
  working:  { expression: 'working', label: '💪 Working', glow: 'rgba(100,200,100,0.8)', pulse: '1.8s', color: '#66bb6a' },
  thumbsup: { expression: 'thumbsup', label: '👍 ThumbsUp', glow: 'rgba(100,200,100,0.8)', pulse: '2s', color: '#4caf50' },
  surprised:{ expression: 'surprised', label: '😮 Surprised', glow: 'rgba(255,200,50,0.8)', pulse: '1s', color: '#ffca28' },
  celebrating:{ expression:'celebrating', label:'🎉 Celebrating', glow:'rgba(255,150,50,0.9)', pulse:'0.8s', color:'#ff9800' },
  sad:      { expression: 'sad', label: '😢 Sad', glow: 'rgba(100,100,150,0.5)', pulse: '3.5s', color: '#78909c' },
  concerned:{ expression: 'concerned', label: '😟 Concerned', glow: 'rgba(150,100,100,0.5)', pulse: '3s', color: '#a1887f' },
  pointing: { expression: 'pointing', label: '👉 Pointing', glow: 'rgba(100,150,200,0.7)', pulse: '2.5s', color: '#64b5f6' },
  neutral:  { expression: 'neutral', label: '😐 Neutral', glow: 'rgba(100,150,255,0.8)', pulse: '2.5s', color: '#7c4dff' },
};

// ---------- Helper to get expression component ----------
const getExpressionSVG = (expression, accentColor) => {
  // All SVG paths for each expression
  const expressions = {
    happy: (
      <>
        <path d="M32 32 Q38 26 44 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M56 32 Q62 26 68 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M38 42 Q50 52 62 42" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="28" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
        <ellipse cx="72" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
      </>
    ),
    excited: (
      <>
        <path d="M30 30 Q38 22 46 30" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M54 30 Q62 22 70 30" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="44" rx="14" ry="10" fill="none" stroke="white" strokeWidth="2" />
        <ellipse cx="50" cy="46" rx="12" ry="8" fill="rgba(255,200,100,0.3)" />
        <ellipse cx="28" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
        <ellipse cx="72" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
        <path d="M20 20 L30 28 M80 20 L70 28" stroke="white" strokeWidth="1.5" opacity="0.6" />
      </>
    ),
    calm: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="4" fill="white" opacity="0.7" />
        <ellipse cx="62" cy="32" rx="5" ry="4" fill="white" opacity="0.7" />
        <path d="M40 44 Q50 48 60 44" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M30 24 Q38 22 46 24" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M54 24 Q62 22 70 24" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
      </>
    ),
    thinking: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="3" fill="white" opacity="0.8" />
        <ellipse cx="62" cy="32" rx="5" ry="3" fill="white" opacity="0.8" />
        <ellipse cx="50" cy="44" rx="6" ry="3" fill="none" stroke="white" strokeWidth="2" />
        <path d="M30 24 Q38 20 46 24" stroke="white" strokeWidth="2" fill="none" />
        <path d="M28 16 L22 10" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
      </>
    ),
    focused: (
      <>
        <rect x="32" y="30" width="10" height="5" rx="2" fill="white" opacity="0.9" />
        <rect x="58" y="30" width="10" height="5" rx="2" fill="white" opacity="0.9" />
        <path d="M40 44 Q50 48 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M28 24 L44 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M72 24 L56 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    working: (
      <>
        <rect x="32" y="30" width="10" height="5" rx="2" fill="white" opacity="0.9" />
        <rect x="58" y="30" width="10" height="5" rx="2" fill="white" opacity="0.9" />
        <path d="M40 44 Q50 48 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M28 24 L44 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M72 24 L56 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M18 55 L30 65 M82 55 L70 65" stroke="white" strokeWidth="1.5" opacity="0.5" />
      </>
    ),
    thumbsup: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
        <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
        <path d="M40 44 Q50 52 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M30 24 Q38 20 46 24" stroke="white" strokeWidth="2" fill="none" />
        <path d="M72 30 L80 20 M72 35 L80 25" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="82" cy="28" r="2" fill="white" opacity="0.5" />
      </>
    ),
    surprised: (
      <>
        <ellipse cx="38" cy="30" rx="8" ry="9" fill="white" opacity="0.9" />
        <ellipse cx="38" cy="30" rx="3" ry="4" fill="rgba(100,200,255,0.8)" />
        <ellipse cx="62" cy="30" rx="8" ry="9" fill="white" opacity="0.9" />
        <ellipse cx="62" cy="30" rx="3" ry="4" fill="rgba(100,200,255,0.8)" />
        <ellipse cx="50" cy="46" rx="8" ry="9" fill="none" stroke="white" strokeWidth="2" />
        <ellipse cx="50" cy="46" rx="6" ry="7" fill="rgba(100,200,255,0.2)" />
      </>
    ),
    celebrating: (
      <>
        <path d="M32 32 Q38 26 44 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M56 32 Q62 26 68 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="44" rx="12" ry="8" fill="none" stroke="white" strokeWidth="2" />
        <ellipse cx="50" cy="46" rx="10" ry="6" fill="rgba(255,200,100,0.3)" />
        <ellipse cx="28" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
        <ellipse cx="72" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
        <path d="M20 20 L30 30 M80 20 L70 30 M20 30 L30 20 M80 30 L70 20" stroke="white" strokeWidth="1.5" opacity="0.6" />
      </>
    ),
    sad: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.7" />
        <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.7" />
        <path d="M38 48 Q50 40 62 48" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M28 24 Q38 28 48 24" stroke="white" strokeWidth="2" fill="none" />
        <path d="M52 24 Q62 28 72 24" stroke="white" strokeWidth="2" fill="none" />
        <ellipse cx="62" cy="40" rx="2" ry="4" fill="rgba(100,200,255,0.5)" />
      </>
    ),
    concerned: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.7" />
        <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.7" />
        <path d="M38 46 Q50 42 62 46" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M28 24 Q38 26 48 24" stroke="white" strokeWidth="2" fill="none" />
        <path d="M52 24 Q62 26 72 24" stroke="white" strokeWidth="2" fill="none" />
        <ellipse cx="50" cy="30" rx="8" ry="3" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </>
    ),
    pointing: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
        <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
        <path d="M40 44 Q50 50 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M30 24 Q38 20 46 24" stroke="white" strokeWidth="2" fill="none" />
        <path d="M70 35 L85 40 L78 48" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    neutral: (
      <>
        <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
        <ellipse cx="38" cy="32" rx="2" ry="2" fill={accentColor} />
        <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
        <ellipse cx="62" cy="32" rx="2" ry="2" fill={accentColor} />
        <path d="M40 44 Q50 50 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
  };
  return expressions[expression] || expressions.neutral;
};

export default function HolographicAvatar({
  mood = 'neutral',
  size = 80,
  animation = 'idle', // 'idle' | 'bounce' | 'walk' | 'talk' | 'float'
  onClick
}) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const avatarRef = useRef(null);

  // Get config for this mood
  const config = moodConfig[mood] || moodConfig.neutral;
  const expression = config.expression;
  const glowColor = config.glow;
  const accentColor = config.color;
  const pulseDuration = config.pulse;

  // Internal sync: if mood prop changes, we update local state (but we don't need local state if we use props directly)
  // We'll keep a local state for the interaction menu, but expression is derived from props.
  const [currentMood, setCurrentMood] = useState(mood);

  // Sync prop to local state (so menu can update)
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // ---------- Particle animation (canvas) ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const particles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.6,
        dy: (Math.random() - 0.5) * 0.6,
        color: `hsla(${210 + Math.random() * 40}, 80%, 70%, ${Math.random() * 0.4 + 0.2})`,
      });
    }
    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // ---------- Update mood (from menu) ----------
  const updateMood = async (newMood) => {
    try {
      await api.recordMood(newMood);
      setCurrentMood(newMood);
      if (user) user.mood = newMood;
      refreshUser();
      showToast(`Mood updated to ${moodConfig[newMood]?.label || newMood}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update mood', 'error');
    }
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  // ---------- CSS animation classes ----------
  const getAnimationClass = () => {
    switch (animation) {
      case 'bounce': return 'animate-bounce';
      case 'walk': return 'animate-walk';
      case 'talk': return 'animate-talk';
      case 'float': return 'animate-float';
      default: return '';
    }
  };

  // ---------- Render ----------
  const expressionSVG = getExpressionSVG(expression, accentColor);

  return (
    <div className="relative flex flex-col items-center z-50 isolate" ref={avatarRef}>
      <div
        className="relative cursor-pointer group"
        style={{ width: size, height: size }}
        onClick={() => { if (onClick) onClick(); toggleMenu(); }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-[-12px] rounded-full transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            animation: `pulse ${pulseDuration} ease-in-out infinite`,
            opacity: 0.7,
          }}
        />

        {/* Rotating holographic rings */}
        <div className="absolute inset-[-6px] rounded-full border-2 border-brand-400/30 animate-spin-slow" />
        <div className="absolute inset-[-14px] rounded-full border border-violet-400/20 animate-spin-reverse" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-[-22px] rounded-full border border-cyan-400/10 animate-spin-slow" style={{ animationDuration: '12s' }} />

        {/* Main holographic circle */}
        <div
          className={`relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand-500/10 via-violet-600/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 flex items-center justify-center ${getAnimationClass()}`}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400/40 to-transparent animate-scan" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(100,200,255,0.03)_3px,rgba(100,200,255,0.03)_4px)]" />
          </div>

          {/* SVG Avatar */}
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(100,200,255,0.3))' }}>
            <defs>
              <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
                <stop offset="70%" stopColor={accentColor} stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
                <stop offset="50%" stopColor={accentColor} stopOpacity="0.1" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Body glow */}
            <ellipse cx="50" cy="70" rx="30" ry="20" fill="url(#glowGrad)" />

            {/* Torso */}
            <path d="M30 55 L70 55 L75 85 L25 85 Z" fill={`${accentColor}15`} stroke={accentColor} strokeWidth="1.5" opacity="0.6" />

            {/* Neck */}
            <rect x="45" y="48" width="10" height="8" rx="2" fill={`${accentColor}10`} stroke={accentColor} strokeWidth="1" opacity="0.4" />

            {/* Shoulders */}
            <path d="M25 55 L30 48 L70 48 L75 55" fill={`${accentColor}10`} stroke={accentColor} strokeWidth="1" opacity="0.4" />

            {/* Head */}
            <circle cx="50" cy="30" r="22" fill={`${accentColor}10`} stroke={accentColor} strokeWidth="1.5" />

            {/* Face glow */}
            <circle cx="50" cy="30" r="18" fill="url(#scanGrad)" opacity="0.3" />

            {/* Facial expression */}
            {expressionSVG}

            {/* Holographic noise overlay */}
            <circle cx="50" cy="30" r="22" fill="none" stroke={`${accentColor}20`} strokeWidth="0.5" opacity="0.5" strokeDasharray="2,4" />

            {/* Floating data particles */}
            <circle cx="20" cy="25" r="1.5" fill={accentColor} opacity="0.6" />
            <circle cx="80" cy="20" r="1.5" fill={accentColor} opacity="0.5" />
            <circle cx="22" cy="40" r="1" fill={accentColor} opacity="0.4" />
            <circle cx="78" cy="42" r="1" fill={accentColor} opacity="0.4" />
            <circle cx="35" cy="10" r="1.5" fill={accentColor} opacity="0.5" />
            <circle cx="65" cy="8" r="1" fill={accentColor} opacity="0.4" />
          </svg>
        </div>

        {/* Particle canvas overlay */}
        <canvas
          ref={canvasRef}
          width={size + 40}
          height={size + 40}
          className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] pointer-events-none rounded-full"
        />
      </div>

      {/* Mood label */}
      <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: glowColor }} />
          {config.label}
        </span>
      </div>

      {/* Interaction menu */}
      {showMenu && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] w-64 pointer-events-auto">
          <AvatarInteractionMenu
            onClose={() => setShowMenu(false)}
            onMoodSelect={updateMood}
            currentMood={currentMood}
            onUploadAvatar={() => {}}
            onViewProfile={() => {}}
          />
        </div>
      )}
    </div>
  );
}