import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

export default function QuizModal({ task, onClose, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const questions = task.quiz?.questions || [];
  if (questions.length === 0) {
    // No quiz, just complete directly
    onSubmit(null);
    return null;
  }

  const handleAnswerChange = (qIndex, selectedOption) => {
    setAnswers(prev => ({ ...prev, [qIndex]: selectedOption }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const answersArray = questions.map((_, idx) => answers[idx] !== undefined ? answers[idx] : null);
    const response = await onSubmit(answersArray);
    setResult(response);
    setSubmitting(false);
    // Auto-close after 2 seconds if successful XP awarded
    if (response.xpAwarded > 0) {
      setTimeout(() => onClose(), 2000);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="card max-w-md w-full p-6 text-center">
          {result.xpAwarded > 0 ? (
            <>
              <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Quiz passed!</h3>
              <p>You earned {result.xpAwarded} XP!</p>
            </>
          ) : (
            <>
              <XCircle size={48} className="text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Quiz failed</h3>
              <p>You scored {result.score?.toFixed(0)}% – need at least 50%.</p>
              <p>No XP awarded, but the task is still marked complete.</p>
            </>
          )}
          <button onClick={onClose} className="btn-primary mt-4">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{task.title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="border border-white/10 rounded-lg p-3">
              <p className="font-medium mb-2">{q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={optIdx}
                      checked={answers[idx] === optIdx}
                      onChange={() => handleAnswerChange(idx, optIdx)}
                      className="w-4 h-4 accent-brand-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length !== questions.length}
          className="btn-primary w-full mt-6"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  );
}