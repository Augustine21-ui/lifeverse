// frontend/src/pages/OrbitPage.jsx
// ⚠️ REPLACE ENTIRE FILE WITH THIS

import React, { useState, useEffect, useCallback } from 'react';
// ✅ IMPORT USING DEFAULT IMPORT
import orbitApi from '../services/orbitApi';
import './OrbitPage.css';

const OrbitPage = () => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [session, setSession] = useState(null);
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [apiReady, setApiReady] = useState(false);

  // Planet configuration
  const planets = [
    { id: 'mind', label: 'Mind', color: '#6C63FF', icon: '🧠', bg: 'rgba(108, 99, 255, 0.1)' },
    { id: 'body', label: 'Body', color: '#FF6B6B', icon: '💪', bg: 'rgba(255, 107, 107, 0.1)' },
    { id: 'spirit', label: 'Spirit', color: '#4ECDC4', icon: '✨', bg: 'rgba(78, 205, 196, 0.1)' },
    { id: 'social', label: 'Social', color: '#FFE66D', icon: '🤝', bg: 'rgba(255, 230, 109, 0.1)' },
  ];

  // ============================================================
  // CHECK API ON MOUNT
  // ============================================================
  useEffect(() => {
    console.log('🔍 OrbitPage mounted');
    console.log('📦 orbitApi:', Object.keys(orbitApi));
    console.log('🧪 orbitApi.startSession:', typeof orbitApi.startSession);
    console.log('🧪 orbitApi.getProgress:', typeof orbitApi.getProgress);
    
    // Check if the API methods are available
    const hasStartSession = typeof orbitApi.startSession === 'function';
    const hasGetProgress = typeof orbitApi.getProgress === 'function';
    
    if (hasStartSession && hasGetProgress) {
      setApiReady(true);
      console.log('✅ Orbit API is ready!');
    } else {
      console.error('❌ Orbit API is NOT ready!');
      setError('API not ready. Please refresh the page.');
    }
  }, []);

  // ============================================================
  // LOAD PROGRESS
  // ============================================================
  useEffect(() => {
    if (!apiReady) return;

    const fetchProgress = async () => {
      try {
        console.log('📈 Fetching progress...');
        const data = await orbitApi.getProgress();
        console.log('📊 Progress data:', data);
        setProgress(data?.progress || null);
      } catch (err) {
        console.warn('⚠️ Could not load progress:', err.message);
        // Don't set error here - this is non-critical
      }
    };
    fetchProgress();
  }, [apiReady]);

  // ============================================================
  // HANDLE PLANET CLICK
  // ============================================================
  const handlePlanetClick = useCallback(async (planet) => {
    console.log(`🌍 Clicked planet: ${planet.id} - ${planet.label}`);
    
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
      console.log('🚀 Calling orbitApi.startSession...');
      const result = await orbitApi.startSession(
        planet.id,
        `Exploring ${planet.label}`,
        'exploration',
        'introduction'
      );
      
      console.log('✅ Session started:', result);
      setSession(result?.session || null);
      
      if (result?.activity) {
        setActivities([result.activity]);
        setCurrentActivity(result.activity);
        console.log('📝 First activity:', result.activity);
      } else {
        console.warn('⚠️ No activity returned from startSession');
      }
    } catch (err) {
      console.error('❌ Error starting orbit session:', err);
      setError(err.message || 'Failed to start Orbit session');
    } finally {
      setLoading(false);
    }
  }, [apiReady]);

  // ============================================================
  // GENERATE NEXT ACTIVITY
  // ============================================================
  const handleGenerateNext = useCallback(async () => {
    if (!session) {
      console.warn('⚠️ No active session to generate activity');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🎯 Generating next activity for session: ${session.id}`);
      const result = await orbitApi.generateActivity(session.id);
      
      if (result?.activity) {
        setActivities(prev => [...prev, result.activity]);
        setCurrentActivity(result.activity);
        setUserAnswer('');
        console.log('📝 New activity generated:', result.activity);
      } else {
        console.warn('⚠️ No activity returned from generateActivity');
      }
    } catch (err) {
      console.error('❌ Error generating activity:', err);
      setError(err.message || 'Failed to generate next activity');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================
  const handleSubmitAnswer = useCallback(async () => {
    if (!session || !currentActivity) {
      console.warn('⚠️ No session or activity to submit');
      return;
    }

    if (!userAnswer.trim()) {
      setError('Please enter an answer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`✅ Submitting answer for activity: ${currentActivity.id}`);
      const result = await orbitApi.submitActivity(
        session.id,
        currentActivity.id,
        userAnswer
      );

      console.log('📊 Submit result:', result);
      
      // Show feedback
      if (result.isCorrect !== undefined) {
        const message = result.isCorrect 
          ? '✅ Correct! Well done!' 
          : `❌ ${result.feedback || 'Incorrect. Keep learning!'}`;
        alert(message);
      }

      // Move to next activity
      await handleGenerateNext();
    } catch (err) {
      console.error('❌ Error submitting answer:', err);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  }, [session, currentActivity, userAnswer, handleGenerateNext]);

  // ============================================================
  // END SESSION
  // ============================================================
  const handleEndSession = useCallback(async () => {
    if (!session) {
      console.warn('⚠️ No session to end');
      return;
    }

    setLoading(true);
    try {
      console.log(`🏁 Ending session: ${session.id}`);
      await orbitApi.endSession(session.id);
      setShowSummary(true);
      setSession(null);
      setCurrentActivity(null);
      
      // Reload progress
      try {
        const data = await orbitApi.getProgress();
        setProgress(data?.progress || null);
      } catch (e) {
        console.warn('⚠️ Could not reload progress:', e.message);
      }
    } catch (err) {
      console.error('❌ Error ending session:', err);
      setError(err.message || 'Failed to end session');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // ============================================================
  // RESET
  // ============================================================
  const handleReset = useCallback(() => {
    setSelectedPlanet(null);
    setSession(null);
    setActivities([]);
    setCurrentActivity(null);
    setShowSummary(false);
    setError(null);
    setUserAnswer('');
  }, []);

  // ============================================================
  // RENDER ACTIVITY CONTENT
  // ============================================================
  const renderActivityContent = (activity) => {
    if (!activity) {
      return <p>No activity data available</p>;
    }

    let content = activity.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        // If it's not valid JSON, use it as a string
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
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
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

      {/* API Status */}
      {!apiReady && (
        <div className="api-status">
          <span>⏳ Loading API...</span>
        </div>
      )}

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
          {planets.map((planet, index) => (
            <button
              key={planet.id}
              className={`planet ${selectedPlanet?.id === planet.id ? 'active' : ''} 
                         ${session ? 'disabled' : ''}`}
              style={{ 
                '--planet-color': planet.color,
                '--planet-bg': planet.bg,
                animationDelay: `${index * 0.5}s`,
              }}
              onClick={() => handlePlanetClick(planet)}
              disabled={loading || !!session || !apiReady}
              title={
                !apiReady ? 'Loading API...' :
                session ? 'Complete current session first' : 
                `Start ${planet.label} orbit`
              }
            >
              <div className="planet-glow"></div>
              <span className="planet-icon">{planet.icon}</span>
              <span className="planet-label">{planet.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Session Content */}
      {(session || showSummary) && !error && (
        <div className="session-container">
          {showSummary ? (
            <div className="session-summary">
              <h2>🎉 Session Complete!</h2>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-value">{activities.length}</span>
                  <span className="stat-label">Activities</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{session?.subject || 'N/A'}</span>
                  <span className="stat-label">Subject</span>
                </div>
              </div>
              <button onClick={handleReset} className="btn-primary">
                Start New Session
              </button>
            </div>
          ) : (
            <div className="session-content">
              <div className="session-header">
                <div className="session-info">
                  <h2>
                    {session?.subject || 'Unknown'} - {session?.topic || 'Exploring'}
                  </h2>
                  <span className="session-status">Active</span>
                </div>
                <div className="session-actions">
                  <span className="activity-count">
                    Activity {activities.length}
                  </span>
                  <button 
                    onClick={handleEndSession} 
                    className="btn-danger"
                    disabled={loading}
                  >
                    End Session
                  </button>
                </div>
              </div>

              {/* Current Activity */}
              {currentActivity && (
                <div className="activity-container">
                  <div className="activity-card">
                    <div className="activity-badge">
                      {currentActivity.activity_type || 'Challenge'}
                    </div>
                    {renderActivityContent(currentActivity)}
                  </div>

                  {/* Answer Input */}
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

              {/* Generate Next Button */}
              {currentActivity && (
                <button 
                  onClick={handleGenerateNext}
                  className="btn-secondary"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Skip & Generate Next →'}
                </button>
              )}

              {/* Activity History */}
              {activities.length > 1 && (
                <div className="activity-history">
                  <h4>📜 Activity History</h4>
                  <div className="history-list">
                    {activities.slice(0, -1).map((act, idx) => (
                      <div key={act.id || idx} className="history-item">
                        <span className="history-num">#{idx + 1}</span>
                        <span className="history-type">{act.activity_type || 'Activity'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Orbiting...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-dismiss">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      {!session && !showSummary && !loading && !error && apiReady && (
        <div className="welcome-section">
          <p className="welcome-text">
            🌍 Click a planet to start your orbit journey!
          </p>
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

      {/* Not Ready */}
      {!apiReady && !loading && (
        <div className="welcome-section">
          <p className="welcome-text">⏳ Initializing Orbit...</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            If this takes too long, try refreshing the page.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrbitPage;