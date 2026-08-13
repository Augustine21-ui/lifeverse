// frontend/src/components/FocusExtras.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function FocusExtras({ initialSubject, initialTopic }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState(initialSubject || '');
  const [selectedTopic, setSelectedTopic] = useState(initialTopic || '');
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [resources, setResources] = useState([]);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainPrompt, setExplainPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);

  // Load subjects and current study context
  useEffect(() => {
    const loadContext = async () => {
      try {
        // Fetch current study context
        const ctx = await api.getCurrentStudy?.();
        if (ctx) {
          setSelectedSubject(ctx.subject || initialSubject || '');
          setSelectedTopic(ctx.topic || initialTopic || '');
        }
        // Fetch subjects the student is enrolled in
        // If you have an endpoint to get enrolled subjects, use it.
        // For MVP, we'll use a static list or a default.
        const subjectsRes = await api.getSubjects?.() || [
          { id: 1, name: 'Biology' },
          { id: 2, name: 'Mathematics' },
          { id: 3, name: 'Physics' },
          { id: 4, name: 'Chemistry' },
        ];
        setSubjects(subjectsRes);
      } catch (err) {
        console.error(err);
        // Fallback: use initial values
        if (initialSubject) setSelectedSubject(initialSubject);
        if (initialTopic) setSelectedTopic(initialTopic);
      }
    };
    loadContext();
  }, [initialSubject, initialTopic]);

  // Save to backend when subject or topic changes
  useEffect(() => {
    const saveContext = async () => {
      try {
        await api.updateCurrentStudy?.({ subject: selectedSubject, topic: selectedTopic });
      } catch (err) {
        console.error('Failed to save study context:', err);
      }
    };
    if (selectedSubject || selectedTopic) {
      const timeout = setTimeout(saveContext, 500); // debounce
      return () => clearTimeout(timeout);
    }
  }, [selectedSubject, selectedTopic]);

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    // Optionally load topics for this subject
  };

  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value);
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

  return (
    <div className="focus-extras mt-4 space-y-3">
      {/* Subject & Topic selectors */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm text-white/60">Subject:</label>
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="flex-1 input text-sm py-1"
          >
            <option value="">Select subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm text-white/60">Topic:</label>
          <input
            type="text"
            placeholder="e.g. Photosynthesis"
            value={selectedTopic}
            onChange={handleTopicChange}
            className="flex-1 input text-sm py-1"
          />
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowNotesModal(true)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center gap-1"
        >
          📝 Notes
        </button>
        <button
          onClick={handleLoadResources}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center gap-1"
        >
          📚 Textbook
        </button>
        <button
          onClick={handleLaunchOrbit}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-1"
        >
          🚀 Orbit
        </button>
        <button
          onClick={() => setShowExplainModal(true)}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 rounded text-white text-sm flex items-center gap-1"
        >
          🤖 AI Explain
        </button>
      </div>

      {/* Modals (unchanged from previous version) */}
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
    </div>
  );
}