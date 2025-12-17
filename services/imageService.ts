import { CONFIG } from './config';

export const generateImageHF = async (prompt: string): Promise<Blob> => {
  if (!CONFIG.HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API Key is missing.");
  }

  const modelId = "black-forest-labs/FLUX.1-dev"; 

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        headers: {
          Authorization: `Bearer ${CONFIG.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      throw new Error(`Image Generation Failed: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Hugging Face Image Error:", error);
    throw error;
  }
};