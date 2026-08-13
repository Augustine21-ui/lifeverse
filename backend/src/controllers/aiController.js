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