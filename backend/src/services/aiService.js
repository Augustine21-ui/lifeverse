// backend/src/services/aiService.js

// ✅ Conditional initialization - don't crash if API key is missing
let groq = null;
let isGroqAvailable = false;

const groqApiKey = process.env.GROQ_API_KEY;

// Try to initialize Groq if API key exists
if (groqApiKey && groqApiKey !== 'your_groq_api_key_here' && groqApiKey.startsWith('gsk_')) {
  try {
    // Dynamic import to avoid top-level crash
    const Groq = (await import('groq-sdk')).default;
    groq = new Groq({
      apiKey: groqApiKey,
    });
    isGroqAvailable = true;
    console.log('✅ Groq AI service initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Groq:', error.message);
  }
}

if (!isGroqAvailable) {
  console.log('ℹ️ Groq AI service disabled - running in mock mode');
  console.log('   Set GROQ_API_KEY to enable real AI');
}

/**
 * Generic generate function with fallback
 */
const generate = async (prompt, model = 'llama-3.3-70b-versatile', temperature = 0.7) => {
  // If Groq is not available, return mock data
  if (!isGroqAvailable || !groq) {
    console.log('ℹ️ Using mock response for prompt:', prompt.substring(0, 50) + '...');
    return generateMockResponse(prompt);
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model,
      temperature,
      response_format: { type: 'json_object' },
    });
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error.message);
    return generateMockResponse(prompt);
  }
};

/**
 * Generate mock response when AI is unavailable
 */
const generateMockResponse = (prompt) => {
  const mockResponses = {
    'multiple-choice': JSON.stringify({
      questions: [
        { question: 'What is the main concept?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 },
        { question: 'Which statement is correct?', options: ['Statement 1', 'Statement 2', 'Statement 3', 'Statement 4'], correct: 1 },
        { question: 'What is the best approach?', options: ['Approach 1', 'Approach 2', 'Approach 3', 'Approach 4'], correct: 2 }
      ]
    }),
    'flashcards': JSON.stringify({
      flashcards: [
        { question: 'What is this concept?', answer: 'This is a mock answer' },
        { question: 'Why is this important?', answer: 'Because it helps learning' }
      ]
    }),
    'memory_match': JSON.stringify({
      pairs: [
        { term: 'Term 1', definition: 'Definition 1' },
        { term: 'Term 2', definition: 'Definition 2' },
        { term: 'Term 3', definition: 'Definition 3' },
        { term: 'Term 4', definition: 'Definition 4' }
      ]
    }),
    'cluepath': JSON.stringify({
      story: 'A mysterious event occurred in the lab.',
      question: 'What was the main cause?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correct: 0
    }),
    'pathfinder': JSON.stringify({
      instruction: 'Order the following steps:',
      steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']
    }),
    'reflex': JSON.stringify({
      questions: [
        { question: 'What is 2+2?', answer: '4' },
        { question: 'What is the capital of France?', answer: 'Paris' }
      ]
    })
  };

  // Try to determine the type from the prompt
  let type = 'multiple-choice';
  if (prompt.includes('flashcard')) type = 'flashcards';
  else if (prompt.includes('memory match')) type = 'memory_match';
  else if (prompt.includes('mystery')) type = 'cluepath';
  else if (prompt.includes('sequence ordering')) type = 'pathfinder';
  else if (prompt.includes('rapid-fire')) type = 'reflex';

  return mockResponses[type] || mockResponses['multiple-choice'];
};

// ===== CORTEX ACTIVITIES =====

export const generateCortexQuiz = async ({ subject, topic, grade, count = 5 }) => {
  const prompt = `Generate ${count} multiple-choice questions about "${topic}" in ${subject} for grade ${grade}. 
  Return a JSON object with key "questions" containing an array of objects. 
  Each object must have: "question" (string), "options" (array of 4 strings), "correct" (integer index 0-3).`;
  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);
    const questions = parsed.questions || parsed;
    if (!Array.isArray(questions)) throw new Error('No questions generated');
    return questions.map(q => ({
      question: q.question || 'Question',
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correct: typeof q.correct === 'number' ? q.correct : 0,
    }));
  } catch (error) {
    console.error('Cortex generation error:', error);
    return [
      { question: `What is the main process in ${topic}?`, options: ['Process A', 'Process B', 'Process C', 'Process D'], correct: 0 },
      { question: `Which of the following is related to ${topic}?`, options: ['Related 1', 'Related 2', 'Related 3', 'Related 4'], correct: 1 },
    ];
  }
};

