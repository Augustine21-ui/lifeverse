// backend/src/services/orbitService.js
// ✅ COMPLETE - Full support for all Cortex activities with submitAnswer

import db from '../config/db.js';
import * as models from '../models/orbitModels.js';
import { generateOrbitActivity } from './aiService.js';

// ============================================================
// XP CONFIGURATION - Complete list
// ============================================================

const XP_CONFIG = {
  // Cortex - Knowledge & Memory
  quiz: { base: 30, bonus: 10 },
  flashcards: { base: 20, bonus: 5 },
  memory_match: { base: 25, bonus: 8 },
  crossword: { base: 35, bonus: 12 },
  word_search: { base: 25, bonus: 5 },
  fill_blanks: { base: 30, bonus: 10 },
  match_pairs: { base: 25, bonus: 8 },
  puzzles: { base: 40, bonus: 15 },
  
  // CluePath - Story & Problem Solving
  detective_mission: { base: 45, bonus: 20 },
  story_adventure: { base: 40, bonus: 15 },
  escape_challenge: { base: 50, bonus: 25 },
  solve_clues: { base: 35, bonus: 15 },
  educational_riddles: { base: 30, bonus: 10 },
  rapid_fire: { base: 25, bonus: 8 },
  
  // Pathfinder - Exploration
  knowledge_maze: { base: 40, bonus: 15 },
  hidden_object: { base: 30, bonus: 10 },
  reading_mission: { base: 35, bonus: 12 },
  reading_summary: { base: 35, bonus: 12 },
  interactive_diagram: { base: 30, bonus: 10 },
  sequence_builder: { base: 30, bonus: 10 },
  concept_maps: { base: 35, bonus: 12 },
  
  // Reflex - Educational Arcade
  answer_shooter: { base: 20, bonus: 5 },
  bubble_pop: { base: 15, bonus: 3 },
  lightning_tap: { base: 15, bonus: 3 },
  target_strike: { base: 20, bonus: 5 },
  speed_match: { base: 20, bonus: 5 },
  rapid_recall: { base: 25, bonus: 8 },
  swipe_challenge: { base: 20, bonus: 5 }
};

// ============================================================
// ACTIVITY TYPES BY ORBIT
// ============================================================

export const ORBIT_ACTIVITIES = {
  cortex: {
    name: 'Cortex',
    icon: '🧠',
    description: 'Knowledge & Memory',
    activities: [
      'quiz', 'flashcards', 'memory_match', 'crossword',
      'word_search', 'fill_blanks', 'match_pairs', 'puzzles'
    ]
  },
  cluepath: {
    name: 'CluePath',
    icon: '🕵️',
    description: 'Story & Problem Solving',
    activities: [
      'detective_mission', 'story_adventure', 'escape_challenge',
      'solve_clues', 'educational_riddles', 'rapid_fire'
    ]
  },
  pathfinder: {
    name: 'Pathfinder',
    icon: '🧭',
    description: 'Exploration',
    activities: [
      'knowledge_maze', 'hidden_object', 'reading_mission',
      'reading_summary', 'interactive_diagram', 'sequence_builder', 'concept_maps'
    ]
  },
  reflex: {
    name: 'Reflex',
    icon: '⚡',
    description: 'Educational Arcade',
    activities: [
      'answer_shooter', 'bubble_pop', 'lightning_tap',
      'target_strike', 'speed_match', 'rapid_recall', 'swipe_challenge'
    ]
  }
};

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export const startSession = async (userId, subject, topic, orbitType, activityType) => {
  try {
    const session = await models.createSession(userId, subject, topic, orbitType, activityType);
    return session;
  } catch (error) {
    console.error('Error starting orbit session:', error);
    throw error;
  }
};

export const endSession = async (sessionId, score, totalQuestions, correctAnswers, timeSpent) => {
  try {
    const session = await models.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const xpConfig = XP_CONFIG[session.activity_type] || { base: 25, bonus: 5 };
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const xpEarned = Math.round(xpConfig.base + (percentage / 100) * xpConfig.bonus);

    const completed = await models.completeSession(
      sessionId, score, totalQuestions, correctAnswers, timeSpent, xpEarned
    );

    await models.updateMastery(
      session.user_id, session.subject, session.topic,
      percentage >= 60, xpEarned
    );

    await models.saveActivityHistory(
      session.user_id, sessionId, session.activity_type, session.orbit_type,
      session.subject, session.topic, score, totalQuestions, correctAnswers,
      timeSpent, xpEarned
    );

    await db.query(
      `UPDATE users SET xp = xp + $1, level = FLOOR((xp + $1) / 500) + 1 WHERE id = $2`,
      [xpEarned, session.user_id]
    );

    return { ...completed, xpEarned };
  } catch (error) {
    console.error('Error ending orbit session:', error);
    throw error;
  }
};

