// backend/src/services/aiService.js
import { getAI, isAIAvailableCheck, generateMockResponse } from '../utils/aiUtils.js';

// Helper to choose correct model based on provider
const getModel = (provider) => {
  return provider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
};

/**
 * Generic generate function with fallback
 */
const generate = async (prompt, temperature = 0.7, jsonMode = false) => {
  if (!isAIAvailableCheck()) {
    console.log('ℹ️ Using mock response for prompt:', prompt.substring(0, 50) + '...');
    return generateMockResponse(prompt);
  }

  try {
    const { openai, aiProvider } = getAI();
    const model = getModel(aiProvider);
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an AI educational content generator. Return valid JSON when asked.' },
        { role: 'user', content: prompt }
      ],
      temperature,
      // response_format: jsonMode ? { type: 'json_object' } : undefined, // Groq may not support
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('AI API error:', error.message);
    return generateMockResponse(prompt);
  }
};

// ===== CORTEX ACTIVITIES =====
export const generateCortexQuiz = async ({ subject, topic, grade, count = 5 }) => {
  const prompt = `Generate ${count} multiple-choice questions about "${topic}" in ${subject} for grade ${grade}. 
  Return a JSON object with key "questions" containing an array of objects. 
  Each object must have: "question" (string), "options" (array of 4 strings), "correct" (integer index 0-3).`;
  try {
    const response = await generate(prompt, 0.5, true);
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
    const response = await generate(prompt, 0.5, true);
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
    const response = await generate(prompt, 0.5, true);
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
    const response = await generate(prompt, 0.6, true);
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
    const response = await generate(prompt, 0.5, true);
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
    const response = await generate(prompt, 0.4, true);
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

// ===== GENERIC ORBIT ACTIVITY GENERATOR =====
export const generateOrbitActivity = async (activityType, context) => {
  const { subject, topic, grade, learningStyle } = context;

  if (!isAIAvailableCheck()) {
    console.warn('AI not available – using mock activity');
    return generateMockActivityContent(activityType, context);
  }

  const prompt = buildPrompt(activityType, context);

  try {
    const { openai, aiProvider } = getAI();
    const model = getModel(aiProvider);
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an AI educational content generator. Generate learning activities in valid JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      // response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse JSON, using mock');
      return generateMockActivityContent(activityType, context);
    }
  } catch (error) {
    console.error('AI activity generation error:', error);
    return generateMockActivityContent(activityType, context);
  }
};

const buildPrompt = (activityType, context) => {
  const { subject, topic, grade, learningStyle } = context;
  const promptTemplates = {
    quiz: `Generate 5 multiple-choice questions about "${topic}" in "${subject}" for ${grade} level.
           Learning style: ${learningStyle}.
           Each question should have 4 options and a correct answer index (0-3).
           Return ONLY valid JSON:
           { "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..." } ] }`,
    flashcards: `Generate 8 flashcards about "${topic}" in "${subject}" for ${grade} level.
                 Return ONLY valid JSON:
                 { "flashcards": [ { "question": "...", "answer": "..." } ] }`,
    memory_match: `Create a memory match game with 6 pairs about "${topic}" in "${subject}".
                   Return ONLY valid JSON:
                   { "pairs": [ { "term": "...", "definition": "..." } ] }`,
    crossword: `Create a crossword puzzle with 8 clues about "${topic}" in "${subject}".
                Return ONLY valid JSON:
                { "clues": [ { "clue": "...", "answer": "...", "row": 0, "col": 0, "direction": "across" } ] }`,
    detective_mission: `Create a detective mission story about solving a mystery related to "${topic}" in "${subject}".
                        Include 3 decision points with options. Return ONLY valid JSON:
                        { "title": "...", "story": "...", "decisions": [ { "step": 1, "text": "...", "options": ["A", "B", "C"], "correct": 0 } ] }`,
    story_adventure: `Create a short educational story adventure about "${topic}" in "${subject}" for ${grade} level.
                      Include 2-3 questions the student must answer. Return ONLY valid JSON:
                      { "title": "...", "chapters": [ { "text": "...", "question": "...", "options": ["A", "B", "C"], "correct": 0 } ] }`,
    knowledge_maze: `Create a knowledge maze about "${topic}" in "${subject}" with 5 questions.
                     Each correct answer unlocks the next question. Return ONLY valid JSON:
                     { "maze": [ { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0 } ] }`,
    rapid_fire: `Generate 10 rapid-fire questions about "${topic}" in "${subject}" for ${grade} level.
                 These should be quick to answer (single word or number). Return ONLY valid JSON:
                 { "questions": [ { "question": "...", "answer": "..." } ] }`
  };
  return promptTemplates[activityType] || promptTemplates.quiz;
};

const generateMockActivityContent = (activityType, context) => {
  const { subject, topic } = context;
  const mockContent = {
    quiz: {
      questions: [
        {
          question: `What is the main concept of ${topic} in ${subject}?`,
          options: [`Definition A`, `Definition B`, `Definition C`, `Definition D`],
          correct: 0,
          explanation: `${topic} is best understood through continuous practice.`
        },
        {
          question: `Which of the following is most related to ${topic}?`,
          options: [`Related concept A`, `Related concept B`, `Related concept C`, `Related concept D`],
          correct: 1,
          explanation: `${topic} is closely connected to Related concept B.`
        }
      ]
    },
    flashcards: {
      flashcards: [
        { question: `What is ${topic}?`, answer: `${topic} is a key concept in ${subject}.` },
        { question: `Why is ${topic} important?`, answer: `It helps understand ${subject} better.` }
      ]
    },
    memory_match: {
      pairs: [
        { term: `Term 1`, definition: `Definition 1` },
        { term: `Term 2`, definition: `Definition 2` },
        { term: `Term 3`, definition: `Definition 3` }
      ]
    }
  };
  return mockContent[activityType] || mockContent.quiz;
};

export const generateQuiz = async ({ title, description, count = 5 }) => {
  const prompt = `Generate ${count} multiple-choice questions about the topic: "${title}". 
  Context: ${description || 'General knowledge'}.
  Each question should have 4 options and a correct answer index (0-3).
  Return ONLY valid JSON:
  { "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0 } ] }`;

  try {
    const response = await generate(prompt, 0.5, true);
    const parsed = JSON.parse(response);
    const questions = parsed.questions || parsed;
    if (!Array.isArray(questions)) throw new Error('No questions generated');
    return questions.map(q => ({
      question: q.question || 'Question',
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correct: typeof q.correct === 'number' ? q.correct : 0,
    }));
  } catch (error) {
    console.error('Quiz generation error:', error);
    return [
      { question: `What is the main concept of "${title}"?`, options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'], correct: 0 },
      { question: `Which of the following is related to "${title}"?`, options: ['Related 1', 'Related 2', 'Related 3', 'Related 4'], correct: 1 },
      { question: `What is the best approach to learn "${title}"?`, options: ['Approach 1', 'Approach 2', 'Approach 3', 'Approach 4'], correct: 2 },
    ];
  }
};