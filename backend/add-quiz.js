import db from './src/db.js';

const goalId = 14;
const milestoneIndex = 0; // first milestone

const quiz = {
  questions: [
    {
      question: "What is an algorithm?",
      options: ["A set of instructions", "A programming language", "A data structure"],
      correct: 0
    }
  ]
};

(async () => {
  // First, set milestone is_completed = false (if needed)
  await db.query(
    `UPDATE goals SET milestones = jsonb_set(milestones, $1, $2) WHERE id = $3`,
    [`{${milestoneIndex},is_completed}`, 'false', goalId]
  );
  // Then add quiz
  await db.query(
    `UPDATE goals SET milestones = jsonb_set(milestones, $1, $2) WHERE id = $3`,
    [`{${milestoneIndex},quiz}`, JSON.stringify(quiz), goalId]
  );
  console.log('Quiz added to milestone', milestoneIndex, 'of goal', goalId);
  process.exit();
})();
