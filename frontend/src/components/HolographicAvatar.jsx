// frontend/src/components/HolographicAvatar.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { User } from 'lucide-react'; // ← added for fallback icon
import AvatarInteractionMenu from './AvatarInteractionMenu';

const moodConfig = {
  happy: { glow: 'rgba(255,215,0,0.8)', pulse: '1.5s', bg: 'from-yellow-400/30 to-amber-500/30', label: '😊 Happy' },
  calm:   { glow: 'rgba(100,200,255,0.8)', pulse: '3s', bg: 'from-blue-400/30 to-cyan-500/30', label: '😌 Calm' },
  tired:  { glow: 'rgba(150,150,200,0.5)', pulse: '4s', bg: 'from-purple-400/20 to-gray-500/20', label: '😴 Tired' },
  stressed:{ glow: 'rgba(255,100,50,0.8)', pulse: '1.2s', bg: 'from-red-400/30 to-orange-500/30', label: '😤 Stressed' },
  neutral: { glow: 'rgba(100,150,255,0.8)', pulse: '2.5s', bg: 'from-brand-400/30 to-violet-500/30', label: '😐 Neutral' },
};

export default function HolographicAvatar() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef(null);
  const [mood, setMood] = useState(user?.mood || 'neutral');
  const [showMenu, setShowMenu] = useState(false);
  const avatarRef = useRef(null);

  const currentMood = moodConfig[mood] || moodConfig.neutral;

  // Particle animation (unchanged)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const particles = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.8,
        dy: (Math.random() - 0.5) * 0.8,
        color: `hsla(${Math.random() * 60 + 220}, 80%, 70%, ${Math.random() * 0.5 + 0.3})`,
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

  const updateMood = async (newMood) => {
    try {
      await api.recordMood(newMood);
      setMood(newMood);
      if (user) user.mood = newMood;
      refreshUser();
      showToast(`Mood updated to ${moodConfig[newMood]?.label || newMood}`, 'success');
    } catch (err) {
      console.error('Mood update error:', err);
      showToast('Failed to update mood', 'error');
    }
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  // Get user's name and initial
  const displayName = user?.full_name || user?.username || '';
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="relative flex flex-col items-center z-50 isolate" ref={avatarRef}>
      {/* Holographic Frame */}
      <div
        className="relative w-32 h-32 cursor-pointer group"
        onClick={toggleMenu}
      >
        {/* Outer glow */}
        <div
          className="absolute inset-[-8px] rounded-full blur-xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${currentMood.glow} 0%, transparent 70%)`,
            animation: `pulse ${currentMood.pulse} ease-in-out infinite`,
          }}
        />

        {/* Rotating rings */}
        <div className="absolute inset-[-4px] rounded-full border-2 border-brand-400/30 animate-spin-slow" />
        <div className="absolute inset-[-10px] rounded-full border border-violet-400/20 animate-spin-reverse" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-[-16px] rounded-full border border-cyan-400/10 animate-spin-slow" style={{ animationDuration: '12s' }} />

        {/* Inner circle with avatar */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand-500/20 to-violet-600/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : initial ? (
            // ✅ Show user's initial (first letter)
            <span className="text-6xl text-white/80 font-light">
              {initial}
            </span>
          ) : (
            // ✅ Fallback: user icon
            <User className="w-12 h-12 text-white/60" />
          )}
          {/* Scanning line */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-scan" />
          </div>
        </div>

        {/* Particles canvas */}
        <canvas
          ref={canvasRef}
          width={160}
          height={160}
          className="absolute inset-0 w-full h-full pointer-events-none rounded-full"
        />
      </div>

      {/* Mood indicator */}
      <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
        <span>Mood: {moodConfig[mood]?.label || mood}</span>
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: currentMood.glow }} />
      </div>

      {/* Interaction Menu */}
      {showMenu && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] w-64 pointer-events-auto">
          <AvatarInteractionMenu
            onClose={() => setShowMenu(false)}
            onMoodSelect={updateMood}
            currentMood={mood}
            onUploadAvatar={() => {}}
            onViewProfile={() => {}}
          />
        </div>
      )}
    </div>
  );
}