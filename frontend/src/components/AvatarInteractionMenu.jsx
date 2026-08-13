import { useEffect, useRef } from 'react';
import { Smile, Camera, User, Settings, X } from 'lucide-react';

const moods = [
  { value: 'happy', label: '😊 Happy' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'tired', label: '😴 Tired' },
  { value: 'stressed', label: '😤 Stressed' },
  { value: 'neutral', label: '😐 Neutral' },
];

export default function AvatarInteractionMenu({ onClose, onMoodSelect, currentMood, onUploadAvatar, onViewProfile }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute top-full mt-2 right-0 w-56 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl p-2 z-50"
    >
      <div className="flex justify-between items-center px-2 py-1 text-sm text-white/60 border-b border-white/10">
        <span>Avatar Menu</span>
        <button onClick={onClose} className="hover:text-white"><X size={16} /></button>
      </div>

      <div className="py-1">
        <p className="text-xs text-white/40 px-2 py-1">Change Mood</p>
        {moods.map(m => (
          <button
            key={m.value}
            onClick={() => { onMoodSelect(m.value); onClose(); }}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-white/5 transition ${
              currentMood === m.value ? 'bg-brand-500/20 text-brand-400' : 'text-white/70'
            }`}
          >
            <span>{m.label}</span>
            {currentMood === m.value && <span className="ml-auto text-brand-400">✓</span>}
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 pt-1">
        <button onClick={onUploadAvatar} className="w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white/70 hover:bg-white/5 transition">
          <Camera size={16} /> Upload Photo
        </button>
        <button onClick={onViewProfile} className="w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white/70 hover:bg-white/5 transition">
          <User size={16} /> View Profile
        </button>
        <button className="w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white/70 hover:bg-white/5 transition">
          <Settings size={16} /> Customize Avatar
        </button>
      </div>
    </div>
  );
}