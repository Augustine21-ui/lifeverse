// frontend/src/components/MoodAvatar.jsx
import { useState, useEffect } from 'react';

const getMood = (streak, todayXP, tasksDone, challengesDone) => {
  // Base: if no activity at all today, show sad
  const hasActivity = todayXP > 0 || tasksDone > 0 || challengesDone > 0;
  if (!hasActivity) return 'sad';
  // Happy if streak >= 3 or todayXP >= 50
  if (streak >= 3 || todayXP >= 50) return 'happy';
  if (streak >= 1 || todayXP > 0) return 'neutral';
  return 'sad';
};

const moodIcons = {
  happy: '😄',
  neutral: '😐',
  sad: '😔',
};

const moodMessages = {
  happy: 'Great day! Keep going!',
  neutral: 'Good effort. A little more to level up!',
  sad: 'No activity yet. Start a task to earn XP!',
};

export default function MoodAvatar({ streak, todayXP, tasksDone = 0, challengesDone = 0 }) {
  const [mood, setMood] = useState('neutral');

  useEffect(() => {
    setMood(getMood(streak, todayXP, tasksDone, challengesDone));
  }, [streak, todayXP, tasksDone, challengesDone]);

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 shadow-lg">
      <div className="text-4xl">{moodIcons[mood]}</div>
      <div className="text-sm font-medium text-white/80">
        {moodMessages[mood]}
      </div>
    </div>
  );
}