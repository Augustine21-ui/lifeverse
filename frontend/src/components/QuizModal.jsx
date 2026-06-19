import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function QuizModal({ questions, onSubmit, onClose, loading }) {
  const [answers, setAnswers] = useState(new Array(questions.length).fill(''));
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (idx, value) => {
    const newAnswers = [...answers];
    newAnswers[idx] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some(a => !a)) {
      alert('Please answer all questions');
      return;
    }
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Quiz – Required to earn XP</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="border border-white/10 rounded p-3">
              <p className="font-semibold">{idx+1}. {q.question}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt}
                      checked={answers[idx] === opt}
                      onChange={() => handleAnswer(idx, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 w-full btn-primary"
        >
          {submitting ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
          {submitting ? 'Submitting...' : 'Submit Quiz & Earn XP'}
        </button>
      </div>
    </div>
  );
}