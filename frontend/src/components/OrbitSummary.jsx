import React from 'react';

const OrbitSummary = ({ score, completed, onContinue }) => {
  const percentage = completed ? Math.round((score / completed) * 100) : 0;
  return (
    <div className="bg-gray-900 p-8 rounded-2xl text-center text-white max-w-lg mx-auto">
      <h2 className="text-3xl font-bold mb-4">🌟 Session Complete</h2>
      <p>Activities completed: {completed}</p>
      <p>Correct: {score}</p>
      <p>Accuracy: {percentage}%</p>
      <button className="mt-6 bg-blue-600 hover:bg-blue-700 px-8 py-2 rounded" onClick={onContinue}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default OrbitSummary;