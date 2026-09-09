// frontend/src/components/HolographicAvatar.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import AvatarInteractionMenu from './AvatarInteractionMenu';

// ─── Mood config ────────────────────────────────────────────────────
const moodConfig = {
  happy: {
    glow: 'rgba(255, 200, 100, 0.8)',
    pulse: '1.5s',
    color: '#f59e0b',
    overlayColor: 'rgba(255, 200, 100, 0.15)',
    filter: 'brightness(1.05) saturate(1.2)',
    animation: 'float',
  },
  excited: {
    glow: 'rgba(255, 150, 50, 0.9)',
    pulse: '0.8s',
    color: '#ff9800',
    overlayColor: 'rgba(255, 150, 50, 0.2)',
    filter: 'brightness(1.1) saturate(1.4) contrast(1.1)',
    animation: 'bounce',
  },
  calm: {
    glow: 'rgba(100, 150, 255, 0.6)',
    pulse: '3s',
    color: '#3b82f6',
    overlayColor: 'rgba(100, 150, 255, 0.15)',
    filter: 'brightness(1.0) saturate(0.9)',
    animation: 'float',
  },
  thinking: {
    glow: 'rgba(150, 150, 200, 0.6)',
    pulse: '2s',
    color: '#9575cd',
    overlayColor: 'rgba(150, 150, 200, 0.15)',
    filter: 'brightness(0.95) saturate(0.9)',
    animation: 'idle',
  },
  focused: {
    glow: 'rgba(255, 100, 50, 0.8)',
    pulse: '1.5s',
    color: '#ff6b6b',
    overlayColor: 'rgba(255, 100, 50, 0.15)',
    filter: 'brightness(1.0) saturate(1.1) contrast(1.1)',
    animation: 'idle',
  },
  working: {
    glow: 'rgba(100, 200, 100, 0.8)',
    pulse: '1.8s',
    color: '#4caf50',
    overlayColor: 'rgba(100, 200, 100, 0.15)',
    filter: 'brightness(1.0) saturate(1.1)',
    animation: 'idle',
  },
  thumbsup: {
    glow: 'rgba(100, 200, 100, 0.8)',
    pulse: '2s',
    color: '#4caf50',
    overlayColor: 'rgba(100, 200, 100, 0.15)',
    filter: 'brightness(1.0) saturate(1.0)',
    animation: 'float',
  },
  surprised: {
    glow: 'rgba(255, 200, 50, 0.8)',
    pulse: '1s',
    color: '#ffca28',
    overlayColor: 'rgba(255, 200, 50, 0.2)',
    filter: 'brightness(1.05) saturate(1.2) contrast(1.05)',
    animation: 'bounce',
  },
  celebrating: {
    glow: 'rgba(255, 150, 50, 0.9)',
    pulse: '0.8s',
    color: '#ff9800',
    overlayColor: 'rgba(255, 150, 50, 0.2)',
    filter: 'brightness(1.1) saturate(1.3)',
    animation: 'bounce',
  },
  sad: {
    glow: 'rgba(100, 100, 150, 0.5)',
    pulse: '3.5s',
    color: '#78909c',
    overlayColor: 'rgba(100, 100, 150, 0.2)',
    filter: 'brightness(0.9) saturate(0.7)',
    animation: 'idle',
  },
  concerned: {
    glow: 'rgba(150, 100, 100, 0.5)',
    pulse: '3s',
    color: '#a1887f',
    overlayColor: 'rgba(150, 100, 100, 0.15)',
    filter: 'brightness(0.95) saturate(0.8)',
    animation: 'idle',
  },
  pointing: {
    glow: 'rgba(100, 150, 200, 0.7)',
    pulse: '2.5s',
    color: '#64b5f6',
    overlayColor: 'rgba(100, 150, 200, 0.15)',
    filter: 'brightness(1.0) saturate(1.0)',
    animation: 'idle',
  },
  neutral: {
    glow: 'rgba(100, 150, 255, 0.8)',
    pulse: '2.5s',
    color: '#7c4dff',
    overlayColor: 'rgba(100, 150, 255, 0.1)',
    filter: 'brightness(1.0) saturate(1.0)',
    animation: 'float',
  },
};

// ─── Default image map ─────────────────────────────────────────────
const defaultImageMap = {
  happy: '/happy.jpg',
  excited: '/excited.jpg',
  thinking: '/thinking.jpg',
  neutral: '/neutral.jpg',
};

// ─── Helper: animation class ──────────────────────────────────────
const getAnimationClass = (animation) => {
  switch (animation) {
    case 'bounce': return 'animate-bounce';
    case 'walk': return 'animate-walk';
    case 'talk': return 'animate-talk';
    case 'float': return 'animate-float';
    default: return '';
  }
};

export default function HolographicAvatar({
  mood = 'neutral',
  size = 80,
  imageSrc = null,
  imageMap = defaultImageMap,
  fallbackImage = '/neutral.jpg',
  onClick,
}) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const avatarRef = useRef(null);

  const config = moodConfig[mood] || moodConfig.neutral;
  const glowColor = config.glow;
  const accentColor = config.color;
  const pulseDuration = config.pulse;
  const overlayColor = config.overlayColor;
  const filterStyle = config.filter;
  const animation = config.animation;

  const [currentMood, setCurrentMood] = useState(mood);

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  const displayImage = imageSrc || imageMap[mood] || imageMap.neutral || fallbackImage;

  // ─── Particle animation ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const hue = accentColor ? parseInt(accentColor.slice(1, 3), 16) : 210;
    const particleColor = `hsla(${hue + 20}, 80%, 70%, 0.5)`;

    const particles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.6,
        dy: (Math.random() - 0.5) * 0.6,
        color: particleColor,
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
  }, [accentColor]);

  // ─── Update mood (from menu) ──────────────────────────────────
  const updateMood = async (newMood) => {
    try {
      await api.recordMood(newMood);
      setCurrentMood(newMood);
      if (user) user.mood = newMood;
      refreshUser();
      showToast(`Mood updated to ${newMood}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update mood', 'error');
    }
  };

  const toggleMenu = () => setShowMenu(!showMenu);

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
          className={`relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand-500/10 via-violet-600/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 flex items-center justify-center ${getAnimationClass(animation)}`}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400/40 to-transparent animate-scan" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(100,200,255,0.03)_3px,rgba(100,200,255,0.03)_4px)]" />
          </div>

          {/* ─── IMAGE ────────────────────────────────────────────── */}
          <img
            src={displayImage}
            alt={mood}
            className="w-full h-full object-cover rounded-full transition-all duration-700"
            style={{ filter: filterStyle }}
          />

          {/* ─── MOOD OVERLAY (tint) ────────────────────────────── */}
          <div
            className="absolute inset-0 rounded-full mix-blend-overlay pointer-events-none transition-all duration-700"
            style={{ background: `radial-gradient(circle at 50% 50%, ${overlayColor}, transparent 70%)` }}
          />

          {/* ─── EMOJI BADGE REMOVED ─────────────────────────────── */}
        </div>

        {/* Particle canvas overlay */}
        <canvas
          ref={canvasRef}
          width={size + 40}
          height={size + 40}
          className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] pointer-events-none rounded-full"
        />
      </div>

      {/* ─── MOOD LABEL REMOVED ─────────────────────────────────── */}

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