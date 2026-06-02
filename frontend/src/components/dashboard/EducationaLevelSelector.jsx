// src/components/dashboard/EducationLevelSelector.jsx
import { useState } from 'react';

const levels = ['Primary', 'Secondary', 'College', 'University'];

export default function EducationLevelSelector({ value, onChange }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">EDUCATION LEVEL</h3>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${value === level
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}