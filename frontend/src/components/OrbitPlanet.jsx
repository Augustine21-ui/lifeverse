import React from 'react';

const OrbitPlanet = ({ mode, label, color, onClick }) => {
  const colorMap = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    green: 'from-green-500 to-teal-600',
    orange: 'from-orange-500 to-red-600',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} p-6 rounded-2xl shadow-2xl cursor-pointer transform transition hover:scale-105 hover:shadow-3xl text-center`}
      onClick={onClick}
    >
      <div className="text-6xl mb-2">{label.split(' ')[0]}</div>
      <h3 className="text-xl font-semibold text-white">{label.split(' ')[1]}</h3>
      <p className="text-sm text-white/80 mt-2">Tap to start</p>
    </div>
  );
};

export default OrbitPlanet;