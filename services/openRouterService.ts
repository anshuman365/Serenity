import { Message } from '../types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export const generateOpenRouterResponse = async (
  history: Message[],
  systemPrompt: string
): Promise<string> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API Key is missing.");
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
        model: "openai/gpt-3.5-turbo", // Default cheap/fast model, can be changed
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
      const errData = await response.json();
      throw new Error(errData.error?.message || "OpenRouter API Error");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw error;
  }
};