// Helper to safely access environment variables in different build environments (Vite, CRA, etc.)

export const getEnv = (key: string): string => {
  // 1. Try standard process.env (Create React App / Node)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // 2. Try Vite specific import.meta.env
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env[key]) return import.meta.env[key];
    // @ts-ignore
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  }

  // 3. Fallback for manual matching if the bundler didn't replace the variable
  return '';
};

export const CONFIG = {
  OPENROUTER_API: getEnv('OPENROUTER_API') || getEnv('OPENROUTER_API_KEY'),
  HUGGINGFACE_API_KEY: getEnv('HUGGINGFACE_API_KEY'),
  GNEWS_API_KEY: getEnv('GNEWS_API_KEY'),
};