import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, Play, Pause, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function FocusSession({ 
  topic, 
  duration, 
  onEnd, 
  onCancel,
  subject: initialSubject,
  setSubject,
  topicName: initialTopic,
  setTopic,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [showExtras, setShowExtras] = useState(false);

  // Extras state
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || user?.currentSubject || '');
  const [selectedTopic, setSelectedTopic] = useState(initialTopic || user?.currentTopic || '');
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [resources, setResources] = useState([]);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainPrompt, setExplainPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const subjects = [
    { id: 1, name: 'Biology' },
    { id: 2, name: 'Mathematics' },
    { id: 3, name: 'Physics' },
    { id: 4, name: 'Chemistry' },
  ];

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      onEnd();
    }
  }, [isRunning, timeLeft, onEnd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  // Extras functions
  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSelectedSubject(val);
    setSubject?.(val);
    api.updateCurrentStudy({ subject: val, topic: selectedTopic }).catch(console.error);
  };

  const handleTopicChange = (e) => {
    const val = e.target.value;
    setSelectedTopic(val);
    setTopic?.(val);
    api.updateCurrentStudy({ subject: selectedSubject, topic: val }).catch(console.error);
  };

  const handleLaunchOrbit = () => {
    navigate('/orbit', { state: { subject: selectedSubject, topic: selectedTopic } });
  };

  const handleSaveNotes = async () => {
    if (!notes.trim()) return;
    try {
      await api.saveNote?.({ subject: selectedSubject, topic: selectedTopic, content: notes });
      showToast('Notes saved!', 'success');
      setNotes('');
      setShowNotesModal(false);
    } catch (err) {
      showToast('Failed to save notes', 'error');
    }
  };

  const handleLoadResources = async () => {
    try {
      const data = await api.getResources?.(selectedSubject);
      setResources(data || []);
      setShowResourcesModal(true);
    } catch (err) {
      showToast('Failed to load resources', 'error');
    }
  };

  const handleExplain = async () => {
    if (!explainPrompt.trim()) return;
    setExplaining(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ subject: selectedSubject, topic: selectedTopic, question: explainPrompt })
      });
      const data = await res.json();
      setExplanation(data.explanation || 'No explanation available.');
    } catch (err) {
      showToast('Failed to get explanation', 'error');
    } finally {
      setExplaining(false);
    }
  };

  const handleCalculate = () => {
    try {
      const result = new Function(`return (${calcInput})`)();
      setCalcResult(String(result));
    } catch (e) {
      setCalcResult('Error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-700 p-6 flex flex-col items-center justify-center">
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Focus Session</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Topic display – now shows the combined subject-topic */}
        <p className="text-white/60 text-center text-lg mb-4">Focusing on: <span className="text-white font-semibold">{topic}</span></p>

        {/* Timer */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-mono text-white">{formatTime(timeLeft)}</span>
          </div>
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#gradient)"
              strokeWidth="6"
              fill="none"
              strokeDasharray="553"
              strokeDashoffset={553 - (progress / 100) * 553}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleTimer}
            className="p-3 rounded-full bg-brand-500 hover:bg-brand-600 transition text-white"
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={() => setTimeLeft(duration * 60)}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Extras toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowExtras(!showExtras)}
            className="text-sm text-brand-400 hover:underline"
          >
            {showExtras ? 'Hide study tools' : 'Show study tools'}
          </button>
        </div>

        {/* Extras panel */}
        {showExtras && (
          <div className="mt-6 border-t border-white/10 pt-4 space-y-4">
            {/* Subject & Topic */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm text-white/60">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className="w-full input text-sm mt-1"
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-white/60">Topic</label>
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={handleTopicChange}
                  placeholder="e.g. Photosynthesis"
                  className="w-full input text-sm mt-1"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowNotesModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center gap-1"
              >
                📝 Notes
              </button>
              <button
                onClick={handleLoadResources}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center gap-1"
              >
                📚 Textbook
              </button>
              <button
                onClick={handleLaunchOrbit}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-1"
              >
                🚀 Orbit
              </button>
              <button
                onClick={() => setShowExplainModal(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded text-white text-sm flex items-center gap-1"
              >
                🤖 AI Explain
              </button>
              <button
                onClick={() => setShowCalcModal(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-sm flex items-center gap-1"
              >
                🧮 Calc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals – keep same as before */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white font-bold mb-3">📝 Take Notes</h3>
            <textarea
              className="w-full input h-32"
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowNotesModal(false)} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
              <button onClick={handleSaveNotes} className="px-4 py-2 bg-blue-600 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {showResourcesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white font-bold mb-3">📚 Textbook Resources</h3>
            {resources.length === 0 ? (
              <p className="text-white/60">No resources found for this subject.</p>
            ) : (
              <ul className="space-y-2">
                {resources.map((r, i) => (
                  <li key={i} className="text-white/80 text-sm">{r.title || r.name}</li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowResourcesModal(false)} className="mt-3 px-4 py-2 bg-gray-600 rounded">Close</button>
          </div>
        </div>
      )}

      {showExplainModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white font-bold mb-3">🤖 AI Explain</h3>
            <input
              type="text"
              className="w-full input text-sm"
              placeholder="Ask about a concept..."
              value={explainPrompt}
              onChange={(e) => setExplainPrompt(e.target.value)}
            />
            <div className="mt-2">
              <button
                onClick={handleExplain}
                disabled={explaining || !explainPrompt.trim()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 rounded text-white"
              >
                {explaining ? 'Thinking...' : 'Explain'}
              </button>
            </div>
            {explanation && (
              <div className="mt-3 p-3 bg-gray-700 rounded text-white/90 text-sm max-h-48 overflow-y-auto">
                {explanation}
              </div>
            )}
            <button onClick={() => { setShowExplainModal(false); setExplanation(''); }} className="mt-3 px-4 py-2 bg-gray-600 rounded">Close</button>
          </div>
        </div>
      )}

      {showCalcModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-white font-bold mb-3">🧮 Calculator</h3>
            <input
              type="text"
              className="w-full input text-sm font-mono"
              placeholder="e.g. 2+2*3"
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            />
            <div className="mt-2 flex gap-2">
              <button onClick={handleCalculate} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white">
                Calculate
              </button>
              <button onClick={() => setCalcInput('')} className="px-4 py-2 bg-gray-600 rounded text-white">
                Clear
              </button>
            </div>
            {calcResult && (
              <div className="mt-3 p-3 bg-gray-700 rounded text-white/90 text-lg font-mono text-center">
                = {calcResult}
              </div>
            )}
            <button onClick={() => { setShowCalcModal(false); setCalcResult(''); }} className="mt-3 w-full px-4 py-2 bg-gray-600 rounded text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}