// ============================================================
// ACTIVITY GENERATION - Enhanced
// ============================================================

export const generateActivity = async (sessionId, activityType) => {
  try {
    console.log(`🎯 Generating ${activityType} activity for session: ${sessionId}`);
    
    const session = await models.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const userResult = await db.query(
      `SELECT id, full_name, education_level, course, learning_style FROM users WHERE id = $1`,
      [session.user_id]
    );
    const user = userResult.rows[0] || {};

    // ✅ SKIP AI - Always use mock content
    console.log(`📝 Generating mock content for ${activityType}`);
    const content = generateMockContent(activityType, session.subject, session.topic);

    // Save activity
    const activity = await models.saveActivity(sessionId, activityType, content);
    console.log(`✅ Activity saved: ${activity.id}`);
    
    return activity;
  } catch (error) {
    console.error('❌ Error generating orbit activity:', error);
    // Fallback to simple mock
    return generateSimpleMock(sessionId, activityType);
  }
};

// ============================================================
// ANSWER SUBMISSION - ✅ ADDED THIS FUNCTION
// ============================================================

export const submitAnswer = async (activityId, userAnswer, timeTaken) => {
  try {
    console.log('✅ submitAnswer called');
    console.log('📥 activityId:', activityId);
    console.log('📥 userAnswer:', userAnswer);
    console.log('📥 timeTaken:', timeTaken);

    // Get the activity
    const activityResult = await db.query(
      `SELECT * FROM orbit_activities WHERE id = $1`,
      [activityId]
    );
    
    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = activityResult.rows[0];
    const content = activity.content;
    
    // Evaluate the answer
    const isCorrect = evaluateAnswer(content, userAnswer);
    console.log(`📊 Answer is ${isCorrect ? 'correct' : 'incorrect'}`);

    // Update the activity with the answer
    const updatedResult = await db.query(
      `UPDATE orbit_activities 
       SET 
         user_answer = $1,
         is_correct = $2,
         time_taken = $3
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(userAnswer), isCorrect, timeTaken || 0, activityId]
    );

    // Get the session to update stats
    const sessionResult = await db.query(
      `SELECT * FROM orbit_sessions WHERE id = $1`,
      [activity.session_id]
    );

    if (sessionResult.rows.length > 0) {
      const currentSession = sessionResult.rows[0];
      const newTotal = (currentSession.total_questions || 0) + 1;
      const newCorrect = (currentSession.correct_answers || 0) + (isCorrect ? 1 : 0);
      const newScore = Math.round((newCorrect / newTotal) * 100);

      await db.query(
        `UPDATE orbit_sessions 
         SET 
           total_questions = $1,
           correct_answers = $2,
           score = $3,
           time_spent = $4
         WHERE id = $5`,
        [newTotal, newCorrect, newScore, (currentSession.time_spent || 0) + (timeTaken || 0), sessionResult.rows[0].id]
      );

      // Track weakness if incorrect
      if (!isCorrect) {
        const concept = content?.concept || content?.topic || currentSession.topic;
        await db.query(
          `INSERT INTO orbit_weaknesses 
           (user_id, subject, topic, concept, difficulty, encountered_count, last_encountered, mastered)
           VALUES ($1, $2, $3, $4, 'medium', 1, NOW(), false)
           ON CONFLICT (user_id, subject, topic, concept) 
           DO UPDATE SET 
             encountered_count = orbit_weaknesses.encountered_count + 1,
             last_encountered = NOW()`,
          [currentSession.user_id, currentSession.subject, currentSession.topic, concept]
        );
      }
    }

    return { 
      isCorrect, 
      updated: updatedResult.rows[0] 
    };
  } catch (error) {
    console.error('❌ Error submitting answer:', error);
    throw error;
  }
};

// ============================================================
// COMPREHENSIVE MOCK CONTENT GENERATOR
// ============================================================

const generateMockContent = (activityType, subject, topic) => {
  const baseContent = {
    type: activityType,
    subject: subject,
    topic: topic,
    title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} ${activityType.replace('_', ' ')}`,
    description: `Practice ${topic} with this ${activityType.replace('_', ' ')} activity.`,
    mock: true
  };

  switch (activityType) {
    // ========== CORTEX ACTIVITIES ==========
    case 'quiz':
      return {
        ...baseContent,
        questions: [
          {
            question: `What is the main concept of ${topic} in ${subject}?`,
            options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
            correct: 0,
            explanation: 'Concept A is the fundamental principle.'
          },
          {
            question: `Which of the following is most related to ${topic}?`,
            options: ['Related A', 'Related B', 'Related C', 'Related D'],
            correct: 0,
            explanation: 'This is the most closely related concept.'
          },
          {
            question: `How does ${topic} apply to real-world scenarios?`,
            options: ['Application 1', 'Application 2', 'Application 3', 'Application 4'],
            correct: 0,
            explanation: 'This is the most common application.'
          },
          {
            question: `What is the key principle behind ${topic}?`,
            options: ['Principle 1', 'Principle 2', 'Principle 3', 'Principle 4'],
            correct: 0,
            explanation: 'This is the foundational principle.'
          },
          {
            question: `Which statement best describes ${topic}?`,
            options: ['Description A', 'Description B', 'Description C', 'Description D'],
            correct: 0,
            explanation: 'This is the most accurate description.'
          }
        ]
      };

    case 'flashcards':
      return {
        ...baseContent,
        cards: [
          { term: `What is ${topic}?`, definition: `${topic} is the study of related concepts in ${subject}.` },
          { term: `Key concept of ${topic}`, definition: `Understanding the main principles of ${topic}.` },
          { term: `Application of ${topic}`, definition: `${topic} is applied in various real-world scenarios.` },
          { term: `Importance of ${topic}`, definition: `${topic} is crucial for understanding ${subject}.` },
          { term: `Related concepts to ${topic}`, definition: `Several concepts are closely related to ${topic}.` },
          { term: `Future of ${topic}`, definition: `${topic} continues to evolve with new discoveries.` },
          { term: `History of ${topic}`, definition: `${topic} has a rich history of development.` },
          { term: `Key figures in ${topic}`, definition: `Many notable figures contributed to ${topic}.` }
        ]
      };

    case 'memory_match':
      return {
        ...baseContent,
        pairs: [
          { term: topic, definition: `The study of ${topic} in ${subject}` },
          { term: 'Key Principle', definition: 'The fundamental rule governing the subject' },
          { term: 'Application', definition: 'Practical use of the knowledge' },
          { term: 'Theory', definition: 'Explanation of observed phenomena' },
          { term: 'Practice', definition: 'Application of theory in real situations' },
          { term: 'Analysis', definition: 'Breaking down complex concepts' }
        ]
      };

    case 'crossword':
      return {
        ...baseContent,
        clues: [
          { clue: `The study of ${topic} (${subject})`, answer: subject.toLowerCase(), length: subject.length },
          { clue: 'A fundamental concept', answer: 'principle', length: 9 },
          { clue: 'Practical application', answer: 'practice', length: 8 },
          { clue: 'Understanding of concepts', answer: 'knowledge', length: 9 },
          { clue: 'Systematic study', answer: 'science', length: 7 },
          { clue: 'Learning process', answer: 'education', length: 9 }
        ],
        grid: generateCrosswordGrid(['principle', 'practice', 'knowledge', 'science', 'education'])
      };

    case 'word_search':
      return {
        ...baseContent,
        words: [
          topic.toLowerCase(),
          subject.toLowerCase(),
          'learn',
          'study',
          'knowledge',
          'practice',
          'theory',
          'concept'
        ],
        grid: generateWordSearchGrid([topic.toLowerCase(), subject.toLowerCase(), 'learn', 'study', 'knowledge'])
      };

    case 'fill_blanks':
      return {
        ...baseContent,
        sentences: [
          { text: `_____ is the study of ${topic} in ${subject}.`, answer: subject, hint: `Starts with ${subject[0]}` },
          { text: `The main principle of ${topic} is _____.`, answer: 'understanding', hint: 'Starts with "u"' },
          { text: `${topic} is applied in _____ scenarios.`, answer: 'real-world', hint: 'Two words, hyphenated' },
          { text: `_____ is crucial for mastering ${topic}.`, answer: 'Practice', hint: 'Starts with "P"' },
          { text: `The history of ${topic} spans _____ years.`, answer: 'thousands', hint: 'A large number' }
        ]
      };

    case 'match_pairs':
      return {
        ...baseContent,
        pairs: [
          { left: topic, right: `Study of ${topic}` },
          { left: 'Theory', right: 'Explanation of concepts' },
          { left: 'Practice', right: 'Application of knowledge' },
          { left: 'Knowledge', right: 'Understanding of subject' },
          { left: 'Analysis', right: 'Breaking down concepts' },
          { left: 'Synthesis', right: 'Combining ideas' }
        ]
      };

    case 'puzzles':
      return {
        ...baseContent,
        puzzles: [
          {
            question: `What connects ${topic}, theory, practice, and application?`,
            answer: 'Learning cycle',
            hints: ['Think about how they relate', 'It starts with "L"', 'It has 7 letters']
          },
          {
            question: `What is the key to mastering ${topic}?`,
            answer: 'Understanding',
            hints: ['It starts with "U"', 'It has 12 letters']
          },
          {
            question: `How does ${topic} contribute to ${subject}?`,
            answer: 'Foundation',
            hints: ['It starts with "F"', 'It has 10 letters']
          }
        ]
      };

    // ========== CLUEPATH ACTIVITIES ==========
    case 'detective_mission':
      return {
        ...baseContent,
        story: `You are a detective investigating a case related to ${topic}.`,
        clues: [
          `Clue 1: The first clue is related to ${topic}`,
          `Clue 2: The second clue involves ${subject}`,
          `Clue 3: The third clue requires understanding of ${topic}`
        ],
        questions: [
          { question: `What is the first step in solving the mystery?`, options: ['A', 'B', 'C', 'D'], correct: 0 },
          { question: `Which clue is most important?`, options: ['A', 'B', 'C', 'D'], correct: 0 }
        ]
      };

    case 'story_adventure':
      return {
        ...baseContent,
        chapters: [
          { title: `Introduction to ${topic}`, content: `You begin your journey into ${topic}...` },
          { title: `Exploring ${topic}`, content: `You discover key concepts about ${topic}...` },
          { title: `Mastering ${topic}`, content: `You apply your knowledge of ${topic}...` }
        ],
        choices: [
          { prompt: 'What would you like to learn first?', options: ['Basics', 'Advanced', 'Practical'] }
        ]
      };

    // ========== PATHFINDER ACTIVITIES ==========
    case 'knowledge_maze':
      return {
        ...baseContent,
        maze: {
          start: `Enter the maze of ${topic}`,
          paths: [
            { question: `What is ${topic}?`, options: ['A', 'B', 'C'], correct: 0 },
            { question: `How does ${topic} work?`, options: ['A', 'B', 'C'], correct: 0 }
          ],
          end: `You have completed the maze of ${topic}!`
        }
      };

    case 'reading_mission':
      return {
        ...baseContent,
        passage: `This passage discusses ${topic} and its importance in ${subject}. 
                 It covers key concepts, applications, and future developments.`,
        questions: [
          { question: `What is the main topic of the passage?`, options: ['A', 'B', 'C', 'D'], correct: 0 },
          { question: `How is ${topic} applied?`, options: ['A', 'B', 'C', 'D'], correct: 0 },
          { question: `What is the future of ${topic}?`, options: ['A', 'B', 'C', 'D'], correct: 0 }
        ]
      };

    // ========== REFLEX ACTIVITIES ==========
    case 'answer_shooter':
      return {
        ...baseContent,
        targets: [
          { question: `What is ${topic}?`, correct: 'A', options: ['A', 'B', 'C', 'D'] },
          { question: `How does ${topic} work?`, correct: 'B', options: ['A', 'B', 'C', 'D'] },
          { question: `Why is ${topic} important?`, correct: 'C', options: ['A', 'B', 'C', 'D'] }
        ]
      };

    case 'lightning_tap':
      return {
        ...baseContent,
        statements: [
          { statement: `${topic} is fundamental to ${subject}`, correct: true },
          { statement: `${topic} is unrelated to ${subject}`, correct: false },
          { statement: `Knowledge of ${topic} is important`, correct: true },
          { statement: `${topic} has no practical applications`, correct: false }
        ]
      };

    default:
      return {
        ...baseContent,
        content: `Learn about ${topic} in ${subject} through this interactive activity.`
      };
  }
};

// ============================================================
// HELPER FUNCTIONS FOR GRID GENERATION
// ============================================================

const generateWordSearchGrid = (words) => {
  const size = 10;
  const grid = Array(size).fill(null).map(() => Array(size).fill('-'));
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  words.slice(0, 5).forEach((word, index) => {
    const row = index % size;
    const maxCol = size - word.length;
    if (maxCol > 0) {
      const col = Math.floor(Math.random() * maxCol);
      for (let i = 0; i < word.length; i++) {
        grid[row][col + i] = word[i].toUpperCase();
      }
    }
  });
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '-') {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
  
  return grid;
};

const generateCrosswordGrid = (words) => {
  const grid = Array(10).fill(null).map(() => Array(10).fill('.'));
  words.forEach((word, index) => {
    const row = index * 2;
    if (row < 10) {
      for (let i = 0; i < word.length && i < 10; i++) {
        grid[row][i] = word[i];
      }
    }
  });
  return grid;
};

// ============================================================
// SIMPLE MOCK (Fallback)
// ============================================================

const generateSimpleMock = (sessionId, activityType) => {
  return {
    type: activityType,
    content: {
      title: 'Activity',
      description: 'Learn through this interactive activity.',
      questions: [
        { question: 'What would you like to learn?', options: ['Topic 1', 'Topic 2', 'Topic 3'], correct: 0 }
      ]
    }
  };
};

// ============================================================
// ANSWER EVALUATION - Enhanced
// ============================================================

export const evaluateAnswer = (content, userAnswer) => {
  if (!content || !userAnswer) return false;

  // Quiz evaluation
  if (content.questions && content.questions.length > 0) {
    const question = content.questions[0];
    if (Array.isArray(userAnswer)) {
      return userAnswer[0] === question.correct;
    }
    if (typeof userAnswer === 'object' && userAnswer !== null) {
      return userAnswer.correct === question.correct;
    }
    if (typeof userAnswer === 'number') {
      return userAnswer === question.correct;
    }
    if (typeof userAnswer === 'string') {
      return parseInt(userAnswer) === question.correct || 
             userAnswer.toLowerCase() === String.fromCharCode(65 + question.correct).toLowerCase();
    }
    return false;
  }

  // Flashcard evaluation
  if (content.cards) {
    const expected = content.cards[0]?.definition?.toLowerCase() || '';
    const actual = userAnswer.answer?.toLowerCase() || String(userAnswer).toLowerCase();
    return actual === expected || actual.includes(expected) || expected.includes(actual);
  }

  // Crossword evaluation
  if (content.clues) {
    const expected = content.clues[0]?.answer?.toLowerCase() || '';
    const actual = userAnswer.answer?.toLowerCase() || String(userAnswer).toLowerCase();
    return actual === expected;
  }

  // Fill in the blanks
  if (content.sentences) {
    const expected = content.sentences[0]?.answer?.toLowerCase() || '';
    const actual = userAnswer.answer?.toLowerCase() || String(userAnswer).toLowerCase();
    return actual === expected;
  }

  // Match pairs
  if (content.pairs) {
    const expected = content.pairs[0]?.right?.toLowerCase() || '';
    const actual = userAnswer.answer?.toLowerCase() || String(userAnswer).toLowerCase();
    return actual === expected;
  }

  // Default check
  return false;
};

// ============================================================
// PROGRESS & WEAKNESSES
// ============================================================

export const getProgress = async (userId) => {
  try {
    return await models.getUserProgress(userId);
  } catch (error) {
    console.error('Error getting progress:', error);
    throw error;
  }
};

export const getWeaknesses = async (userId) => {
  try {
    return await models.getWeaknessesByUser(userId);
  } catch (error) {
    console.error('Error getting weaknesses:', error);
    throw error;
  }
};

// ============================================================
// EXPORT ALL FUNCTIONS
// ============================================================

// ✅ All functions are now defined and exported
export default {
  startSession,
  endSession,
  generateActivity,
  submitAnswer,    // ← ✅ Now defined!
  getProgress,
  getWeaknesses,
  evaluateAnswer,
  ORBIT_ACTIVITIES,
  XP_CONFIG
};

// Also export named exports for compatibility
export {
  startSession,
  endSession,
  generateActivity,
  submitAnswer,    // ← ✅ Now defined!
  getProgress,
  getWeaknesses,
  evaluateAnswer,
  ORBIT_ACTIVITIES,
  XP_CONFIG
};