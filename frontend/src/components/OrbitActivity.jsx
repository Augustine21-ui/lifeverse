import React, { useState, useEffect } from 'react';

const OrbitActivity = ({ activity, onAnswer, onFinish, total, current }) => {
  const [startTime] = useState(Date.now());
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);

  const content = activity.content;

  useEffect(() => {
    if (activity.activity_type === 'memory_match' && content.pairs) {
      setPairs(content.pairs.map((p, i) => ({ ...p, id: i, matched: false })));
    }
  }, [activity]);

  const handleSubmit = (answer) => {
    const time = (Date.now() - startTime) / 1000;
    onAnswer(activity.id, answer, time);
    setFeedback('Submitted!');
    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      if (current + 1 >= total) onFinish();
    }, 1000);
  };

  const renderActivity = () => {
    // === CORTEX: Quiz ===
    if (activity.activity_type === 'cortex' && content.options) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between text-white mb-4">
            <span>Activity {current+1} of {total}</span>
            <span>🧠 Cortex</span>
          </div>
          <h3 className="text-white text-xl mb-4">{content.question}</h3>
          <div className="space-y-2">
            {content.options.map((opt, idx) => (
              <button
                key={idx}
                className={`w-full text-left p-3 rounded bg-gray-700 hover:bg-gray-600 transition ${selected === idx ? 'border-2 border-blue-500' : ''}`}
                onClick={() => setSelected(idx)}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <p className="text-white mt-4">{feedback}</p>}
          {selected !== null && !feedback && (
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded" onClick={() => handleSubmit(selected)}>
              Submit
            </button>
          )}
        </div>
      );
    }

    // === CORTEX: Flashcards ===
    if (activity.activity_type === 'flashcards') {
      return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between text-white mb-4">
            <span>Activity {current+1} of {total}</span>
            <span>🃏 Flashcards</span>
          </div>
          <div
            className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-300"
            style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
            onClick={() => setFlipped(!flipped)}
          >
            <p className="text-white text-xl text-center px-4">
              {flipped ? content.answer : content.question}
            </p>
          </div>
          <p className="text-white/40 text-sm text-center mt-4">Click to flip</p>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full" onClick={() => onFinish()}>
            Next
          </button>
        </div>
      );
    }

    // === CORTEX: Memory Match ===
    if (activity.activity_type === 'memory_match') {
      return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between text-white mb-4">
            <span>Activity {current+1} of {total}</span>
            <span>🧩 Memory Match</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {pairs.map((pair, idx) => (
              <button
                key={idx}
                className={`p-4 h-16 rounded-lg transition ${pair.matched ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                onClick={() => {
                  if (pair.matched) return;
                  if (selectedPair === null) {
                    setSelectedPair(idx);
                  } else if (selectedPair === idx) {
                    setSelectedPair(null);
                  } else {
                    // Check if matches
                    if (pairs[selectedPair].answer === pair.answer) {
                      setPairs(prev => prev.map((p, i) => 
                        i === selectedPair || i === idx ? { ...p, matched: true } : p
                      ));
                    }
                    setSelectedPair(null);
                  }
                }}
              >
                {pair.matched ? '✅' : pair.id === selectedPair ? pair.answer : '❓'}
              </button>
            ))}
          </div>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full" onClick={() => onFinish()}>
            Next
          </button>
        </div>
      );
    }

    // === CLUEPATH: Story ===
    if (activity.activity_type === 'cluepath' && content.story) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between text-white mb-4">
            <span>Activity {current+1} of {total}</span>
            <span>🕵️ CluePath</span>
          </div>
          <p className="text-white/80 mb-4">{content.story}</p>
          <h3 className="text-white text-xl mb-4">{content.question}</h3>
          <div className="space-y-2">
            {content.options.map((opt, idx) => (
              <button
                key={idx}
                className={`w-full text-left p-3 rounded bg-gray-700 hover:bg-gray-600 transition ${selected === idx ? 'border-2 border-purple-500' : ''}`}
                onClick={() => setSelected(idx)}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <p className="text-white mt-4">{feedback}</p>}
          {selected !== null && !feedback && (
            <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded" onClick={() => handleSubmit(selected)}>
              Submit
            </button>
          )}
        </div>
      );
    }

    // === PATHFINDER: Sequence ===
    if (activity.activity_type === 'pathfinder' && content.steps) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between text-white mb-4">
            <span>Activity {current+1} of {total}</span>
            <span>🧭 Pathfinder</span>
          </div>
          <p className="text-white/80 mb-4">{content.instruction}</p>
          <div className="space-y-2">
            {content.steps.map((step, idx) => (
              <div key={idx} className="p-3 bg-gray-700 rounded flex items-center gap-2">
                <span className="text-white/40">{idx + 1}.</span>
                <span className="text-white">{step}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full" onClick={() => onFinish()}>
            Next
          </button>
        </div>
      );
    }

    // === REFLEX: Rapid Fire ===
    if (activity.activity_type === 'reflex' && content.questions) {
      const q = content.questions[0] || {};
      return (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between text-white mb-4">
            <span>Activity {current+1} of {total}</span>
            <span>⚡ Reflex</span>
          </div>
          <h3 className="text-white text-xl mb-4">{q.question}</h3>
          <input
            type="text"
            placeholder="Type your answer..."
            className="w-full input text-sm"
            value={selected || ''}
            onChange={(e) => setSelected(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(selected)}
          />
          {feedback && <p className="text-white mt-4">{feedback}</p>}
          {selected !== null && !feedback && (
            <button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded w-full" onClick={() => handleSubmit(selected)}>
              Submit
            </button>
          )}
        </div>
      );
    }

    // === Fallback ===
    return (
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto text-center">
        <div className="flex justify-between text-white mb-4">
          <span>Activity {current+1} of {total}</span>
          <span>{activity.activity_type}</span>
        </div>
        <p className="text-white/60">Activity type: {activity.activity_type}</p>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded" onClick={() => onFinish()}>
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      {renderActivity()}
    </div>
  );
};

export default OrbitActivity;