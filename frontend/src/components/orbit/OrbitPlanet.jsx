// frontend/src/components/orbit/OrbitPlanet.jsx
import React from 'react';
import { Sparkles } from 'lucide-react';

const OrbitPlanet = ({ name, icon, color, activities, onSelect, isActive }) => {
  const activityCount = activities?.length || 0;

  return (
    <div 
      className={`orbit-planet cursor-pointer group transition-all duration-300 ${
        isActive ? 'scale-110' : 'hover:scale-105'
      }`}
      onClick={() => onSelect(name)}
    >
      <div 
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}20)`,
          boxShadow: `0 0 30px ${color}30, inset 0 0 30px ${color}10`,
          border: `2px solid ${color}50`
        }}
      >
        <div className="absolute inset-0 rounded-full animate-spin-slow opacity-30" style={{ border: `2px dashed ${color}40` }} />
        <span className="text-3xl sm:text-4xl relative z-10">{icon}</span>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full animate-pulse" />
        )}
      </div>
      <h4 className="text-sm font-semibold text-white/80 text-center mt-2">{name}</h4>
      <p className="text-xs text-white/40 text-center">{activityCount} activities</p>
    </div>
  );
};

export default OrbitPlanet;