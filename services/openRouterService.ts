import { Message, IntentionResponse, NewsArticle } from '../types';
import { CONFIG } from './config';

const getHeaders = () => ({
  "Authorization": `Bearer ${CONFIG.OPENROUTER_API}`,
  "Content-Type": "application/json",
  "HTTP-Referer": window.location.origin,
  "X-Title": "Serenity Personal AI",
});

// 1. Classify User Intention
export const classifyUserIntention = async (userInput: string): Promise<IntentionResponse> => {
  if (!CONFIG.OPENROUTER_API) throw new Error("OpenRouter API Key missing");

  const systemInstruction = `
    Analyze the user's input and classify the intention into one of three categories:
    1. 'generate_image' -> If the user explicitly asks to create, draw, generate, or show an image/picture/photo.
    2. 'fetch_news' -> If the user asks for latest news, updates, headlines, or current events.
    3. 'chat' -> For normal conversation, advice, emotional support, or general questions.

    Return ONLY a raw JSON object (no markdown formatting) with this structure:
    {
      "type": "chat" | "generate_image" | "fetch_news",
      "query": "extracted core subject or optimized prompt"
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // Fast model for classification
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userInput }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Clean string to ensure valid JSON
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn("Classification failed, defaulting to chat", error);
    return { type: 'chat', query: userInput };
  }
};

// 2. Main Chat Generation
export const generateOpenRouterResponse = async (
  history: Message[],
  systemPrompt: string
): Promise<string> => {
  if (!CONFIG.OPENROUTER_API) throw new Error("OpenRouter API Key missing");

  // We use google/gemini-2.0-flash-exp via OpenRouter as it's often free/cheap and smart, 
  // or fallback to whatever you have configured.
  const MODEL = "google/gemini-2.0-flash-001"; 

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL, 
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Chat Gen Error:", error);
    throw error;
  }
};

// 3. Summarize News
export const summarizeNewsForChat = async (news: NewsArticle[], originalQuery: string, systemPersona: string): Promise<string> => {
  if (!news.length) return "Baby, mujhe abhi koi news nahi mili.";

  const newsContext = news.map(n => `- ${n.title}: ${n.description}`).join('\n');
  
  const prompt = `
    ${systemPersona}
    
    The user asked: "${originalQuery}".
    Here is the latest news data I fetched:
    ${newsContext}

    Please summarize this news for the user in your boyfriend persona (Hinglish). 
    Keep it engaging but informative. Don't list everything boringly, talk like you are sharing updates with your girlfriend.
  `;

  return generateOpenRouterResponse([], prompt);
};