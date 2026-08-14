import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const explain = async (req, res) => {
  try {
    const { subject, topic, question } = req.body;
    const prompt = `You are an expert tutor. Explain the following concept in simple terms for a student studying ${subject}, specifically ${topic}. Concept: ${question}`;
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    const explanation = chatCompletion.choices[0]?.message?.content || 'No explanation available.';
    res.json({ explanation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
};

export const explain = async (req, res) => {
  try {
    const { concept, level } = req.body;
    res.json({
      explanation: `Concept explained: ${concept} at ${level || "beginner"} level.`,
      mock: true,
      message: "AI explanation (mock mode)"
    });
  } catch (error) {
    console.error("Explain error:", error);
    res.status(500).json({ error: "Failed to explain concept" });
  }
};