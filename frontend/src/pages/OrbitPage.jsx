// frontend/src/pages/OrbitPage.jsx
// ✅ COMPLETE - With Activity Selection + Universe Background

import React, { useState, useEffect, useCallback, useRef } from 'react';
import orbitApi from '../services/orbitApi';
import OrbitActivities from '../components/orbit/OrbitActivities';
import './OrbitPage.css';

// ========== UNIVERSE BACKGROUND COMPONENTS ==========
const Starfield = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let stars = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const createStars = () => {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 1500);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          brightness: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };
    createStars();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() / 1000;

      stars.forEach(star => {
        const twinkle = Math.sin(time * star.speed + star.phase) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      // Shooting stars (rare)
      if (Math.random() < 0.001) {
        const s = stars[Math.floor(Math.random() * stars.length)];
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - 40, s.y - 40);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        s.x = Math.random() * canvas.width;
        s.y = Math.random() * canvas.height;
      }

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #0a0e1a 0%, #000000 100%)' }}
    />
  );
};

const NebulaOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse" />
    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full bg-pink-500/15 blur-3xl animate-pulse delay-2000" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse delay-500" />
  </div>
);
// ==================================================

const OrbitPage = () => {
  // ✅ ALL YOUR EXISTING STATE
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [session, setSession] = useState(null);
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showActivitySelection, setShowActivitySelection] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [apiReady, setApiReady] = useState(false);

  // Planets (unchanged)
  const planets = [
    { id: 'cortex', label: 'Cortex', subtitle: 'Knowledge & Memory', color: '#6C63FF', icon: '🧠', bg: 'rgba(108, 99, 255, 0.1)' },
    { id: 'cluepath', label: 'CluePath', subtitle: 'Story & Problem Solving', color: '#FF6B6B', icon: '🕵️', bg: 'rgba(255, 107, 107, 0.1)' },
    { id: 'pathfinder', label: 'Pathfinder', subtitle: 'Exploration', color: '#4ECDC4', icon: '🧭', bg: 'rgba(78, 205, 196, 0.1)' },
    { id: 'reflex', label: 'Reflex', subtitle: 'Educational Arcade', color: '#FFE66D', icon: '⚡', bg: 'rgba(255, 230, 109, 0.1)' },
  ];

  // ✅ ALL YOUR EXISTING FUNCTIONS (unchanged)
  useEffect(() => {
    const checkApi = async () => {
      try {
        const hasStartSession = typeof orbitApi?.startSession === 'function';
        const hasGetProgress = typeof orbitApi?.getProgress === 'function';
        
        if (hasStartSession && hasGetProgress) {
          setApiReady(true);
          console.log('✅ Orbit API is ready!');
          await fetchProgress();
        } else {
          console.error('❌ Orbit API is NOT ready!');
          setError('API not ready. Please refresh the page.');
        }
      } catch (err) {
        console.error('API check failed:', err);
        setError('Failed to initialize Orbit API');
      }
    };
    
    checkApi();
  }, []);

  const fetchProgress = async () => {
    try {
      console.log('📈 Fetching progress...');
      const data = await orbitApi.getProgress();
      console.log('📊 Progress data:', data);
      setProgress(data?.progress || null);
    } catch (err) {
      console.warn('⚠️ Could not load progress:', err.message);
    }
  };

  const handlePlanetClick = useCallback((planet) => {
    if (!apiReady) {
      setError('API is not ready. Please refresh the page.');
      return;
    }

    setSelectedPlanet(planet);
    setShowActivitySelection(true);
    setSelectedActivity(null);
    setSession(null);
    setActivities([]);
    setCurrentActivity(null);
    setError(null);
    setShowSummary(false);
    setUserAnswer('');
  }, [apiReady]);

  const handleActivitySelect = useCallback(async (activityType) => {
    if (!selectedPlanet) return;

    setSelectedActivity(activityType);
    setShowActivitySelection(false);
    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 Starting ${selectedPlanet.label} with ${activityType}...`);
      const result = await orbitApi.startSession(
        selectedPlanet.id,
        `Exploring ${selectedPlanet.label}`,
        selectedPlanet.id,
        activityType
      );
      
      console.log('✅ Session started:', result);
      
      if (result?.session) {
        setSession(result.session);
      } else {
        console.warn('⚠️ No session returned');
        setError('Failed to create session');
      }
      
      if (result?.activity) {
        setActivities([result.activity]);
        setCurrentActivity(result.activity);
      }
    } catch (err) {
      console.error('❌ Error starting session:', err);
      setError(err.message || 'Failed to start Orbit session');
      setShowActivitySelection(true);
    } finally {
      setLoading(false);
    }
  }, [selectedPlanet]);

  const handleGenerateNext = useCallback(async () => {
    if (!session) {
      console.warn('⚠️ No active session');
      setError('No active session. Start a new session first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🎯 Generating next activity...`);
      const result = await orbitApi.generateActivity(session.id, selectedActivity || 'quiz');
      
      if (result?.activity) {
        setActivities(prev => [...prev, result.activity]);
        setCurrentActivity(result.activity);
        setUserAnswer('');
      }
    } catch (err) {
      console.error('❌ Error generating activity:', err);
      setError(err.message || 'Failed to generate next activity');
    } finally {
      setLoading(false);
    }
  }, [session, selectedActivity]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!session) {
      setError('No active session. Start a new session first.');
      return;
    }
    
    if (!currentActivity) {
      setError('No active activity to answer.');
      return;
    }

    if (!userAnswer.trim()) {
      setError('Please enter an answer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`✅ Submitting answer...`);
      const result = await orbitApi.submitAnswer(
        currentActivity.id,
        userAnswer,
        10
      );

      console.log('📊 Submit result:', result);
      
      if (result?.isCorrect !== undefined) {
        alert(result.isCorrect ? '✅ Correct! Well done!' : '❌ Incorrect. Keep learning!');
      }

      await handleGenerateNext();
    } catch (err) {
      console.error('❌ Error submitting answer:', err);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  }, [session, currentActivity, userAnswer, handleGenerateNext]);

  const handleEndSession = useCallback(async () => {
    if (!session) {
      setError('No active session to end.');
      return;
    }

    setLoading(true);
    try {
      console.log(`🏁 Ending session...`);
      await orbitApi.endSession(
        session.id,
        85,
        10,
        8,
        120
      );
      setShowSummary(true);
      setSession(null);
      setCurrentActivity(null);
      await fetchProgress();
    } catch (err) {
      console.error('❌ Error ending session:', err);
      setError(err.message || 'Failed to end session');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const handleReset = useCallback(() => {
    setSelectedPlanet(null);
    setSelectedActivity(null);
    setSession(null);
    setActivities([]);
    setCurrentActivity(null);
    setShowSummary(false);
    setShowActivitySelection(false);
    setError(null);
    setUserAnswer('');
  }, []);

  const renderActivityContent = (activity) => {
    if (!activity) return <p>No activity data</p>;

    let content = activity.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        return <p>{content}</p>;
      }
    }

    if (!content || typeof content !== 'object') {
      return <p>Invalid activity content</p>;
    }

    return (
      <div className="activity-content">
        {content.title && <h3>{content.title}</h3>}
        {content.description && <p>{content.description}</p>}
        {content.questions && content.questions.length > 0 && (
          <div className="questions-container">
            {content.questions.map((q, idx) => (
              <div key={idx} className="question-item">
                <p><strong>Q{idx + 1}:</strong> {q.question}</p>
                {q.options && (
                  <ul className="options-list">
                    {q.options.map((opt, optIdx) => (
                      <li key={optIdx}>{opt}</li>
                    ))}
                  </ul>
                )}
                {q.explanation && (
                  <p className="explanation">💡 {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {content.cards && content.cards.length > 0 && (
          <div className="flashcards-container">
            {content.cards.map((card, idx) => (
              <div key={idx} className="flashcard-item">
                <strong>{card.term}</strong>
                <p>{card.definition}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div className="orbit-page relative min-h-screen bg-transparent">
      {/* 🌌 Universe Background */}
      <Starfield />
      <NebulaOverlay />

      {/* Content – with z-index to sit above background */}
      <div className="relative z-10">
        {/* Header */}
        <header className="orbit-header">
          <h1>🚀 Orbit Learning</h1>
          {progress && (
            <div className="progress-stats">
              <span>📚 {progress.sessions?.total_sessions || 0} sessions</span>
              <span>⭐ {progress.sessions?.total_score || 0} XP</span>
              <span>🏆 {progress.mastery?.length || 0} topics</span>
            </div>
          )}
        </header>

        {/* Solar System */}
        <div className="solar-system">
          <div className="orbit-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>

          <div className="life-core">
            <span className="core-icon">☀️</span>
            <span className="core-label">Life Core</span>
            {session && <span className="core-status">Active</span>}
          </div>

          <div className="planets-container">
            {planets.map((planet) => (
              <button
                key={planet.id}
                className={`planet ${selectedPlanet?.id === planet.id ? 'active' : ''} 
                           ${session || showActivitySelection ? 'disabled' : ''}`}
                style={{ 
                  '--planet-color': planet.color,
                  '--planet-bg': planet.bg,
                }}
                onClick={() => handlePlanetClick(planet)}
                disabled={loading || !!session || !apiReady || showActivitySelection}
              >
                <div className="planet-glow"></div>
                <span className="planet-icon">{planet.icon}</span>
                <span className="planet-label">{planet.label}</span>
                <span className="planet-subtitle">{planet.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Selection */}
        {showActivitySelection && selectedPlanet && !session && (
          <div className="activity-selection-container">
            <button 
              className="back-btn"
              onClick={() => {
                setShowActivitySelection(false);
                setSelectedPlanet(null);
              }}
            >
              ← Back to Planets
            </button>
            <div className="orbit-activities-wrapper">
              <div className="orbit-activities-header">
                <div className="orbit-activities-title">
                  <span className="orbit-icon">{selectedPlanet.icon}</span>
                  <div>
                    <h3>{selectedPlanet.label}</h3>
                    <p>{selectedPlanet.subtitle}</p>
                  </div>
                </div>
              </div>
              <OrbitActivities
                orbitType={selectedPlanet.id}
                onSelectActivity={handleActivitySelect}
              />
            </div>
          </div>
        )}

        {/* Session Content */}
        {session && !showSummary && (
          <div className="session-container">
            <div className="session-content">
              <div className="session-header">
                <div className="session-info">
                  <h2>{selectedPlanet?.label} - {selectedPlanet?.subtitle}</h2>
                  <span className="session-status">Active</span>
                  {selectedActivity && (
                    <span className="activity-type-badge">
                      {selectedActivity.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                <button onClick={handleEndSession} className="btn-danger" disabled={loading}>
                  End Session
                </button>
              </div>

              {currentActivity && (
                <div className="activity-container">
                  <div className="activity-card">
                    <div className="activity-badge">
                      {currentActivity.activity_type || 'Activity'}
                    </div>
                    {renderActivityContent(currentActivity)}
                  </div>

                  <div className="answer-section">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="answer-input"
                      rows={3}
                      disabled={loading}
                    />
                    <button 
                      onClick={handleSubmitAnswer}
                      className="btn-primary"
                      disabled={loading || !userAnswer.trim()}
                    >
                      {loading ? 'Submitting...' : 'Submit Answer →'}
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={handleGenerateNext}
                className="btn-secondary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Next Activity →'}
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {showSummary && (
          <div className="session-summary">
            <h2>🎉 Session Complete!</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{activities.length}</span>
                <span className="stat-label">Activities</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{selectedPlanet?.label}</span>
                <span className="stat-label">Orbit</span>
              </div>
            </div>
            <button onClick={handleReset} className="btn-primary">
              Start New Session
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-container">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="error-dismiss">✕</button>
            </div>
          </div>
        )}

        {/* Welcome */}
        {!session && !showActivitySelection && !showSummary && !loading && !error && apiReady && (
          <div className="welcome-section">
            <p className="welcome-text">🌍 Click a planet to start your orbit journey!</p>
            <div className="feature-grid">
              <div className="feature-item">
                <span>🧠</span>
                <p>AI-Powered Learning</p>
              </div>
              <div className="feature-item">
                <span>🎮</span>
                <p>Gamified Experience</p>
              </div>
              <div className="feature-item">
                <span>📊</span>
                <p>Track Your Progress</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrbitPage;