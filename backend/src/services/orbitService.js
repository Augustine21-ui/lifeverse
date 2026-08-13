// backend/src/services/orbitService.js
import db from '../config/db.js';
import { generateActivity } from './aiService.js';

export const generateOrbitActivities = async ({ subject, topic, grade, activityTypes = ['cortex', 'cluepath', 'pathfinder', 'reflex'] }) => {
  const activities = [];
  for (const type of activityTypes) {
    try {
      const content = await generateActivity(type, { subject, topic, grade });
      
      if (!content || typeof content !== 'object') {
        throw new Error(`Generated content for ${type} is not an object.`);
      }

      const contentJson = JSON.stringify(content);
      const result = await db.query(
        `INSERT INTO orbit_activities (subject, topic, grade, activity_type, content)
         VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id`,
        [subject, topic, grade, type, contentJson]
      );
      
      activities.push({ id: result.rows[0].id, type, content });
    } catch (error) {
      console.error(`Failed to generate activity (${type}):`, error);
      throw new Error(`Failed to generate ${type} activity: ${error.message}`);
    }
  }
  return activities;
};

// ... rest of the file (startSession, endSession, submitAnswer)

export const startSession = async (userId, subject, topic, mixup = false) => {
  const result = await db.query(
    `INSERT INTO orbit_sessions (user_id, subject, topic, mixup_mode) VALUES ($1, $2, $3, $4) RETURNING id`,
    [userId, subject, topic, mixup]
  );
  return result.rows[0].id;
};

export const endSession = async (sessionId, score, activitiesCompleted) => {
  await db.query(
    `UPDATE orbit_sessions SET end_time = NOW(), score = $1, activities_completed = $2 WHERE id = $3`,
    [score, activitiesCompleted, sessionId]
  );
};

export const submitAnswer = async (sessionId, activityId, userAnswer, timeSpent) => {
  // Fetch the activity
  const activityRes = await db.query('SELECT content, correct_answer FROM orbit_activities WHERE id = $1', [activityId]);
  if (activityRes.rows.length === 0) {
    throw new Error('Activity not found');
  }
  const activity = activityRes.rows[0];
  const content = activity.content;
  const correct = activity.correct_answer;

  // Determine correctness
  let isCorrect = false;

  // If correct_answer is null, we can't check; assume false? or maybe we need to parse content differently.
  // For now, if no correct_answer, we'll set isCorrect = false and log.
  if (!correct) {
    console.warn(`No correct_answer for activity ${activityId}, marking as incorrect.`);
    isCorrect = false;
  } else {
    // Check based on type (simplified)
    if (correct.correct !== undefined) {
      // For cortex/cluepath: correct is an index
      isCorrect = (userAnswer === correct.correct);
    } else if (correct.answers && Array.isArray(correct.answers)) {
      // For reflex: answers array; we'll compare with the first one for simplicity
      isCorrect = (userAnswer === correct.answers[0]);
    } else if (correct.steps && Array.isArray(correct.steps)) {
      // Pathfinder: userAnswer should be array of step indices; compare JSON
      isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correct.steps);
    } else {
      // fallback: maybe content has a correct field
      if (content.correct !== undefined) {
        isCorrect = (userAnswer === content.correct);
      } else if (content.answer !== undefined) {
        isCorrect = (userAnswer === content.answer);
      } else {
        console.warn(`Unknown correct_answer format for activity ${activityId}`, correct);
        isCorrect = false;
      }
    }
  }

  // Insert response
  await db.query(
    `INSERT INTO orbit_responses (session_id, activity_id, user_answer, is_correct, time_spent_seconds)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, activityId, JSON.stringify(userAnswer), isCorrect, timeSpent || 0]
  );

  // Track weakness if incorrect
  if (!isCorrect) {
    try {
      const sessionRes = await db.query('SELECT subject, topic, user_id FROM orbit_sessions WHERE id = $1', [sessionId]);
      if (sessionRes.rows.length > 0) {
        const { subject, topic, user_id } = sessionRes.rows[0];
        // Get concept from content if possible
        let concept = 'Unknown concept';
        if (content.question) {
          concept = content.question;
        } else if (content.story) {
          concept = content.story.substring(0, 100);
        }
        await db.query(
          `INSERT INTO orbit_weaknesses (user_id, subject, topic, concept, difficulty_level)
           VALUES ($1, $2, $3, $4, $5)`,
          [user_id, subject, topic, concept, 1]
        );
      }
    } catch (err) {
      console.error('Failed to track weakness:', err);
      // Non-critical, continue
    }
  }

  return isCorrect;

  // Update mastery for the subject/topic of the session
const sessionRes = await db.query('SELECT subject, topic FROM orbit_sessions WHERE id = $1', [sessionId]);
const { subject, topic } = sessionRes.rows[0];

// Insert or update mastery
await db.query(
  `INSERT INTO user_mastery (user_id, subject, topic, activities_attempted, activities_correct, mastery_score, last_updated)
   VALUES ($1, $2, $3, 1, $4, $5, NOW())
   ON CONFLICT (user_id, subject, topic) 
   DO UPDATE SET 
     activities_attempted = user_mastery.activities_attempted + 1,
     activities_correct = user_mastery.activities_correct + $4,
     mastery_score = (user_mastery.activities_correct + $4)::float / (user_mastery.activities_attempted + 1) * 100,
     last_updated = NOW()`,
  [req.user.id, subject, topic, isCorrect ? 1 : 0]
);
};