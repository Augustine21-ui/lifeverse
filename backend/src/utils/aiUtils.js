// backend/src/utils/aiUtils.js
import OpenAI from 'openai';

let openai = null;
let isAIAvailable = false;
let aiProvider = 'none';
let activeModel = null;

const groqApiKey = process.env.GROQ_API_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

// Try to initialize with GROQ_API_KEY first
if (groqApiKey && groqApiKey !== "your_groq_api_key_here" && groqApiKey.startsWith("gsk_")) {
  try {
    openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    isAIAvailable = true;
    aiProvider = "groq";
    // Use Mixtral – widely available and reliable
    activeModel = process.env.GROQ_MODEL || "mixtral-8x7b-32768";
    console.log(`✅ Groq AI initialized successfully (default model: ${activeModel})`);
  } catch (error) {
    console.warn("⚠️ Failed to initialize Groq:", error.message);
  }
} else if (openAiKey && openAiKey !== "your_openai_api_key_here" && openAiKey.startsWith("sk-")) {
  try {
    openai = new OpenAI({
      apiKey: openAiKey,
    });
    isAIAvailable = true;
    aiProvider = "openai";
    activeModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
    console.log(`✅ OpenAI initialized successfully (model: ${activeModel})`);
  } catch (error) {
    console.warn("⚠️ Failed to initialize OpenAI:", error.message);
  }
}

if (!isAIAvailable) {
  console.log("ℹ️ AI services disabled - running in mock mode");
}

export const getAI = () => {
  if (!isAIAvailable || !openai) {
    throw new Error("AI service is not available");
  }
  return { openai, aiProvider };
};

export const isAIAvailableCheck = () => isAIAvailable;

export const getAIProvider = () => aiProvider;

export const getModelForProvider = (provider) => {
  if (provider === 'groq') {
    // Use environment variable if set, otherwise default to Mixtral
    return process.env.GROQ_MODEL || "mixtral-8x7b-32768";
  }
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
};

// Mock response generator (unchanged)
export const generateMockResponse = (type, topic) => {
  const mockResponses = {
    focus: `Here's a focus tip for ${topic}: Break down your study session into 25-minute blocks with 5-minute breaks in between.`,
    personalization: `Based on your learning style, I recommend exploring ${topic} through interactive exercises and real-world examples.`,
    quiz: `Here's a quick quiz question about ${topic}: What is the most important concept to understand?`,
    task: `To master ${topic}, try this task: Create a summary of the key points and explain them to someone else.`,
    tutor: `Let me help you with ${topic}. The key to understanding this concept is to practice regularly and ask questions.`
  };
  return mockResponses[type] || `Here's some help with ${topic}: Keep learning and stay curious!`;
};