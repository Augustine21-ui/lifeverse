// frontend/src/pages/OrbitPage.jsx
// ✅ Updated with correct planet names from your document

import React, { useState, useEffect, useCallback } from 'react';
import orbitApi from '../services/orbitApi';
import './OrbitPage.css';

const OrbitPage = () => {
  // ... all your existing state

  // =============================================
  // ✅ UPDATED PLANETS - Matches your document
  // =============================================
  const planets = [
    { 
      id: 'cortex', 
      label: 'Cortex', 
      subtitle: 'Knowledge & Memory',
      color: '#6C63FF', 
      icon: '🧠', 
      bg: 'rgba(108, 99, 255, 0.1)',
      orbitType: 'cortex'
    },
    { 
      id: 'cluepath', 
      label: 'CluePath', 
      subtitle: 'Story & Problem Solving',
      color: '#FF6B6B', 
      icon: '🕵️', 
      bg: 'rgba(255, 107, 107, 0.1)',
      orbitType: 'cluepath'
    },
    { 
      id: 'pathfinder', 
      label: 'Pathfinder', 
      subtitle: 'Exploration',
      color: '#4ECDC4', 
      icon: '🧭', 
      bg: 'rgba(78, 205, 196, 0.1)',
      orbitType: 'pathfinder'
    },
    { 
      id: 'reflex', 
      label: 'Reflex', 
      subtitle: 'Educational Arcade',
      color: '#FFE66D', 
      icon: '⚡', 
      bg: 'rgba(255, 230, 109, 0.1)',
      orbitType: 'reflex'
    },
  ];

  // ... rest of your component logic

  // =============================================
  // HANDLE PLANET CLICK - Using correct orbitType
  // =============================================
  const handlePlanetClick = useCallback(async (planet) => {
    setSelectedPlanet(planet);
    setLoading(true);
    setError(null);
    setShowSummary(false);
    setActivities([]);
    setCurrentActivity(null);

    try {
      // Use the correct orbitType from planet config
      const result = await orbitApi.startSession(
        planet.id,           // subject (cortex, cluepath, pathfinder, reflex)
        `Exploring ${planet.label}`, // topic
        planet.orbitType,    // orbitType (cortex, cluepath, pathfinder, reflex)
        'introduction'       // activityType
      );

      setSession(result?.session || null);
      
      if (result?.activity) {
        setActivities([result.activity]);
        setCurrentActivity(result.activity);
      }
    } catch (err) {
      console.error('❌ Error starting orbit session:', err);
      setError(err.message || 'Failed to start Orbit session');
    } finally {
      setLoading(false);
    }
  }, []);

  // ... rest of your component

  return (
    <div className="orbit-page">
      {/* Header */}
      <header className="orbit-header">
        <h1>🚀 Orbit Learning</h1>
        {/* ... progress stats */}
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
              disabled={loading || !!session}
              title={session ? 'Complete current session first' : `Start ${planet.label} orbit`}
            >
              <div className="planet-glow"></div>
              <span className="planet-icon">{planet.icon}</span>
              <span className="planet-label">{planet.label}</span>
              <span className="planet-subtitle">{planet.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ... rest of your component */}
    </div>
  );
};

export default OrbitPage;