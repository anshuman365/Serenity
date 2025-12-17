import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

// Initialize Gemini
// Note: In a real environment, keys should be protected.
// For this demo, we assume process.env is available or we handle the missing key gracefully.
const apiKey = process.env.GEMINI_API_KEY || ''; 
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateGeminiResponse = async (
  history: Message[], 
  systemPrompt: string
): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API Key is missing.");
  }

  try {
    // Gemini 2.5 Flash is recommended for basic text tasks
    const model = 'gemini-2.5-flash';
    
    // Construct the prompt context manually since the Chat structure differs slightly
    // between providers. We prepend the system prompt.
    let fullPrompt = `${systemPrompt}\n\n`;
    
    // Add conversation history for context
    history.forEach(msg => {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}\n`;
    });
    
    fullPrompt += `Model:`;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};