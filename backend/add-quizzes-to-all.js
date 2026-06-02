import db from './src/db.js';

const generateQuiz = (title) => ({
  questions: [
    {
      question: `What is the primary objective of "${title}"?`,
      options: [
        `Master the key concepts of ${title}`,
        `Only complete a single exercise`,
        `Skip ${title} entirely`
      ],
      correct: 0
    },
    {
      question: `How will mastering "${title}" help you?`,
      options: [
        `It will improve your problem‑solving skills`,
        `It has no real benefit`,
        `It only helps with exams`
      ],
      correct: 0
    }
  ]
});

(async () => {
  const goals = await db.query('SELECT id, milestones FROM goals');
  for (const goal of goals.rows) {
    let milestones = goal.milestones || [];
    let updated = false;
    for (let i = 0; i < milestones.length; i++) {
      if (!milestones[i].quiz) {
        milestones[i].quiz = generateQuiz(milestones[i].title);
        updated = true;
      }
    }
    if (updated) {
      await db.query('UPDATE goals SET milestones = $1 WHERE id = $2', [JSON.stringify(milestones), goal.id]);
      console.log(`Updated goal ${goal.id}`);
    }
  }
  console.log('Done');
  process.exit();
})();