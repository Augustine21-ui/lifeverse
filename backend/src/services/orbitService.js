// backend/src/services/orbitService.js
import db from '../config/db.js';
import * as models from '../models/orbitModels.js';
import { generateOrbitActivity } from './aiService.js';

// ============================================================
// XP CONFIGURATION
// ============================================================

const XP_CONFIG = {
  // Cortex
  quiz: { base: 30, bonus: 10 },
  flashcards: { base: 20, bonus: 5 },
  memory_match: { base: 25, bonus: 8 },
  crossword: { base: 35, bonus: 12 },
  word_search: { base: 25, bonus: 5 },
  fill_blanks: { base: 30, bonus: 10 },
  match_pairs: { base: 25, bonus: 8 },
  puzzles: { base: 40, bonus: 15 },

  // CluePath
  detective_mission: { base: 45, bonus: 20 },
  story_adventure: { base: 40, bonus: 15 },
  escape_challenge: { base: 50, bonus: 25 },
  solve_clues: { base: 35, bonus: 15 },
  educational_riddles: { base: 30, bonus: 10 },
  rapid_fire: { base: 25, bonus: 8 },

  // Pathfinder
  knowledge_maze: { base: 40, bonus: 15 },
  hidden_object: { base: 30, bonus: 10 },
  reading_mission: { base: 35, bonus: 12 },
  reading_summary: { base: 35, bonus: 12 },
  interactive_diagram: { base: 30, bonus: 10 },
  sequence_builder: { base: 30, bonus: 10 },
  concept_maps: { base: 35, bonus: 12 },

  // Reflex
  answer_shooter: { base: 20, bonus: 5 },
  bubble_pop: { base: 15, bonus: 3 },
  lightning_tap: { base: 15, bonus: 3 },
  target_strike: { base: 20, bonus: 5 },
  speed_match: { base: 20, bonus: 5 },
  rapid_recall: { base: 25, bonus: 8 },
  swipe_challenge: { base: 20, bonus: 5 }
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

    // Calculate XP
    const xpConfig = XP_CONFIG[session.activity_type] || { base: 25, bonus: 5 };
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const xpEarned = Math.round(xpConfig.base + (percentage / 100) * xpConfig.bonus);

    // Update session
    const completed = await models.completeSession(
      sessionId, score, totalQuestions, correctAnswers, timeSpent, xpEarned
    );

    // Update mastery
    await models.updateMastery(
      session.user_id, session.subject, session.topic,
      percentage >= 60, xpEarned
    );

    // Save activity history
    await models.saveActivityHistory(
      session.user_id, sessionId, session.activity_type, session.orbit_type,
      session.subject, session.topic, score, totalQuestions, correctAnswers,
      timeSpent, xpEarned
    );

    // Award XP to user
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
// ACTIVITY GENERATION (using new AI generators)
// ============================================================

export const generateActivity = async (sessionId, activityType) => {
  try {
    const session = await models.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Get user context
    const userResult = await db.query(
      `SELECT id, full_name, education_level, course, learning_style FROM users WHERE id = $1`,
      [session.user_id]
    );
    const user = userResult.rows[0] || {};

    const context = {
      subject: session.subject,
      topic: session.topic,
      grade: user.education_level || 'University',
      learningStyle: user.learning_style || 'visual'
    };

    // Generate content using the new AI generators
    const content = await generateOrbitActivity(activityType, context);

    // Save activity
    const activity = await models.saveActivity(sessionId, activityType, content);

    return activity;
  } catch (error) {
    console.error('Error generating orbit activity:', error);
    // Fallback mock
    return generateMockActivity(sessionId, activityType);
  }
};

// ============================================================
// ANSWER SUBMISSION
// ============================================================

export const submitAnswer = async (activityId, userAnswer, timeTaken) => {
  try {
    const activity = await db.query(
      `SELECT * FROM orbit_activities WHERE id = $1`,
      [activityId]
    );
    if (!activity.rows[0]) throw new Error('Activity not found');

    const content = activity.rows[0].content;
    const isCorrect = evaluateAnswer(content, userAnswer);

    // Update activity
    const updated = await models.submitActivityAnswer(activityId, userAnswer, isCorrect, timeTaken);

    // Update session
    const session = await models.getSession(activity.rows[0].session_id);
    if (session) {
      const newTotal = session.total_questions + 1;
      const newCorrect = session.correct_answers + (isCorrect ? 1 : 0);
      const newScore = Math.round((newCorrect / newTotal) * 100);

      await models.updateSession(session.id, {
        total_questions: newTotal,
        correct_answers: newCorrect,
        score: newScore,
        time_spent: session.time_spent + timeTaken
      });

      // Track weakness if incorrect
      if (!isCorrect) {
        const concept = content.concept || session.topic;
        await models.updateWeakness(
          session.user_id, session.subject, session.topic,
          concept, false
        );
      }
    }

    return { isCorrect, updated };
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
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
// ANSWER EVALUATION
// ============================================================

export const evaluateAnswer = (content, userAnswer) => {
  if (!content || !userAnswer) return false;

  // Quiz / multiple choice
  if (content.questions && content.questions.length > 0) {
    const question = content.questions[0];
    return userAnswer.correct === question.correct;
  }

  // Flashcards / Q&A
  if (content.flashcards) {
    return userAnswer.answer?.toLowerCase() === content.flashcards[0]?.answer?.toLowerCase();
  }

  // Memory match / pairs
  if (content.pairs) {
    return userAnswer.match === true; // simplified
  }

  // Crossword
  if (content.clues) {
    return userAnswer.answer?.toLowerCase() === content.clues[0]?.answer?.toLowerCase();
  }

  // Rapid fire / quick answer
  if (content.questions && !content.questions[0]?.options) {
    return userAnswer.answer?.toLowerCase() === content.questions[0]?.answer?.toLowerCase();
  }

  // Default fallback
  return false;
};

// ============================================================
// MOCK GENERATOR (fallback when AI fails)
// ============================================================

const generateMockActivity = (sessionId, activityType) => {
  const mockContent = {
    quiz: {
      questions: [
        {
          question: 'What is the main concept of this topic?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: 0,
          explanation: 'This is a mock question. Enable AI for real content.'
        }
      ]
    },
    flashcards: {
      flashcards: [
        { question: 'Mock flashcard 1', answer: 'Mock answer 1' },
        { question: 'Mock flashcard 2', answer: 'Mock answer 2' }
      ]
    },
    memory_match: {
      pairs: [
        { term: 'Term 1', definition: 'Definition 1' },
        { term: 'Term 2', definition: 'Definition 2' }
      ]
    },
    crossword: {
      clues: [
        { clue: 'Mock clue 1', answer: 'answer1', row: 0, col: 0, direction: 'across' }
      ]
    }
  };

  return {
    type: activityType,
    content: mockContent[activityType] || mockContent.quiz,
    mock: true,
    message: 'AI service unavailable – using mock content'
  };
};