// frontend/src/components/orbit/LifeCore.jsx
import React from 'react';
import { Sparkles, Target, BookOpen } from 'lucide-react';

const LifeCore = ({ subject, topic, progress, onBack }) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 blur-2xl animate-pulse" />
      
      {/* Inner circle */}
      <div className="relative flex flex-col items-center justify-center w-full h-full rounded-full bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">
        <div className="text-4xl mb-1">🌟</div>
        <h2 className="text-sm font-bold text-white text-center px-2">
          {subject || 'Select Subject'}
        </h2>
        <p className="text-xs text-white/60 text-center px-2">
          {topic || 'No topic selected'}
        </p>
        
        {/* Progress bar */}
        <div className="w-32 mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>
        <span className="text-xs text-white/40 mt-1">
          {Math.round(progress || 0)}% complete
        </span>

        {/* Back button (if onBack provided) */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-3 text-xs text-white/40 hover:text-white/80 transition flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default LifeCore;