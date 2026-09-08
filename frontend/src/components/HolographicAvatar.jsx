// frontend/src/components/HolographicAvatar.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { User } from 'lucide-react';
import AvatarInteractionMenu from './AvatarInteractionMenu';

const moodConfig = {
  happy: { glow: 'rgba(100,200,255,0.8)', pulse: '1.5s', bg: 'from-blue-400/30 to-cyan-500/30', label: '😊 Happy', color: '#4fc3f7' },
  calm:   { glow: 'rgba(100,200,255,0.8)', pulse: '3s', bg: 'from-blue-400/30 to-cyan-500/30', label: '😌 Calm', color: '#4fc3f7' },
  tired:  { glow: 'rgba(150,150,200,0.5)', pulse: '4s', bg: 'from-purple-400/20 to-gray-500/20', label: '😴 Tired', color: '#9575cd' },
  stressed:{ glow: 'rgba(255,100,50,0.8)', pulse: '1.2s', bg: 'from-red-400/30 to-orange-500/30', label: '😤 Stressed', color: '#ff6b6b' },
  neutral: { glow: 'rgba(100,150,255,0.8)', pulse: '2.5s', bg: 'from-brand-400/30 to-violet-500/30', label: '😐 Neutral', color: '#7c4dff' },
};

export default function HolographicAvatar({ mood = 'neutral', size = 80, onClick }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef(null);
  const [currentMood, setCurrentMood] = useState(mood);
  const [showMenu, setShowMenu] = useState(false);
  const avatarRef = useRef(null);

  const config = moodConfig[currentMood] || moodConfig.neutral;
  const glowColor = config.glow;
  const accentColor = config.color;

  // ─── Particle animation ──────────────────────────────────────────────
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

  // ─── Get facial expression SVG ─────────────────────────────────────
  const getExpression = (mood) => {
    switch (mood) {
      case 'happy':
        return (
          <>
            {/* Eyes - happy (curved) */}
            <path d="M32 32 Q38 26 44 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M56 32 Q62 26 68 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Smile */}
            <path d="M38 42 Q50 52 62 42" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Blush */}
            <ellipse cx="28" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
            <ellipse cx="72" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Eyes - thinking (squinty) */}
            <ellipse cx="38" cy="32" rx="5" ry="3" fill="white" opacity="0.8" />
            <ellipse cx="62" cy="32" rx="5" ry="3" fill="white" opacity="0.8" />
            {/* Mouth - pursed */}
            <ellipse cx="50" cy="44" rx="6" ry="3" fill="none" stroke="white" strokeWidth="2" />
            {/* Eyebrow - raised */}
            <path d="M30 24 Q38 20 46 24" stroke="white" strokeWidth="2" fill="none" />
          </>
        );
      case 'focused':
        return (
          <>
            {/* Eyes - focused (straight) */}
            <rect x="32" y="30" width="10" height="5" rx="2" fill="white" opacity="0.9" />
            <rect x="58" y="30" width="10" height="5" rx="2" fill="white" opacity="0.9" />
            {/* Mouth - neutral */}
            <path d="M40 44 Q50 48 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Eyebrows - determined */}
            <path d="M28 24 L44 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M72 24 L56 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Eyes - wide */}
            <ellipse cx="38" cy="30" rx="8" ry="9" fill="white" opacity="0.9" />
            <ellipse cx="38" cy="30" rx="3" ry="4" fill="rgba(100,200,255,0.8)" />
            <ellipse cx="62" cy="30" rx="8" ry="9" fill="white" opacity="0.9" />
            <ellipse cx="62" cy="30" rx="3" ry="4" fill="rgba(100,200,255,0.8)" />
            {/* Mouth - open */}
            <ellipse cx="50" cy="46" rx="8" ry="9" fill="none" stroke="white" strokeWidth="2" />
            <ellipse cx="50" cy="46" rx="6" ry="7" fill="rgba(100,200,255,0.2)" />
          </>
        );
      case 'celebrating':
        return (
          <>
            {/* Eyes - happy (curved) */}
            <path d="M32 32 Q38 26 44 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M56 32 Q62 26 68 32" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Open smile */}
            <ellipse cx="50" cy="44" rx="12" ry="8" fill="none" stroke="white" strokeWidth="2" />
            <ellipse cx="50" cy="46" rx="10" ry="6" fill="rgba(100,200,255,0.2)" />
            {/* Blush */}
            <ellipse cx="28" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
            <ellipse cx="72" cy="38" rx="6" ry="3" fill="rgba(255,150,150,0.4)" />
          </>
        );
      case 'sad':
        return (
          <>
            {/* Eyes - droopy */}
            <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.7" />
            <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.7" />
            {/* Mouth - sad */}
            <path d="M38 48 Q50 40 62 48" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Eyebrows - sad */}
            <path d="M28 24 Q38 28 48 24" stroke="white" strokeWidth="2" fill="none" />
            <path d="M52 24 Q62 28 72 24" stroke="white" strokeWidth="2" fill="none" />
            {/* Tear */}
            <ellipse cx="62" cy="40" rx="2" ry="4" fill="rgba(100,200,255,0.5)" />
          </>
        );
      default:
        // Neutral
        return (
          <>
            {/* Eyes - neutral */}
            <ellipse cx="38" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
            <ellipse cx="38" cy="32" rx="2" ry="2" fill={accentColor} />
            <ellipse cx="62" cy="32" rx="5" ry="5" fill="white" opacity="0.8" />
            <ellipse cx="62" cy="32" rx="2" ry="2" fill={accentColor} />
            {/* Mouth - slight smile */}
            <path d="M40 44 Q50 50 60 44" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };

  const updateMood = async (newMood) => {
    try {
      await api.recordMood(newMood);
      setCurrentMood(newMood);
      if (user) user.mood = newMood;
      refreshUser();
      showToast(`Mood updated to ${moodConfig[newMood]?.label || newMood}`, 'success');
    } catch (err) {
      console.error('Mood update error:', err);
      showToast('Failed to update mood', 'error');
    }
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <div className="relative flex flex-col items-center z-50 isolate" ref={avatarRef}>
      {/* ─── Holographic Frame ────────────────────────────────────── */}
      <div
        className="relative cursor-pointer group"
        style={{ width: size, height: size }}
        onClick={toggleMenu}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-[-12px] rounded-full transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            animation: `pulse ${config.pulse} ease-in-out infinite`,
            opacity: 0.7,
          }}
        />

        {/* Rotating holographic rings */}
        <div className="absolute inset-[-6px] rounded-full border-2 border-brand-400/30 animate-spin-slow" />
        <div className="absolute inset-[-14px] rounded-full border border-violet-400/20 animate-spin-reverse" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-[-22px] rounded-full border border-cyan-400/10 animate-spin-slow" style={{ animationDuration: '12s' }} />

        {/* Main holographic circle */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand-500/10 via-violet-600/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">

          {/* ─── Scanline effect ────────────────────────────────── */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400/40 to-transparent animate-scan" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(100,200,255,0.03)_3px,rgba(100,200,255,0.03)_4px)]" />
          </div>

          {/* ─── SVG Avatar with holographic glow ───────────────── */}
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(100,200,255,0.3))' }}>
            {/* Holographic body glow */}
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

            {/* Torso - holographic body */}
            <path d="M30 55 L70 55 L75 85 L25 85 Z" fill={`${accentColor}15`} stroke={accentColor} strokeWidth="1.5" opacity="0.6" />

            {/* Neck */}
            <rect x="45" y="48" width="10" height="8" rx="2" fill={`${accentColor}10`} stroke={accentColor} strokeWidth="1" opacity="0.4" />

            {/* Shoulders */}
            <path d="M25 55 L30 48 L70 48 L75 55" fill={`${accentColor}10`} stroke={accentColor} strokeWidth="1" opacity="0.4" />

            {/* Head - holographic */}
            <circle cx="50" cy="30" r="22" fill={`${accentColor}10`} stroke={accentColor} strokeWidth="1.5" />

            {/* Face glow */}
            <circle cx="50" cy="30" r="18" fill="url(#scanGrad)" opacity="0.3" />

            {/* Facial expression */}
            {getExpression(currentMood)}

            {/* Holographic noise overlay */}
            <circle cx="50" cy="30" r="22" fill="none" stroke={`${accentColor}20`} strokeWidth="0.5" opacity="0.5" strokeDasharray="2,4" />

            {/* Floating data particles around head */}
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

      {/* ─── Mood label ────────────────────────────────────────── */}
      <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: glowColor }} />
          {moodConfig[currentMood]?.label || currentMood}
        </span>
      </div>

      {/* ─── Interaction Menu ──────────────────────────────────── */}
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