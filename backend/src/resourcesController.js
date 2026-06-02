import { query } from './db.js';

// Static resource data – can be extended from a database table later
const resources = {
  Mathematics: [
    { title: "Intro to Quadratic Equations", type: "Lecture", duration: "24 min", xp: 40 },
    { title: "Algebra Fundamentals", type: "Exercise", duration: "30 min", xp: 60 },
  ],
  Biology: [
    { title: "Cell Biology Summary Notes", type: "Study Guide", duration: "15 min read", xp: 25 },
    { title: "DNA Replication", type: "Video", duration: "12 min", xp: 35 },
  ],
  Chemistry: [
    { title: "Periodic Table", type: "Interactive", duration: "20 min", xp: 30 },
  ],
  Physics: [
    { title: "Newton's Laws", type: "Lecture", duration: "25 min", xp: 45 },
  ],
  History: [
    { title: "World War II", type: "Documentary", duration: "40 min", xp: 50 },
  ],
};

export const getResources = async (req, res) => {
  const { subject } = req.query;
  if (!subject) return res.status(400).json({ error: 'Subject is required' });
  const subjectResources = resources[subject] || [];
  res.json(subjectResources);
};
