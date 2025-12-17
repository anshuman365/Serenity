import { NewsArticle } from '../types';
import { CONFIG } from './config';

const CACHE_KEY = 'serenity_news_cache';
const CACHE_TIME_KEY = 'serenity_news_timestamp';

export const fetchLatestNews = async (query: string = 'technology', forceRefresh = false): Promise<NewsArticle[]> => {
  
  // 1. Check Cache
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();
  const REFRESH_RATE = 20 * 60 * 1000; // 20 minutes in ms

  if (!forceRefresh && cachedData && cachedTime) {
    const age = now - parseInt(cachedTime);
    if (age < REFRESH_RATE) {
      // Return cached if valid
      return JSON.parse(cachedData);
    }
  }

  // 2. Fetch Fresh
  if (!CONFIG.GNEWS_API_KEY) {
    console.warn("News API Key missing");
    return [];
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=8&apikey=${CONFIG.GNEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.errors) throw new Error(data.errors[0]);

    const articles: NewsArticle[] = data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image || "https://picsum.photos/400/300",
      source: article.source.name,
      publishedAt: article.publishedAt
    }));

    // 3. Update Cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());

    return articles;
  } catch (error) {
    console.error("News Fetch Error:", error);
    return cachedData ? JSON.parse(cachedData) : [];
  }
};

export const checkAndNotifyNews = async () => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    // Check if we need to fetch
    const articles = await fetchLatestNews('top headlines', false);
    // Simple logic: If we have articles and it's a fresh fetch interval (handled by fetchLatestNews logic),
    // we could send a notification. 
    // Here we just simulate a check. In a real PWA, you'd compare ID/hashes.
    
    // For demo: randomly notify if plenty of news exists
    if (articles.length > 0 && Math.random() > 0.8) {
       new Notification("Serenity Updates", {
         body: `Latest news: ${articles[0].title}`,
         icon: '/favicon.ico'
       });
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
};