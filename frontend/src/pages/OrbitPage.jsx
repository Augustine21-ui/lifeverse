// frontend/src/pages/OrbitPage.jsx
// ✅ Complete fix with proper state handling

import React, { useState, useEffect, useCallback } from 'react';
import orbitApi from '../services/orbitApi';
import './OrbitPage.css';

const OrbitPage = () => {
  // ✅ All state is defined here
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [session, setSession] = useState(null);  // ✅ Defined!
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [apiReady, setApiReady] = useState(false);

  // Planets configuration
  const planets = [
    { id: 'cortex', label: 'Cortex', subtitle: 'Knowledge & Memory', color: '#6C63FF', icon: '🧠', bg: 'rgba(108, 99, 255, 0.1)' },
    { id: 'cluepath', label: 'CluePath', subtitle: 'Story & Problem Solving', color: '#FF6B6B', icon: '🕵️', bg: 'rgba(255, 107, 107, 0.1)' },
    { id: 'pathfinder', label: 'Pathfinder', subtitle: 'Exploration', color: '#4ECDC4', icon: '🧭', bg: 'rgba(78, 205, 196, 0.1)' },
    { id: 'reflex', label: 'Reflex', subtitle: 'Educational Arcade', color: '#FFE66D', icon: '⚡', bg: 'rgba(255, 230, 109, 0.1)' },
  ];

  // Check API on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const hasStartSession = typeof orbitApi.startSession === 'function';
        const hasGetProgress = typeof orbitApi.getProgress === 'function';
        
        if (hasStartSession && hasGetProgress) {
          setApiReady(true);
          console.log('✅ Orbit API is ready!');
          // Load progress
          await fetchProgress();
        } else {
          console.error('❌ Orbit API is NOT ready!');
          setError('API not ready. Please refresh the page.');
        }
      } catch (err) {
        console.error('API check failed:', err);
      }
    };
    
    checkApi();
  }, []);

  // Fetch progress
  const fetchProgress = async () => {
    try {
      console.log('📈 Fetching progress...');
      const data = await orbitApi.getProgress();
      console.log('📊 Progress data:', data);
      setProgress(data?.progress || null);
    } catch (err) {
      console.warn('⚠️ Could not load progress:', err.message);
      // If "column mastered does not exist", we still continue
      if (err.message?.includes('mastered')) {
        console.warn('⚠️ Database missing "mastered" column - run the ALTER TABLE command');
      }
    }
  };

  // Handle planet click
  const handlePlanetClick = useCallback(async (planet) => {
    if (!apiReady) {
      setError('API is not ready. Please refresh the page.');
      return;
    }

    setSelectedPlanet(planet);
    setLoading(true);
    setError(null);
    setShowSummary(false);
    setActivities([]);
    setCurrentActivity(null);

    try {
      console.log(`🚀 Starting ${planet.label} orbit...`);
      const result = await orbitApi.startSession(
        planet.id,
        `Exploring ${planet.label}`,
        planet.id,
        'introduction'
      );
      
      console.log('✅ Session started:', result);
      setSession(result?.session || null);
      
      if (result?.activity) {
        setActivities([result.activity]);
        setCurrentActivity(result.activity);
      }
    } catch (err) {
      console.error('❌ Error starting session:', err);
      setError(err.message || 'Failed to start Orbit session');
    } finally {
      setLoading(false);
    }
  }, [apiReady]);

  // Generate next activity
  const handleGenerateNext = useCallback(async () => {
    if (!session) {
      console.warn('⚠️ No active session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🎯 Generating next activity...`);
      const result = await orbitApi.generateActivity(session.id, 'quiz');
      
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
  }, [session]);

  // Submit answer
  const handleSubmitAnswer = useCallback(async () => {
    if (!session || !currentActivity) {
      console.warn('⚠️ No session or activity');
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
        10 // time taken in seconds
      );

      console.log('📊 Submit result:', result);
      
      // Show feedback
      if (result.isCorrect !== undefined) {
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

  // End session
  const handleEndSession = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      console.log(`🏁 Ending session...`);
      await orbitApi.endSession(
        session.id,
        85, // score
        10, // totalQuestions
        8,  // correctAnswers
        120 // timeSpent
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

  // Reset
  const handleReset = useCallback(() => {
    setSelectedPlanet(null);
    setSession(null);
    setActivities([]);
    setCurrentActivity(null);
    setShowSummary(false);
    setError(null);
    setUserAnswer('');
  }, []);

  // Render activity content
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
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="orbit-page">
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

        <div className="life-core" onClick={() => !session && handleReset()}>
          <span className="core-icon">☀️</span>
          <span className="core-label">Life Core</span>
          {session && <span className="core-status">Active</span>}
        </div>

        <div className="planets-container">
          {planets.map((planet) => (
            <button
              key={planet.id}
              className={`planet ${selectedPlanet?.id === planet.id ? 'active' : ''} 
                         ${session ? 'disabled' : ''}`}
              style={{ 
                '--planet-color': planet.color,
                '--planet-bg': planet.bg,
              }}
              onClick={() => handlePlanetClick(planet)}
              disabled={loading || !!session || !apiReady}
            >
              <div className="planet-glow"></div>
              <span className="planet-icon">{planet.icon}</span>
              <span className="planet-label">{planet.label}</span>
              <span className="planet-subtitle">{planet.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Session Content */}
      {session && !showSummary && (
        <div className="session-container">
          <div className="session-content">
            <div className="session-header">
              <div className="session-info">
                <h2>{selectedPlanet?.label} - {selectedPlanet?.subtitle}</h2>
                <span className="session-status">Active</span>
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
          </div>
          <button onClick={handleReset} className="btn-primary">
            Start New Session
          </button>
        </div>
      )}

      {/* Loading Overlay */}
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
      {!session && !showSummary && !loading && !error && apiReady && (
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
  );
};

export default OrbitPage;