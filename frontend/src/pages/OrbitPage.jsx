// frontend/src/pages/OrbitPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orbitApi } from '../services/orbitApi';
import LifeCore from '../components/orbit/LifeCore';
import OrbitPlanet from '../components/orbit/OrbitPlanet';
import OrbitActivities from '../components/orbit/OrbitActivities';
import OrbitActivityRenderer from '../components/orbit/OrbitActivityRenderer';
import { Loader2, ArrowLeft } from 'lucide-react';

const ORBIT_PLANETS = [
  { id: 'cortex', name: 'Cortex', icon: '🧠', color: '#8B5CF6' },
  { id: 'cluepath', name: 'CluePath', icon: '🕵️', color: '#F59E0B' },
  { id: 'pathfinder', name: 'Pathfinder', icon: '🧭', color: '#10B981' },
  { id: 'reflex', name: 'Reflex', icon: '⚡', color: '#EF4444' },
];

const OrbitPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [subject, setSubject] = useState(location.state?.subject || 'Select Subject');
  const [topic, setTopic] = useState(location.state?.topic || '');
  const [progress, setProgress] = useState(0);
  const [selectedOrbit, setSelectedOrbit] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
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

  const handleOrbitSelect = async (orbitId, activityType) => {
    setLoading(true);
    try {
      // Start session
      const session = await orbitApi.startSession(
        subject || 'General',
        topic || 'Learning',
        orbitId,
        activityType || 'quiz'
      );
      setSessionId(session.sessionId);
      setSelectedOrbit(orbitId);

      // Generate first activity
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
      // If no session, start one
      await handleOrbitSelect(selectedOrbit, activityType);
      return;
    }
    setLoading(true);
    try {
      const act = await orbitApi.generateActivity(sessionId, activityType);
      setActivity(act.activity);
      setSelectedActivity(activityType);
    } catch (error) {
      console.error('Error generating activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySubmit = async (answers) => {
    if (!activity) return;
    try {
      const result = await orbitApi.submitAnswer(activity.id, answers, 30);
      // Update session progress
      const progressData = await orbitApi.getProgress();
      if (progressData.mastery && progressData.mastery.length > 0) {
        const mastered = progressData.mastery.find(
          m => m.subject === subject && m.topic === topic
        );
        if (mastered) setProgress(mastered.mastery_level);
      }
      // Show summary after some activities (or when user ends session)
      // For now, just set activity to null to go back
      setActivity(null);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleBack = () => {
    if (activity) {
      setActivity(null);
      setSelectedActivity(null);
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
      <div className="min-h-screen flex items-center justify-center bg-black/60">
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

  // If an activity is active, render it
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

  // If an orbit is selected, show activities
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
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white/40 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">🌌 Orbit</h1>
        </div>

        {/* Life Core + Planets */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
          {/* Life Core */}
          <div className="mb-8">
            <LifeCore
              subject={subject}
              topic={topic}
              progress={progress}
              onBack={null}
            />
          </div>

          {/* Planet Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-3xl">
            {ORBIT_PLANETS.map((planet) => (
              <OrbitPlanet
                key={planet.id}
                name={planet.name}
                icon={planet.icon}
                color={planet.color}
                activities={[]} // we don't show counts initially
                onSelect={() => handleOrbitSelect(planet.id)}
                isActive={false}
              />
            ))}
          </div>

          {/* Instruction */}
          <p className="mt-8 text-sm text-white/30 text-center">
            Tap a planet to explore its learning activities
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrbitPage;