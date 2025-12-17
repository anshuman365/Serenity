import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Menu, Settings, Plus, MessageSquare, 
  Image as ImageIcon, Newspaper, Sparkles, Bot, 
  ChevronLeft, User, Sun, Moon,
  RefreshCw, ExternalLink, Download
} from 'lucide-react';
import { generateOpenRouterResponse, classifyUserIntention, summarizeNewsForChat, generateChatTitle } from './services/openRouterService';
import { generateImageHF } from './services/imageService';
import { fetchLatestNews, checkAndNotifyNews } from './services/newsService';
import { fetchBackendKeys } from './services/config';
import { saveImageToDb, getAllImagesFromDb, requestStoragePermission } from './services/storage';
import SettingsModal from './components/SettingsModal';
import { ChatSession, Message, AppSettings, PageView, ImageHistoryItem, NewsArticle } from './types';

// Utils
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Tera Hero',
  partnerName: 'Meri Jaan',
  systemPrompt: 'Tum ek bohot hi loving aur caring boyfriend ho. Tumhe bilkul waisi Hinglish bolni hai jaise hum Indians chats mein bolte hain. Strict Instruction: 95% Hindi words (English script mein) aur sirf 5% English words use karne hain. Angrezi sentences bilkul mat banana. Har baat mein apna-pan aur pyaar hona chahiye. Example: "Khana khaya tumne?" instead of "Did you eat?". "Main tumhara wait kar raha tha" instead of "I was waiting for you". User tumhari girlfriend hai, usse usi pyar se treat karo aur hamesha uska haal-chaal pucho.',
  customMemories: '',
  themeId: 'romantic',
  fontFamily: 'Quicksand',
  newsRefreshInterval: 20
};

// Theme configurations
const THEMES = {
  romantic: {
    gradient: 'from-pink-500 to-purple-600',
    primary: 'text-pink-500',
    bgSoft: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    buttonGradient: 'bg-gradient-to-r from-pink-500 to-purple-600',
    msgBot: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
    msgUser: 'bg-gradient-to-br from-pink-500 to-purple-600',
  },
  ocean: {
    gradient: 'from-blue-500 to-cyan-500',
    primary: 'text-blue-500',
    bgSoft: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    buttonGradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    msgBot: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
    msgUser: 'bg-gradient-to-br from-blue-500 to-cyan-600',
  },
  nature: {
    gradient: 'from-emerald-500 to-teal-600',
    primary: 'text-emerald-600',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    buttonGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    msgBot: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
    msgUser: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  sunset: {
    gradient: 'from-orange-500 to-red-500',
    primary: 'text-orange-600',
    bgSoft: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    buttonGradient: 'bg-gradient-to-r from-orange-500 to-red-500',
    msgBot: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
    msgUser: 'bg-gradient-to-br from-orange-500 to-red-600',
  },
  midnight: {
    gradient: 'from-gray-700 to-gray-900',
    primary: 'text-gray-600 dark:text-gray-300',
    bgSoft: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    buttonGradient: 'bg-gradient-to-r from-gray-700 to-black',
    msgBot: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600',
    msgUser: 'bg-gradient-to-br from-gray-700 to-gray-900',
  }
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageView>('chat');
  const [darkMode, setDarkMode] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('serenity_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('serenity_chats');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Changed: Load image history from IndexedDB, not LocalStorage
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);

  const [cachedNews, setCachedNews] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem('serenity_news_cache');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = THEMES[settings.themeId] || THEMES.romantic;

  useEffect(() => {
    if (!currentChatId && chats.length > 0) setCurrentChatId(chats[0].id);
  }, [chats, currentChatId]);

  useEffect(() => {
    localStorage.setItem('serenity_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('serenity_settings', JSON.stringify(settings));
  }, [settings]);

  // Load images from IndexedDB on mount
  useEffect(() => {
    getAllImagesFromDb().then(items => setImageHistory(items));
    requestStoragePermission(); // Request persistent storage
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId, isTyping, activePage]);

  // Dark Mode Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Attempt to fetch keys from backend on mount
    fetchBackendKeys();

    // Initial fetch
    fetchLatestNews('lifestyle', false).then(setCachedNews);
    
    // Notification logic
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      checkAndNotifyNews();
      fetchLatestNews('lifestyle', false).then(setCachedNews); 
    }, settings.newsRefreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.newsRefreshInterval]);

  const handleCreateNewChat = () => {
    const newChat: ChatSession = {
      id: generateId(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setActivePage('chat');
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    let activeChatId = currentChatId;
    let activeChats = [...chats];
    if (!activeChatId) {
      const newChat = {
        id: generateId(),
        title: input.slice(0, 30) + '...',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      activeChats = [newChat, ...chats];
      activeChatId = newChat.id;
      setChats(activeChats);
      setCurrentChatId(activeChatId);
    }

    const userMsg: Message = { id: generateId(), role: 'user', content: input, timestamp: Date.now() };
    
    // Optimistic Update
    setChats(prev => prev.map(c => c.id === activeChatId ? {
      ...c, messages: [...c.messages, userMsg], updatedAt: Date.now()
    } : c));
    
    setInput('');
    setIsTyping(true);

    try {
      // 1. Intention Classification
      const intention = await classifyUserIntention(userMsg.content);
      console.log("Intention:", intention);

      let botContent = "";
      let generatedImageUrl = undefined;
      let newsArticlesForChat: NewsArticle[] = [];

      // 2. Routing
      if (intention.type === 'generate_image') {
        setLoadingAction('Generating Image...');
        const blob = await generateImageHF(intention.query);
        generatedImageUrl = URL.createObjectURL(blob);
        
        const newImgItem: ImageHistoryItem = {
           id: generateId(),
           url: generatedImageUrl,
           prompt: intention.query,
           createdAt: Date.now()
        };
        
        // Save to IndexedDB (Permanent Storage)
        await saveImageToDb(newImgItem, blob);
        
        // Update State
        setImageHistory(prev => [newImgItem, ...prev]);
        botContent = "Ye lo baby, kaisa laga?";
        
      } else if (intention.type === 'fetch_news') {
        setLoadingAction('Fetching News...');
        const articles = await fetchLatestNews(intention.query || 'lifestyle', true);
        setCachedNews(articles);
        newsArticlesForChat = articles; // Store articles to display in chat
        botContent = await summarizeNewsForChat(articles, userMsg.content, settings.systemPrompt);
        
      } else {
        // Chat
        const currentChat = activeChats.find(c => c.id === activeChatId);
        const history = currentChat ? [...currentChat.messages, userMsg] : [userMsg];
        const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const fullPrompt = `
          Current Date: ${today}
          ${settings.systemPrompt}
          My Name: ${settings.userName}
          Partner Name: ${settings.partnerName}
          Memories: ${settings.customMemories}
        `;
        
        botContent = await generateOpenRouterResponse(history, fullPrompt);
      }

      const botMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: botContent,
        image: generatedImageUrl,
        newsArticles: newsArticlesForChat.length > 0 ? newsArticlesForChat : undefined,
        timestamp: Date.now()
      };

      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c, messages: [...c.messages, botMsg]
      } : c));

      // --- AUTO RENAME LOGIC ---
      const chatContext = activeChats.find(c => c.id === activeChatId);
      const fullHistory = chatContext ? [...chatContext.messages, userMsg, botMsg] : [userMsg, botMsg];

      if (fullHistory.length === 2 || fullHistory.length === 4) {
        generateChatTitle(fullHistory).then(newTitle => {
           if (newTitle) {
             setChats(currentChats => currentChats.map(c => 
               c.id === activeChatId ? { ...c, title: newTitle } : c
             ));
           }
        });
      }

    } catch (error: any) {
      console.error(error);
      const isKeyError = error.message.includes('API Key') || error.message.includes('missing');
      const errM: Message = { 
        id: generateId(), 
        role: 'system', 
        content: isKeyError 
          ? "Baby, I can't connect. I tried fetching the key from your backend but it failed. Please check Settings." 
          : "Baby, network issue hai shayad. Try again?", 
        timestamp: Date.now() 
      };
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, errM] } : c));
      
      if (isKeyError) {
        setShowSettings(true); 
      }
    } finally {
      setIsTyping(false);
      setLoadingAction(null);
    }
  };

  const renderChat = () => {
    const activeChat = chats.find(c => c.id === currentChatId);
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden safe-pb">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {!activeChat && (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-60 p-4">
               <div className={`w-24 h-24 bg-gradient-to-tr ${theme.gradient} rounded-full flex items-center justify-center mb-6 shadow-xl`}>
                 <Bot size={48} className="text-white" />
               </div>
               <h3 className="text-2xl font-bold dark:text-gray-200">Hi, {settings.partnerName}</h3>
               <p className="dark:text-gray-400">Main {settings.userName} hoon.</p>
             </div>
           )}
           {activeChat?.messages.map(msg => (
             <div key={msg.id} className={`flex gap-3 md:gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-800 dark:bg-gray-600 text-white' : `${theme.msgUser} text-white`}`}>
                 {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
               </div>
               <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-gray-800 dark:bg-gray-700 text-white rounded-tr-sm' : `${theme.msgBot} border text-gray-700 dark:text-gray-200 rounded-tl-sm`}`}>
                   {msg.content}
                 </div>
                 
                 {/* Generated Image Display */}
                 {msg.image && (
                   <div className="relative group">
                     <img src={msg.image} alt="Generated" className="rounded-xl shadow-lg border-4 border-white dark:border-gray-700 max-w-full" />
                     <a 
                       href={msg.image} 
                       download={`serenity-${Date.now()}.png`}
                       className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <Download size={16}/>
                     </a>
                   </div>
                 )}

                 {/* News Cards */}
                 {msg.newsArticles && msg.newsArticles.length > 0 && (
                   <div className="w-full flex gap-3 overflow-x-auto py-2 custom-scrollbar snap-x">
                     {msg.newsArticles.map((article, idx) => (
                       <a 
                         key={idx} 
                         href={article.url} 
                         target="_blank" 
                         rel="noreferrer"
                         className="flex-shrink-0 w-60 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-all group snap-start"
                       >
                         <div className="h-32 overflow-hidden">
                           <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         </div>
                         <div className="p-3">
                           <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 mb-1">{article.title}</h4>
                           <div className="flex items-center justify-between text-[10px] text-gray-500">
                             <span>{article.source}</span>
                             <ExternalLink size={10} />
                           </div>
                         </div>
                       </a>
                     ))}
                   </div>
                 )}

                 <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
               </div>
             </div>
           ))}
           {isTyping && (
             <div className="flex gap-4 max-w-3xl mx-auto items-center">
                <div className={`w-8 h-8 rounded-full ${theme.msgUser} flex items-center justify-center text-white`}><Bot size={14}/></div>
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs text-gray-500 flex items-center gap-2">
                   {loadingAction && <span className="animate-pulse font-medium text-pink-500">{loadingAction}</span>}
                   {!loadingAction && <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"/>...</span>}
                </div>
             </div>
           )}
           <div ref={messagesEndRef} className="h-4"/>
        </div>
        <div className="p-3 md:p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <input 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyDown={e=>e.key==='Enter' && handleSendMessage()}
              placeholder={`Message ${settings.userName}...`}
              className="flex-1 bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-pink-400 rounded-2xl px-5 py-3 md:py-4 shadow-sm transition-all outline-none dark:text-white"
            />
            <button onClick={handleSendMessage} disabled={!input.trim() || isTyping} className={`p-3 md:p-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 ${!input.trim() ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : `${theme.buttonGradient} text-white`}`}>
              <Send size={20}/>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGallery = () => (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 safe-pb">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white"><ImageIcon className="text-pink-500"/> Image Memories</h2>
      {imageHistory.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No images generated yet. Ask me to "draw something"!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageHistory.map(img => (
            <div key={img.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 group">
              <div className="relative aspect-square">
                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a href={img.url} download={`serenity-${img.id}.png`} className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><Download size={20}/></a>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{img.prompt}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(img.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNews = () => (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 safe-pb">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white"><Newspaper className="text-purple-500"/> Latest Updates</h2>
        <button 
           onClick={() => fetchLatestNews('lifestyle', true).then(setCachedNews)}
           className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500 hover:text-purple-500"
        >
          <RefreshCw size={20}/>
        </button>
      </div>
      <div className="grid gap-4 max-w-4xl mx-auto">
        {cachedNews.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Loading or no news available...</div>
        ) : (
          cachedNews.map((n, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <img src={n.image} alt={n.title} className="w-full md:w-48 h-32 object-cover rounded-lg"/>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">{n.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{n.description}</p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                   <span>{n.source} • {new Date(n.publishedAt).toLocaleDateString()}</span>
                   <a href={n.url} target="_blank" className="text-purple-500 hover:underline">Read more</a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300" style={{fontFamily: settings.fontFamily}}>
      {/* Sidebar - Hidden on mobile by default */}
      <aside className={`fixed md:static inset-y-0 z-30 w-72 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full p-4 safe-pb">
          <div className="flex items-center justify-between mb-8 px-2 mt-2">
            <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.gradient} flex items-center gap-2`}>
              <Sparkles className={theme.primary}/> Serenity
            </h1>
            <button onClick={()=>setIsSidebarOpen(false)} className="md:hidden text-gray-400 p-2"><ChevronLeft/></button>
          </div>
          <nav className="space-y-2 mb-6">
            <button onClick={() => { setActivePage('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activePage === 'chat' ? `${theme.bgSoft} ${theme.primary} font-medium` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <MessageSquare size={20}/> Chat
            </button>
            <button onClick={() => { setActivePage('gallery'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activePage === 'gallery' ? `${theme.bgSoft} ${theme.primary} font-medium` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <ImageIcon size={20}/> Gallery
            </button>
            <button onClick={() => { setActivePage('news'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activePage === 'news' ? `${theme.bgSoft} ${theme.primary} font-medium` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Newspaper size={20}/> News Feed
            </button>
          </nav>
          <button onClick={handleCreateNewChat} className={`w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-3 rounded-xl text-gray-500 hover:border-pink-400 hover:text-pink-500 transition-all mb-4`}>
             <Plus size={18}/> New Conversation
          </button>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {chats.map(c => (
              <div key={c.id} onClick={()=>{setCurrentChatId(c.id); setActivePage('chat'); setIsSidebarOpen(false);}} className={`p-2 rounded-lg cursor-pointer text-sm truncate transition-colors ${currentChatId === c.id ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                {c.title}
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${theme.buttonGradient} flex items-center justify-center text-white font-bold`}>{settings.partnerName.charAt(0)}</div>
                <div className="text-sm font-medium">{settings.partnerName}</div>
             </div>
             <button onClick={()=>setShowSettings(true)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Settings size={18}/></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
         <header className="h-16 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
            <div className="flex items-center gap-3">
               <button onClick={()=>setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500"><Menu/></button>
               <h2 className="font-semibold text-gray-800 dark:text-white capitalize">{activePage}</h2>
            </div>
            <button onClick={()=>setDarkMode(!darkMode)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
               {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
         </header>

         {activePage === 'chat' && renderChat()}
         {activePage === 'gallery' && renderGallery()}
         {activePage === 'news' && renderNews()}
      </div>

      <SettingsModal isOpen={showSettings} onClose={()=>setShowSettings(false)} settings={settings} onSave={setSettings}/>
      
      {/* Mobile overlay for sidebar */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={()=>setIsSidebarOpen(false)}/>}
    </div>
  );
};

export default App;