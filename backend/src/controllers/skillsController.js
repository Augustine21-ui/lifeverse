// backend/src/controllers/skillsController.js
export const getMastery = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT subject, topic, mastery_score, activities_attempted, activities_correct
       FROM user_mastery
       WHERE user_id = $1
       ORDER BY subject, topic`,
      [userId]
    );
    // Also compute overall per‑subject average
    const subjectMap = {};
    result.rows.forEach(row => {
      if (!subjectMap[row.subject]) subjectMap[row.subject] = { total: 0, count: 0 };
      subjectMap[row.subject].total += row.mastery_score;
      subjectMap[row.subject].count += 1;
    });
    const subjectSummary = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      averageMastery: Math.round(data.total / data.count),
      topicCount: data.count,
    }));
    res.json({ topics: result.rows, subjects: subjectSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mastery' });
  }
};