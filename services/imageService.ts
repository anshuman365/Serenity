const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

export const generateImageHF = async (prompt: string): Promise<Blob> => {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API Key is missing.");
  }

  // Using FLUX.1-dev as requested
  const modelId = "black-forest-labs/FLUX.1-dev"; 

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      throw new Error(`Image Generation Failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Hugging Face Image Error:", error);
    throw error;
  }
};