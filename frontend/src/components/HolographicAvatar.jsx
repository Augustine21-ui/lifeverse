// frontend/src/components/HolographicAvatar.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import AvatarInteractionMenu from './AvatarInteractionMenu';

// ---------- Mood config – glow, label, pulse ----------
const moodConfig = {
  happy:    { label: '😊 Happy', glow: 'rgba(100,200,255,0.8)', pulse: '1.5s', color: '#4fc3f7' },
  excited:  { label: '🤩 Excited', glow: 'rgba(255,200,100,0.8)', pulse: '1.2s', color: '#ffb74d' },
  calm:     { label: '😌 Calm', glow: 'rgba(100,150,255,0.6)', pulse: '3s', color: '#7c4dff' },
  thinking: { label: '🤔 Thinking', glow: 'rgba(150,150,200,0.6)', pulse: '2s', color: '#9575cd' },
  focused:  { label: '🎯 Focused', glow: 'rgba(255,100,50,0.8)', pulse: '1.5s', color: '#ff6b6b' },
  working:  { label: '💪 Working', glow: 'rgba(100,200,100,0.8)', pulse: '1.8s', color: '#66bb6a' },
  thumbsup: { label: '👍 ThumbsUp', glow: 'rgba(100,200,100,0.8)', pulse: '2s', color: '#4caf50' },
  surprised:{ label: '😮 Surprised', glow: 'rgba(255,200,50,0.8)', pulse: '1s', color: '#ffca28' },
  celebrating:{ label:'🎉 Celebrating', glow:'rgba(255,150,50,0.9)', pulse:'0.8s', color:'#ff9800' },
  sad:      { label: '😢 Sad', glow: 'rgba(100,100,150,0.5)', pulse: '3.5s', color: '#78909c' },
  concerned:{ label: '😟 Concerned', glow: 'rgba(150,100,100,0.5)', pulse: '3s', color: '#a1887f' },
  pointing: { label: '👉 Pointing', glow: 'rgba(100,150,200,0.7)', pulse: '2.5s', color: '#64b5f6' },
  neutral:  { label: '😐 Neutral', glow: 'rgba(100,150,255,0.8)', pulse: '2.5s', color: '#7c4dff' },
};

// ---------- Default image mapping (place your own images here) ----------
const defaultImageMap = {
  happy: '/avatars/happy.png',
  excited: '/avatars/excited.png',
  thinking: '/avatars/thinking.png',
  // if missing, fallback to neutral
  neutral: '/avatars/neutral.png',
};

export default function HolographicAvatar({
  mood = 'neutral',
  size = 80,
  animation = 'idle', // 'idle' | 'bounce' | 'walk' | 'talk' | 'float'
  onClick,
  imageMap = defaultImageMap,    // custom mapping
  fallbackImage = '/avatars/neutral.png',
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

  const [currentMood, setCurrentMood] = useState(mood);

  // Sync prop to local state
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Determine image source – fallback to neutral image
  const imageSrc = imageMap[mood] || imageMap.neutral || fallbackImage;

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

        {/* Main holographic circle – now with an image */}
        <div
          className={`relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand-500/10 via-violet-600/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 flex items-center justify-center ${getAnimationClass()}`}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400/40 to-transparent animate-scan" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(100,200,255,0.03)_3px,rgba(100,200,255,0.03)_4px)]" />
          </div>

          {/* Character image */}
          <img
            src={imageSrc}
            alt={mood}
            className="w-full h-full object-cover rounded-full"
            style={{ filter: `drop-shadow(0 0 20px ${glowColor})` }}
          />

          {/* Glow overlay – tint the image with mood colour */}
          <div
            className="absolute inset-0 rounded-full mix-blend-overlay pointer-events-none"
            style={{ background: `radial-gradient(circle, ${glowColor}30, transparent 70%)` }}
          />
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