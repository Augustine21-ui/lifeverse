import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrbitActivity from '../components/OrbitActivity';
import OrbitSummary from '../components/OrbitSummary';
import { useAuth } from '../hooks/useAuth';
import { startOrbitSession } from '../services/orbitApi';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const OrbitPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [selectedMode, setSelectedMode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Study context – from location state or from API
  const [currentSubject, setCurrentSubject] = useState(location.state?.subject || '');
  const [currentTopic, setCurrentTopic] = useState(location.state?.topic || '');
  const grade = user?.grade || '10';

  // Fetch study context if not provided via location state
  useEffect(() => {
    if (currentSubject && currentTopic) {
      setContextLoading(false);
      return;
    }
    const fetchContext = async () => {
      try {
        const ctx = await api.getCurrentStudy();
        if (ctx) {
          setCurrentSubject(ctx.subject || '');
          setCurrentTopic(ctx.topic || '');
        }
      } catch (err) {
        console.error('Failed to fetch study context:', err);
        setCurrentSubject('Biology');
        setCurrentTopic('Photosynthesis');
      } finally {
        setContextLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handlePlanetClick = async (mode) => {
    setLoading(true);
    try {
      const { sessionId } = await startOrbitSession({ 
        subject: currentSubject, 
        topic: currentTopic, 
        mixup: mode === 'mixup' 
      });
      setSessionId(sessionId);
      const types = mode === 'mixup' ? ['cortex', 'cluepath', 'pathfinder', 'reflex'] : [mode];
      const response = await fetch('/api/orbit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ subject: currentSubject, topic: currentTopic, grade, types })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate activities');
      }
      const data = await response.json();
      setActivities(data.activities || []);
      setSelectedMode(mode);
    } catch (err) {
      console.error(err);
      showToast?.(err.message || 'Could not start Orbit session', 'error');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (activityId, answer, time) => {
    const timeInSeconds = Math.floor(time);
    try {
      const res = await fetch('/api/orbit/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ sessionId, activityId, answer, time: timeInSeconds })
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      const { correct } = await res.json();
      if (correct) setScore(prev => prev + 1);
      setCompleted(prev => prev + 1);
      // Update progress
      setProgress(prev => prev + (1 / (activities.length || 1)) * 100);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to submit answer', 'error');
    }
  };

  const handleFinish = async () => {
    try {
      await fetch('/api/orbit/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ sessionId, score, completed })
      });
      setSelectedMode('summary');
    } catch (err) {
      console.error(err);
      showToast?.('Failed to end session', 'error');
    }
  };

  // ------ Render states ------
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>Loading study context...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>Loading Orbit...</div>
      </div>
    );
  }

  if (selectedMode === 'summary') {
    return <OrbitSummary score={score} completed={completed} onContinue={() => navigate('/dashboard')} />;
  }

  if (selectedMode && activities.length > 0) {
    const currentActivity = activities[completed] || activities[0];
    return (
      <OrbitActivity
        activity={currentActivity}
        onAnswer={handleAnswer}
        onFinish={handleFinish}
        total={activities.length}
        current={completed}
      />
    );
  }

  // ------ Main solar system view ------
  return (
    <div 
      className="orbit-universe min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Starfield background */}
      <div className="stars"></div>
      <div className="stars stars2"></div>
      <div className="stars stars3"></div>

      <div className="solar-system relative w-[90vmin] h-[90vmin] max-w-[700px] max-h-[700px]">

        {/* Central Life Core */}
        <div className="life-core absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-[0_0_80px_40px_rgba(139,92,246,0.5)] animate-pulse-slow z-10 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Life Core</span>
          <span className="text-sm font-bold text-white mt-1">{currentSubject || 'No Subject'}</span>
          <span className="text-xs text-white/80">{currentTopic || 'No Topic'}</span>
          <div className="w-full mt-2">
            <div className="text-xs text-white/60">Progress</div>
            <div className="w-full h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Orbit paths */}
        <div className="orbit-path absolute inset-0 rounded-full border-2 border-white/10" style={{ width: '92%', height: '92%', top: '4%', left: '4%' }}></div>
        <div className="orbit-path absolute inset-0 rounded-full border-2 border-white/10" style={{ width: '78%', height: '78%', top: '11%', left: '11%' }}></div>
        <div className="orbit-path absolute inset-0 rounded-full border-2 border-white/10" style={{ width: '64%', height: '64%', top: '18%', left: '18%' }}></div>
        <div className="orbit-path absolute inset-0 rounded-full border-2 border-white/10" style={{ width: '50%', height: '50%', top: '25%', left: '25%' }}></div>

        {/* Planets */}
        <OrbitPlanet
          mode="cortex"
          label="🧠 Cortex"
          color="blue"
          radius="46%"
          duration="14s"
          delay="0s"
          onClick={() => handlePlanetClick('cortex')}
          description="Knowledge & Memory"
        />
        <OrbitPlanet
          mode="cluepath"
          label="🕵️ CluePath"
          color="purple"
          radius="39%"
          duration="18s"
          delay="-4s"
          onClick={() => handlePlanetClick('cluepath')}
          description="Story & Problem Solving"
        />
        <OrbitPlanet
          mode="pathfinder"
          label="🧭 Pathfinder"
          color="green"
          radius="32%"
          duration="22s"
          delay="-8s"
          onClick={() => handlePlanetClick('pathfinder')}
          description="Exploration"
        />
        <OrbitPlanet
          mode="reflex"
          label="⚡ Reflex"
          color="orange"
          radius="25%"
          duration="12s"
          delay="-2s"
          onClick={() => handlePlanetClick('reflex')}
          description="Educational Arcade"
        />

        {/* MixUp satellite */}
        <div
          className="mixup-wrapper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            animation: 'spin 8s linear infinite',
            width: '100%',
            height: '100%',
          }}
        >
          <button
            onClick={() => handlePlanetClick('mixup')}
            className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 shadow-lg flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform duration-300"
            style={{
              transform: 'translate(-50%, -50%) rotate(0deg) translateX(18%) translateX(-50%) translateY(-50%)',
            }}
          >
            🎲
          </button>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest uppercase">
        Tap a planet to begin
      </div>
    </div>
  );
};

// ------ Planet component ------
const OrbitPlanet = ({ mode, label, color, radius, duration, delay, onClick, description }) => {
  const colorMap = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    green: 'from-green-500 to-teal-600',
    orange: 'from-orange-500 to-red-600',
  };

  const glowMap = {
    blue: 'rgba(59,130,246,0.6)',
    purple: 'rgba(168,85,247,0.6)',
    green: 'rgba(34,197,94,0.6)',
    orange: 'rgba(249,115,22,0.6)',
  };

  const containerSize = parseFloat(radius) * 2;

  return (
    <div
      className="orbit-wrapper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        width: `${containerSize}%`,
        height: `${containerSize}%`,
        animation: `spin ${duration} linear ${delay} infinite`,
      }}
    >
      <div
        className="planet pointer-events-auto absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer group"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          marginTop: '-40px',
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, ${colorMap[color].split(' ')[1]} 100%)`,
          boxShadow: `0 0 30px ${glowMap[color]}, inset -8px -8px 20px rgba(0,0,0,0.3)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s',
        }}
        onClick={onClick}
      >
        <span className="text-2xl">{label.split(' ')[0]}</span>
        <span className="text-[8px] font-bold text-white/90 uppercase tracking-wider mt-0.5">
          {label.split(' ')[1] || ''}
        </span>
        <span className="text-[6px] text-white/60 uppercase tracking-wider mt-0.5 hidden group-hover:block">
          {description}
        </span>
        <div className="absolute inset-[-8px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-white/40"></div>
      </div>
    </div>
  );
};

// ------ CSS animations ------
const styles = `
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse-slow {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.05); opacity: 1; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
  .stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background-image: 
      radial-gradient(2px 2px at 20px 30px, #eee, transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 40px, #fff, transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
      radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
    background-size: 200px 100px;
    background-repeat: repeat;
  }
  .stars2 {
    background-image: 
      radial-gradient(1px 1px at 10px 10px, #fff, transparent),
      radial-gradient(1px 1px at 60px 150px, rgba(255,255,255,0.5), transparent);
    background-size: 300px 200px;
  }
  .stars3 {
    background-image: 
      radial-gradient(1px 1px at 80px 120px, #fff, transparent),
      radial-gradient(1px 1px at 150px 50px, rgba(255,255,255,0.7), transparent);
    background-size: 400px 300px;
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}

export default OrbitPage;