import { Message, IntentionResponse, NewsArticle } from '../types';
import { CONFIG, fetchBackendKeys } from './config';

const getHeaders = () => ({
  "Authorization": `Bearer ${CONFIG.OPENROUTER_API}`,
  "Content-Type": "application/json",
  "HTTP-Referer": window.location.origin,
  "X-Title": "Serenity Personal AI",
});

// Creator Profile - Compressed to save tokens while keeping key details
const CREATOR_PROFILE = `
[SYSTEM_DATA: CREATOR_PROFILE]
Name: Anshuman Singh
Identity: Aspiring Physicist (Theoretical & Research) & Tech Innovator.
Tech Stack: Expert in Python, SQL, Flask (Backend), APIs, Auth systems, & AI Integration (Image Gen, LLMs).
Mindset: Logic-oriented, self-driven, practical. Blends theoretical science with real-world business (e.g., Industrial Bio-Energy models).
Personality: Values knowledge over show-off. Direct, clarity-based communication.
Role here: He is the creator/developer of this "Serenity AI" app.
Instruction: Agar koi Anshuman (creator) ke baare mein puche, toh ye info use karna, lekin baat STRICT HINGLISH mein hi karna.
`;

// 1. Classify User Intention
export const classifyUserIntention = async (userInput: string): Promise<IntentionResponse> => {
  // If key is missing, try fetching from backend first
  if (!CONFIG.OPENROUTER_API) {
    await fetchBackendKeys();
  }

  // Fail fast if still no key
  if (!CONFIG.OPENROUTER_API) {
    console.error("OpenRouter Key is missing in config");
    return { type: 'chat', query: userInput }; 
  }

  const systemInstruction = `
    You are an intention classifier. Analyze the input and return a JSON object.
    
    Categories:
    1. 'generate_image': User wants to create/draw/see an image.
    2. 'fetch_news': User asks for news, headlines, updates, current events.
    3. 'chat': Normal conversation, advice, roleplay, or questions about the creator (Anshuman).

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
        model: "openai/gpt-3.5-turbo", 
        max_tokens: 30, // Limit tokens to save credits and fix errors
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
    
    try {
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
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
    await fetchBackendKeys();
  }
  
  if (!CONFIG.OPENROUTER_API) {
    throw new Error("API Key missing. I tried fetching it from the backend but failed. Please add it in Settings.");
  }

  // Use a capable but fast model
  const MODEL = "google/gemini-2.0-flash-001"; 

  // Merge the User's Persona settings with the Creator's Truth
  const finalSystemPrompt = `
    ${systemPrompt}
    
    ${CREATOR_PROFILE}
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL, 
        max_tokens: 1000, // CRITICAL FIX: Limit output tokens to fit within credit limits
        messages: [
          { role: "system", content: finalSystemPrompt },
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
    return data.choices?.[0]?.message?.content || "Hmm, mujhe samajh nahi aaya.";
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw error;
  }
};

// 3. Summarize News
export const summarizeNewsForChat = async (news: NewsArticle[], originalQuery: string, systemPersona: string): Promise<string> => {
  if (!news.length) return "Jaan, maine bohot dhunda par mujhe koi news nahi mili is baare mein.";

  // Prepare a richer context with descriptions
  const newsContext = news.slice(0, 5).map(n => `
    Title: ${n.title}
    Source: ${n.source}
    Snippet: ${n.description}
    Date: ${n.publishedAt}
  `).join('\n---\n');
  
  const prompt = `
    Current Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    ${systemPersona}
    
    CONTEXT:
    The user asked about: "${originalQuery}".
    I have performed a Google News search and found the following articles:
    
    ${newsContext}

    TASK:
    Read the snippets above and provide a concise, engaging summary for the user. 
    Maintain your strict boyfriend persona (PURE HINGLISH - 95% Hindi, 5% English). 
    News agar serious hai toh supportive banna, agar light hai toh masti karna.
    Sirf list mat dena, ek conversation ki tarah batana.
    Dates ka dhyan rakhna.
  `;

  return generateOpenRouterResponse([], prompt);
};

// 4. Generate Chat Title
export const generateChatTitle = async (history: Message[]): Promise<string> => {
  if (!CONFIG.OPENROUTER_API) return "";

  // Take the first few messages to establish context
  const contextMessages = history.slice(0, 4).map(m => `${m.role}: ${m.content}`).join('\n');
  
  const systemInstruction = `
    Analyze the following conversation snippet and create a very short, creative title (max 4 words).
    It should capture the essence of the user's intent.
    Examples: "Quantum Physics Basics", "Romantic Poem", "News about Tesla", "Image of a Cat".
    Do NOT use quotation marks.
    Do NOT use "Title:" prefix.
    Return ONLY the title text.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", 
        max_tokens: 15,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: contextMessages }
        ]
      })
    });

    if (!response.ok) return "";
    
    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim();
    if (title) {
        title = title.replace(/^["']|["']$/g, ''); // remove quotes
        return title;
    }
    return "";
  } catch (error) {
    console.warn("Title generation failed", error);
    return "";
  }
};