// backend/src/utils/aiUtils.js
import OpenAI from 'openai';

let openai = null;
let isAIAvailable = false;
let aiProvider = 'none';

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
    console.log("✅ Groq AI initialized successfully");
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
    console.log("✅ OpenAI initialized successfully");
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

// Mock response generator (remains the same)
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

// backend/src/utils/aiUtils.js
// ... existing code ...

export const getModelForProvider = (provider) => {
  if (provider === 'groq') {
    return process.env.GROQ_MODEL || "llama3-70b-8192";
  }
  // Default to OpenAI model
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
};