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
  // Fail fast if no key
  if (!CONFIG.OPENROUTER_API) {
    console.error("OpenRouter Key is missing in config");
    // Default to chat if key is missing so we can show the error in the UI
    return { type: 'chat', query: userInput }; 
  }

  const systemInstruction = `
    You are an intention classifier. Analyze the input and return a JSON object.
    
    Categories:
    1. 'generate_image': User wants to create/draw/see an image.
    2. 'fetch_news': User asks for news, headlines, updates.
    3. 'chat': Normal conversation.

    Response Format (JSON ONLY):
    {
      "type": "chat" | "generate_image" | "fetch_news",
      "query": "refined search query or prompt"
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // Lightweight model for classification
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userInput }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter Classifier Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse JSON safely
    try {
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        // Fallback if model didn't return valid JSON
        return { type: 'chat', query: userInput };
    }
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
  
  if (!CONFIG.OPENROUTER_API) {
    throw new Error("API Key missing. Please add OPENROUTER_API in .env or Settings.");
  }

  // Using a reliable model via OpenRouter (Gemini Flash via OpenRouter or GPT-3.5)
  // Google models via OpenRouter are often free/cheap.
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

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Hmm, I couldn't think of a response.";
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw error;
  }
};

// 3. Summarize News
export const summarizeNewsForChat = async (news: NewsArticle[], originalQuery: string, systemPersona: string): Promise<string> => {
  if (!news.length) return "Baby, mujhe koi latest news nahi mili abhi.";

  const newsContext = news.map(n => `- ${n.title} (${n.source})`).join('\n');
  
  const prompt = `
    ${systemPersona}
    
    Context: The user asked about "${originalQuery}".
    I have fetched these headlines:
    ${newsContext}

    Task: Summarize these updates for the user in your boyfriend persona (Hinglish).
  `;

  return generateOpenRouterResponse([], prompt);
};