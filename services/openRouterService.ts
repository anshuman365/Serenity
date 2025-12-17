import { Message } from '../types';

// Support the specific variable name requested by the user, with fallback to the standard one
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.OPENROUTER_API || process.env.OPENROUTER_API_KEY || '';
  }
  return '';
};

const OPENROUTER_API_KEY = getApiKey();

export const generateOpenRouterResponse = async (
  history: Message[],
  systemPrompt: string
): Promise<string> => {
  if (!OPENROUTER_API_KEY) {
    console.error("OpenRouter API key is missing. Checked OPENROUTER_API and OPENROUTER_API_KEY.");
    throw new Error("OpenRouter API Key is missing. Please check your .env file.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required by OpenRouter
        "X-Title": "Serenity Personal AI", // Optional
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // Cost-effective default
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
      const errData = await response.json().catch(() => ({}));
      console.error("OpenRouter API returned error:", response.status, errData);
      throw new Error(errData.error?.message || `OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter Request Failed:", error);
    throw error;
  }
};