// frontend/src/components/orbit/OrbitActivityRenderer.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OrbitActivityRenderer = ({ activity, onSubmit, onBack }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine activity type
  const type = activity?.activity_type || 'quiz';
  const content = activity?.content || {};

  // Render different activity types
  const renderQuiz = () => {
    const questions = content.questions || [];
    if (!questions.length) return <p className="text-white/40">No questions available.</p>;

    return (
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white font-medium mb-3">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => setAnswers({ ...answers, [idx]: optIdx })}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    answers[idx] === optIdx
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFlashcards = () => {
    const flashcards = content.flashcards || [];
    if (!flashcards.length) return <p className="text-white/40">No flashcards available.</p>;

    const [flipped, setFlipped] = useState({});

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {flashcards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => setFlipped({ ...flipped, [idx]: !flipped[idx] })}
            className="bg-white/5 rounded-xl p-6 border border-white/10 cursor-pointer transition hover:bg-white/10 min-h-[120px] flex items-center justify-center text-center"
          >
            <p className="text-white">
              {flipped[idx] ? card.answer : card.question}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Default renderer
  const renderDefault = () => (
    <div className="text-center text-white/40 py-8">
      <p>Activity type "{type}" not yet implemented.</p>
      <p className="text-sm mt-2">Content: {JSON.stringify(content)}</p>
    </div>
  );

  // Main render
  const renderContent = () => {
    switch (type) {
      case 'quiz':
        return renderQuiz();
      case 'flashcards':
        return renderFlashcards();
      default:
        return renderDefault();
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setLoading(true);
    try {
      await onSubmit(answers);
      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
        </h3>
        <button
          onClick={onBack}
          className="text-sm text-white/40 hover:text-white/80 transition"
        >
          ← Back
        </button>
      </div>

      {renderContent()}

      {type === 'quiz' && (
        <button
          onClick={handleSubmit}
          disabled={loading || submitted}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin inline mr-2" size={18} /> : null}
          {submitted ? 'Submitted' : 'Submit Answers'}
        </button>
      )}

      {submitted && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-center">
          ✅ Activity completed! XP awarded.
        </div>
      )}
    </div>
  );
};

export default OrbitActivityRenderer;