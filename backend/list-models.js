import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });  // adjust path if needed

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const models = await genAI.models.list();
    console.log("Available models:");
    models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();