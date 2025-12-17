import { AppSettings } from '../types';

// Helper to safely access environment variables
const getEnv = (key: string): string => {
  // 1. Try standard process.env (User specific request for Render)
  // We check typeof process to avoid browser crashes if polyfills are missing
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) {
      return process.env[key] as string;
    }
  }

  // 2. Try Vite specific (import.meta.env)
  // This handles cases where the bundler exposes keys, even without VITE_ prefix if configured
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors if import.meta is not defined
  }

  return '';
};

const getSettingsKey = (keyName: keyof AppSettings): string => {
  try {
    const saved = localStorage.getItem('serenity_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[keyName] || '';
    }
  } catch (e) {
    // ignore
  }
  return '';
};

export const CONFIG = {
  get OPENROUTER_API() {
    // Checks OPENROUTER_API first, then OPENROUTER_API_KEY, then Manual Settings
    return getEnv('OPENROUTER_API') || getEnv('OPENROUTER_API_KEY') || getSettingsKey('keyOpenRouter');
  },
  get HUGGINGFACE_API_KEY() {
    return getEnv('HUGGINGFACE_API_KEY') || getSettingsKey('keyHuggingFace');
  },
  get GNEWS_API_KEY() {
    return getEnv('GNEWS_API_KEY') || getSettingsKey('keyGNews');
  }
};