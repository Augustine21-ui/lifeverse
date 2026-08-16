// frontend/src/pages/OrbitPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orbitApi } from '../services/orbitApi';
import LifeCore from '../components/orbit/LifeCore';
import OrbitActivities from '../components/orbit/OrbitActivities';
import OrbitActivityRenderer from '../components/orbit/OrbitActivityRenderer';
import { Loader2, ArrowLeft } from 'lucide-react';

const ORBIT_PLANETS = [
  { id: 'cortex', name: 'Cortex', icon: '🧠', color: '#8B5CF6' },
  { id: 'cluepath', name: 'CluePath', icon: '🕵️', color: '#F59E0B' },
  { id: 'pathfinder', name: 'Pathfinder', icon: '🧭', color: '#10B981' },
  { id: 'reflex', name: 'Reflex', icon: '⚡', color: '#EF4444' },
];

// Planet positions (percentage-based)
const PLANET_POSITIONS = [
  { top: '12%', left: '50%' },   // Cortex (top)
  { top: '50%', left: '88%' },   // CluePath (right)
  { top: '88%', left: '50%' },   // Pathfinder (bottom)
  { top: '50%', left: '12%' },   // Reflex (left)
];

const OrbitPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [subject, setSubject] = useState(location.state?.subject || 'Select Subject');
  const [topic, setTopic] = useState(location.state?.topic || '');
  const [progress, setProgress] = useState(0);
  const [selectedOrbit, setSelectedOrbit] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);

  // Auto-launch from StudySphere
  useEffect(() => {
    if (location.state?.autoLaunch) {
      const orbit = location.state.orbitType || 'cortex';
      const activityType = location.state.activityType || 'quiz';
      handleOrbitSelect(orbit, activityType);
    }
  }, [location.state]);

  // Fetch progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await orbitApi.getProgress();
        if (data.mastery && data.mastery.length > 0) {
          const matched = data.mastery.find(
            m => m.subject === subject && m.topic === topic
          );
          if (matched) setProgress(matched.mastery_level);
        }
      } catch (err) {
        console.error('Failed to fetch orbit progress:', err);
      }
    };
    if (subject !== 'Select Subject') fetchProgress();
  }, [subject, topic]);

  const handleOrbitSelect = async (orbitId, activityType) => {
    setLoading(true);
    try {
      const session = await orbitApi.startSession(
        subject || 'General',
        topic || 'Learning',
        orbitId,
        activityType || 'quiz'
      );
      setSessionId(session.sessionId);
      setSelectedOrbit(orbitId);
      const act = await orbitApi.generateActivity(session.sessionId, activityType || 'quiz');
      setActivity(act.activity);
    } catch (error) {
      console.error('Error starting orbit session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySelect = async (activityType) => {
    if (!sessionId) {
      await handleOrbitSelect(selectedOrbit, activityType);
      return;
    }
    setLoading(true);
    try {
      const act = await orbitApi.generateActivity(sessionId, activityType);
      setActivity(act.activity);
    } catch (error) {
      console.error('Error generating activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySubmit = async (answers) => {
    if (!activity) return;
    try {
      await orbitApi.submitAnswer(activity.id, answers, 30);
      const progressData = await orbitApi.getProgress();
      if (progressData.mastery && progressData.mastery.length > 0) {
        const mastered = progressData.mastery.find(
          m => m.subject === subject && m.topic === topic
        );
        if (mastered) setProgress(mastered.mastery_level);
      }
      setActivity(null);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleBack = () => {
    if (activity) {
      setActivity(null);
    } else if (selectedOrbit) {
      setSelectedOrbit(null);
    } else {
      navigate('/dashboard');
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      const result = await orbitApi.endSession(sessionId, 0, 0, 0, 0);
      setSessionResult(result);
      setShowSummary(true);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/80">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  if (showSummary && sessionResult) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🎉 Session Complete</h2>
            <p className="text-white/60">Score: {sessionResult.score}%</p>
            <p className="text-white/60">XP Earned: {sessionResult.xpEarned}</p>
            <button
              onClick={() => { setShowSummary(false); setSessionResult(null); setSelectedOrbit(null); setSessionId(null); }}
              className="mt-6 px-6 py-3 bg-brand-500 text-white rounded-xl hover:opacity-90 transition"
            >
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activity) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          <OrbitActivityRenderer
            activity={activity}
            onSubmit={handleActivitySubmit}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  if (selectedOrbit) {
    const planet = ORBIT_PLANETS.find(p => p.id === selectedOrbit);
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition">
            <ArrowLeft size={18} /> Back to Solar System
          </button>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl">{planet?.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{planet?.name} Orbit</h2>
                <p className="text-sm text-white/40">Select an activity to start learning</p>
              </div>
            </div>
            <OrbitActivities
              orbitType={selectedOrbit}
              onSelectActivity={handleActivitySelect}
            />
            <button
              onClick={handleEndSession}
              className="mt-6 text-sm text-white/30 hover:text-white/60 transition"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Solar System View ----
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Cosmic background with stars */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-black to-blue-900/20 z-0" />
      <div className="absolute inset-0 z-0">
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 z-20 text-white/40 hover:text-white transition flex items-center gap-2 text-sm"
      >
        <ArrowLeft size={18} /> Dashboard
      </button>

      {/* Solar System Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="relative w-full max-w-4xl aspect-square">
          {/* Rotating Orbit Rings */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[10%] border border-white/10 rounded-full animate-spin-slow" />
            <div className="absolute inset-[20%] border border-white/5 rounded-full animate-spin-reverse" style={{ animationDuration: '25s' }} />
            <div className="absolute inset-[30%] border border-white/5 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />
          </div>

          {/* Planets */}
          {ORBIT_PLANETS.map((planet, index) => {
            const pos = PLANET_POSITIONS[index] || { top: '50%', left: '50%' };
            return (
              <div
                key={planet.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform duration-300"
                style={{ top: pos.top, left: pos.left }}
                onClick={() => handleOrbitSelect(planet.id)}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-2xl"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${planet.color}80, ${planet.color}30)`,
                      boxShadow: `0 0 40px ${planet.color}40, inset 0 0 30px ${planet.color}20`,
                      border: `2px solid ${planet.color}60`,
                    }}
                  >
                    <span className="relative z-10">{planet.icon}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white/80 mt-2 text-center">{planet.name}</span>
                  <span className="text-[10px] text-white/30">0 activities</span>
                </div>
              </div>
            );
          })}

          {/* Life Core – centered */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <LifeCore
              subject={subject}
              topic={topic}
              progress={progress}
              onBack={null}
            />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 text-xs text-white/20 text-center">
        Tap a planet to explore its learning activities
      </div>
    </div>
  );
};

export default OrbitPage;