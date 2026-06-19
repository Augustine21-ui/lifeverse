import { useState } from 'react';

export default function QuizGenerator({ topic, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numQuestions: 5, difficulty: 'medium' }),
      });
      const data = await res.json();
      if (data.quizId) {
        setQuiz({ quizId: data.quizId, questions: data.questions });
        setAnswers(new Array(data.questions.length).fill(''));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = value;
    setAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.quizId,
          answers,
          userId: localStorage.getItem('userId'), // or from auth context
        }),
      });
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      if (onComplete) onComplete(data.xpEarned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!quiz && !submitted) {
    return (
      <div className="p-4 text-center">
        <button onClick={generateQuiz} disabled={loading} className="btn-primary">
          {loading ? 'Generating Quiz...' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-bold">Quiz Results</h3>
        <p>Score: {result.score} / {result.total}</p>
        <p>{result.message}</p>
        {result.results.map((r, idx) => (
          <div key={idx} className="mt-2 p-2 border rounded">
            <p><strong>{r.question}</strong></p>
            <p>Your answer: {r.userAnswer} {r.isCorrect ? '✅' : '❌'}</p>
            <p>Correct answer: {r.correctAnswer}</p>
            <p className="text-sm text-gray-400">{r.explanation}</p>
          </div>
        ))}
        <button onClick={() => window.location.reload()} className="mt-4 btn-primary">
          Take Another Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">Quiz: {topic}</h3>
      {quiz.questions.map((q, idx) => (
        <div key={idx} className="mb-4 p-3 border rounded">
          <p className="font-semibold">{q.question}</p>
          <div className="mt-2 space-y-1">
            {q.options.map((opt, optIdx) => (
              <label key={optIdx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`q${idx}`}
                  value={opt}
                  checked={answers[idx] === opt}
                  onChange={() => handleAnswerChange(idx, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submitQuiz} disabled={loading} className="btn-primary">
        {loading ? 'Submitting...' : 'Submit Quiz'}
      </button>
    </div>
  );
}