export const generateFlashcards = async ({ subject, topic, grade, count = 5 }) => {
  const prompt = `Generate ${count} flashcards about "${topic}" in ${subject} for grade ${grade}. 
  Return a JSON object with key "flashcards" containing an array of objects with keys: "question", "answer".`;
  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);
    const flashcards = parsed.flashcards || parsed;
    return Array.isArray(flashcards) ? flashcards.slice(0, count) : [];
  } catch (error) {
    console.error('Flashcard generation error:', error);
    return [
      { question: `What is ${topic}?`, answer: `The process of ${topic} in ${subject}` },
      { question: `Why is ${topic} important?`, answer: `It is essential for understanding ${subject}` },
    ];
  }
};

export const generateMemoryMatch = async ({ subject, topic, grade }) => {
  const prompt = `Create a memory match game about "${topic}" in ${subject} for grade ${grade}. 
  Generate 8 pairs (16 cards total). Each pair should have a term and its matching definition.
  Return a JSON object with key "pairs" containing an array of objects with keys: "term", "definition".`;
  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);
    const pairs = parsed.pairs || parsed;
    return Array.isArray(pairs) ? pairs.slice(0, 8) : [];
  } catch (error) {
    console.error('Memory match generation error:', error);
    return [
      { term: 'Term 1', definition: 'Definition 1' },
      { term: 'Term 2', definition: 'Definition 2' },
      { term: 'Term 3', definition: 'Definition 3' },
      { term: 'Term 4', definition: 'Definition 4' },
    ];
  }
};

// ===== CLUEPATH =====

export const generateCluePath = async ({ subject, topic, grade }) => {
  const prompt = `Create a short mystery story about "${topic}" in ${subject} for grade ${grade}. 
  Include a question that the student must answer to solve the mystery. 
  Return a JSON object with keys: "story" (string), "question" (string), "options" (array of 4 strings), "correct" (index).`;
  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);
    return {
      story: parsed.story || 'A mysterious event occurred.',
      question: parsed.question || 'What happened?',
      options: Array.isArray(parsed.options) ? parsed.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correct: typeof parsed.correct === 'number' ? parsed.correct : 0,
    };
  } catch (error) {
    console.error('CluePath generation error:', error);
    return {
      story: `A strange event happened in the ${topic} lab.`,
      question: 'What was the main cause?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correct: 0,
    };
  }
};

// ===== PATHFINDER =====

export const generatePathfinder = async ({ subject, topic, grade }) => {
  const prompt = `Create a sequence ordering activity about "${topic}" in ${subject} for grade ${grade}. 
  Provide 4-5 steps/items in the correct order. 
  Return a JSON object with: "instruction" (string), "steps" (array of strings).`;
  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);
    return {
      instruction: parsed.instruction || 'Order the following steps:',
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 5) : ['Step 1', 'Step 2', 'Step 3'],
    };
  } catch (error) {
    console.error('Pathfinder generation error:', error);
    return {
      instruction: 'Order the steps correctly:',
      steps: ['First', 'Second', 'Third', 'Fourth', 'Fifth'],
    };
  }
};

// ===== REFLEX =====

export const generateReflex = async ({ subject, topic, grade, count = 3 }) => {
  const prompt = `Generate ${count} very short rapid-fire questions about "${topic}" in ${subject} for grade ${grade}. 
  Each question should be a single sentence and the answer should be a single word or number. 
  Return a JSON object with key "questions" containing an array of objects: [{"question": "...", "answer": "..."}].`;
  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);
    const questions = parsed.questions || parsed;
    return Array.isArray(questions) ? questions.slice(0, count) : [];
  } catch (error) {
    console.error('Reflex generation error:', error);
    return [
      { question: `What is the capital of France?`, answer: 'Paris' },
      { question: `What is 2+2?`, answer: '4' },
    ];
  }
};

// ===== UNIFIED GENERATOR =====

export const generateActivity = async (type, params) => {
  switch (type) {
    case 'cortex': return generateCortexQuiz(params);
    case 'flashcards': return generateFlashcards(params);
    case 'memory_match': return generateMemoryMatch(params);
    case 'cluepath': return generateCluePath(params);
    case 'pathfinder': return generatePathfinder(params);
    case 'reflex': return generateReflex(params);
    default: throw new Error(`Unsupported activity type: ${type}`);
  }
};