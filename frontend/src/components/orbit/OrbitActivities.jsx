// frontend/src/components/orbit/OrbitActivities.jsx
import React from 'react';
import { 
  Activity, 
  BookOpen, 
  Zap, 
  Target, 
  Brain, 
  Rocket,
  Search,          // ← added
  Lock,            // ← added
  Eye,             // ← added
  Map,             // ← added
  FileText,        // ← added
  GitBranch,       // ← added
  ArrowUpDown,     // ← added
  Network,         // ← added
  Crosshair,       // ← added
  Circle,          // ← added
  Clock,           // ← added
  Hand,            // ← added
  PenTool,         // ← added (already in Dashboard but we need it here)
  Puzzle           // ← added (if not already)
} from 'lucide-react';

const ORBIT_ACTIVITIES = {
  cortex: [
    { id: 'quiz', label: 'Quiz', icon: Brain, color: 'text-purple-400' },
    { id: 'flashcards', label: 'Flashcards', icon: BookOpen, color: 'text-blue-400' },
    { id: 'memory_match', label: 'Memory Match', icon: Target, color: 'text-green-400' },
    { id: 'crossword', label: 'Crossword', icon: Activity, color: 'text-yellow-400' },
    { id: 'word_search', label: 'Word Search', icon: Search, color: 'text-pink-400' },
    { id: 'fill_blanks', label: 'Fill in the Blanks', icon: PenTool, color: 'text-cyan-400' },
    { id: 'match_pairs', label: 'Match the Pairs', icon: Puzzle, color: 'text-orange-400' },
    { id: 'puzzles', label: 'Puzzles', icon: Brain, color: 'text-red-400' },
  ],
  cluepath: [
    { id: 'detective_mission', label: 'Detective Mission', icon: Search, color: 'text-amber-400' },
    { id: 'story_adventure', label: 'Story Adventure', icon: BookOpen, color: 'text-purple-400' },
    { id: 'escape_challenge', label: 'Escape Challenge', icon: Lock, color: 'text-red-400' },
    { id: 'solve_clues', label: 'Solve the Clues', icon: Eye, color: 'text-cyan-400' },
    { id: 'educational_riddles', label: 'Riddles', icon: Brain, color: 'text-yellow-400' },
    { id: 'rapid_fire', label: 'Rapid Fire', icon: Zap, color: 'text-orange-400' },
  ],
  pathfinder: [
    { id: 'knowledge_maze', label: 'Knowledge Maze', icon: Map, color: 'text-green-400' },
    { id: 'hidden_object', label: 'Hidden Object', icon: Eye, color: 'text-blue-400' },
    { id: 'reading_mission', label: 'Reading Mission', icon: BookOpen, color: 'text-purple-400' },
    { id: 'reading_summary', label: 'Reading & Summarizing', icon: FileText, color: 'text-cyan-400' },
    { id: 'interactive_diagram', label: 'Interactive Diagram', icon: GitBranch, color: 'text-orange-400' },
    { id: 'sequence_builder', label: 'Sequence Builder', icon: ArrowUpDown, color: 'text-yellow-400' },
    { id: 'concept_maps', label: 'Concept Maps', icon: Network, color: 'text-pink-400' },
  ],
  reflex: [
    { id: 'answer_shooter', label: 'Answer Shooter', icon: Crosshair, color: 'text-red-400' },
    { id: 'bubble_pop', label: 'Bubble Pop', icon: Circle, color: 'text-blue-400' },
    { id: 'lightning_tap', label: 'Lightning Tap', icon: Zap, color: 'text-yellow-400' },
    { id: 'target_strike', label: 'Target Strike', icon: Target, color: 'text-orange-400' },
    { id: 'speed_match', label: 'Speed Match', icon: Clock, color: 'text-green-400' },
    { id: 'rapid_recall', label: 'Rapid Recall', icon: Brain, color: 'text-purple-400' },
    { id: 'swipe_challenge', label: 'Swipe Challenge', icon: Hand, color: 'text-pink-400' },
  ]
};

const OrbitActivities = ({ orbitType, onSelectActivity }) => {
  const activities = ORBIT_ACTIVITIES[orbitType] || [];

  if (!activities.length) {
    return (
      <div className="text-center text-white/40 py-8">
        <p>No activities available for this orbit.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {activities.map((activity) => {
        const Icon = activity.icon;
        return (
          <button
            key={activity.id}
            onClick={() => onSelectActivity(activity.id)}
            className="flex flex-col items-center gap-1.5 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all hover:scale-105"
          >
            <Icon size={28} className={activity.color} />
            <span className="text-xs text-white/70 text-center">{activity.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default OrbitActivities;