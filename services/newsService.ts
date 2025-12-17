import { NewsArticle } from '../types';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';

export const fetchLatestNews = async (query: string = 'technology'): Promise<NewsArticle[]> => {
  if (!GNEWS_API_KEY) {
    // Fallback Mock Data if no key provided
    return [
      {
        title: "API Key Missing for News",
        description: "Please add GNEWS_API_KEY to your environment variables to fetch real news.",
        url: "#",
        image: "https://picsum.photos/400/300",
        source: "System",
        publishedAt: new Date().toISOString()
      }
    ];
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]);
    }

    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image || "https://picsum.photos/400/300",
      source: article.source.name,
      publishedAt: article.publishedAt
    }));
  } catch (error) {
    console.error("News Fetch Error:", error);
    return [];
  }
};