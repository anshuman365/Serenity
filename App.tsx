import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Menu, 
  Settings, 
  Plus, 
  MessageSquare, 
  Image as ImageIcon,
  Newspaper, 
  Sparkles, 
  Bot,
  Trash2,
  ChevronLeft,
  User
} from 'lucide-react';
import { generateOpenRouterResponse } from './services/openRouterService';
import { generateGeminiResponse } from './services/geminiService';
import SettingsModal from './components/SettingsModal';
import ImageGenModal from './components/ImageGenModal';
import NewsWidget from './components/NewsWidget';
import { ChatSession, Message, AppSettings } from './types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Tera Hero',
  partnerName: 'Meri Jaan',
  systemPrompt: 'You are a loving, romantic, and caring boyfriend. You speak strictly in Hinglish (a mix of Hindi and English). Your tone is casual, flirtatious, and deeply affectionate. Treat the user as your girlfriend. Always ask about her well-being, use endearments like "Baby", "Shona", "Jaan", "Babu". Example responses: "Kaisi ho baby?", "Khana khaya tumne?", "Aaj ka din kaisa tha?", "Main tumhara hi wait kar raha tha". Be witty, supportive, and act exactly like a real boyfriend would.',
  customMemories: '',
  themeId: 'romantic',
  fontFamily: 'Quicksand'
};

// Theme configurations
const THEMES = {
  romantic: {
    gradient: 'from-pink-500 to-purple-600',
    primary: 'text-pink-500',
    bgSoft: 'bg-pink-50',
    border: 'border-pink-200',
    ring: 'focus:ring-pink-400',
    iconFill: 'fill-pink-100',
    buttonGradient: 'bg-gradient-to-r from-pink-500 to-purple-600',
    msgUser: 'bg-gradient-to-br from-pink-500 to-purple-600'
  },
  ocean: {
    gradient: 'from-blue-500 to-cyan-500',
    primary: 'text-blue-500',
    bgSoft: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'focus:ring-blue-400',
    iconFill: 'fill-blue-100',
    buttonGradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    msgUser: 'bg-gradient-to-br from-blue-500 to-cyan-600'
  },
  nature: {
    gradient: 'from-emerald-500 to-teal-600',
    primary: 'text-emerald-600',
    bgSoft: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'focus:ring-emerald-400',
    iconFill: 'fill-emerald-100',
    buttonGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    msgUser: 'bg-gradient-to-br from-emerald-500 to-teal-600'
  },
  sunset: {
    gradient: 'from-orange-500 to-red-500',
    primary: 'text-orange-600',
    bgSoft: 'bg-orange-50',
    border: 'border-orange-200',
    ring: 'focus:ring-orange-400',
    iconFill: 'fill-orange-100',
    buttonGradient: 'bg-gradient-to-r from-orange-500 to-red-500',
    msgUser: 'bg-gradient-to-br from-orange-500 to-red-600'
  },
  midnight: {
    gradient: 'from-gray-700 to-gray-900',
    primary: 'text-gray-800',
    bgSoft: 'bg-gray-100',
    border: 'border-gray-300',
    ring: 'focus:ring-gray-500',
    iconFill: 'fill-gray-200',
    buttonGradient: 'bg-gradient-to-r from-gray-700 to-black',
    msgUser: 'bg-gradient-to-br from-gray-700 to-gray-900'
  }
};

const App: React.FC = () => {
  // --- State ---
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('serenity_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('serenity_settings');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
      // Merge with default to ensure new fields (like themeId) exist if loading old config
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) { return DEFAULT_SETTINGS; }
  });

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showNews, setShowNews] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Helper to get current theme
  const theme = THEMES[settings.themeId] || THEMES.romantic;

  // --- Effects ---

  // Initialize selection
  useEffect(() => {
    if (!currentChatId && chats.length > 0) {
      setCurrentChatId(chats[0].id);
    }
  }, [chats, currentChatId]);

  // Persist chats
  useEffect(() => {
    localStorage.setItem('serenity_chats', JSON.stringify(chats));
  }, [chats]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('serenity_settings', JSON.stringify(settings));
  }, [settings]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId, isTyping]);

  // Click outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // --- Handlers ---

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
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filteredChats = chats.filter(c => c.id !== id);
    setChats(filteredChats);
    if (currentChatId === id) {
      setCurrentChatId(filteredChats.length > 0 ? filteredChats[0].id : null);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let activeChatId = currentChatId;
    let activeChats = [...chats];

    if (!activeChatId) {
      const newChat: ChatSession = {
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

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    const updatedChatsWithUser = activeChats.map(chat => {
      if (chat.id === activeChatId) {
        const title = chat.messages.length === 0 ? input.slice(0, 30) : chat.title;
        return {
          ...chat,
          title,
          messages: [...chat.messages, userMsg],
          updatedAt: Date.now()
        };
      }
      return chat;
    });

    setChats(updatedChatsWithUser);
    setInput('');
    setIsTyping(true);

    try {
      const currentSession = updatedChatsWithUser.find(c => c.id === activeChatId);
      const history = currentSession ? currentSession.messages : [];

      // Construct system prompt with personalization and custom memories
      const fullSystemPrompt = `
${settings.systemPrompt}

IMPORTANT CONTEXT:
- Your Name: ${settings.userName}
- Partner's Name: ${settings.partnerName}

KEY MEMORIES & FACTS (Must Remember):
${settings.customMemories || "No specific memories added yet."}
      `.trim();

      let responseText = "";
      
      try {
        responseText = await generateOpenRouterResponse(history, fullSystemPrompt);
      } catch (err) {
        console.warn("OpenRouter failed, attempting fallback...", err);
        responseText = await generateGeminiResponse(history, fullSystemPrompt);
      }

      const botMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, botMsg],
            updatedAt: Date.now()
          };
        }
        return chat;
      }));

    } catch (error) {
      console.error("All AI services failed", error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'system',
        content: "Baby, thoda network issue ho raha hai. Main abhi connect nahi kar pa raha.",
        timestamp: Date.now()
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, errorMsg] };
        }
        return chat;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageAction = (imageUrl: string) => {
    if (!currentChatId) handleCreateNewChat();
    setTimeout(() => {
      setChats(prev => {
        const targetId = currentChatId || prev[0].id;
        return prev.map(chat => {
          if (chat.id === targetId) {
            const imgMsg: Message = {
              id: generateId(),
              role: 'assistant',
              content: "Ye lo baby, tumhare liye banaya:",
              image: imageUrl,
              timestamp: Date.now()
            };
            return {
              ...chat,
              messages: [...chat.messages, imgMsg],
              updatedAt: Date.now()
            };
          }
          return chat;
        });
      });
    }, 100);
  };

  const activeChat = chats.find(c => c.id === currentChatId);

  return (
    <div 
      className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 relative transition-colors duration-500"
      style={{ fontFamily: settings.fontFamily }}
    >
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-72 bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 px-2">
            <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.gradient} flex items-center gap-2`}>
              <Sparkles className={`${theme.primary} ${theme.iconFill}`} />
              Serenity
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-gray-400"
            >
              <ChevronLeft />
            </button>
          </div>

          <button
            onClick={handleCreateNewChat}
            className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-200 ${theme.bgSoft} hover:border-gray-300 text-gray-700 font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md mb-6 group`}
          >
            <Plus size={20} className={`${theme.primary} group-hover:scale-110 transition-transform`} />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${currentChatId === chat.id 
                    ? `${theme.bgSoft} border ${theme.border}` 
                    : 'hover:bg-gray-100 border border-transparent'}
                `}
              >
                <MessageSquare 
                  size={18} 
                  className={currentChatId === chat.id ? theme.primary : 'text-gray-400'} 
                />
                <div className="flex-1 overflow-hidden">
                  <h3 className={`text-sm font-medium truncate ${currentChatId === chat.id ? 'text-gray-800' : 'text-gray-600'}`}>
                    {chat.title || 'Untitled Chat'}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {chats.length === 0 && (
              <div className="text-center text-gray-400 mt-10 text-sm px-4">
                <p>No memories yet.</p>
                <p>Start a new conversation!</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${theme.buttonGradient} flex items-center justify-center text-white text-xs font-bold`}>
                {settings.partnerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{settings.partnerName}</span>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-b from-transparent to-white/50">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/50 bg-white/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-white/50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-semibold text-gray-800">
                {activeChat?.title || 'Welcome'}
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                with <span className={`${theme.primary} font-medium`}>{settings.userName}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowImageGen(true)}
              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Generate Image"
            >
              <ImageIcon size={20} />
            </button>
            <button 
              onClick={() => setShowNews(true)}
              className="p-2 text-purple-500 hover:bg-purple-50 rounded-xl transition-colors relative"
              title="Latest News"
            >
              <Newspaper size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {!activeChat && chats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
              <div className={`w-24 h-24 bg-gradient-to-tr ${theme.gradient} rounded-full flex items-center justify-center mb-6 animate-pulse opacity-50`}>
                <Bot size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">Hello, {settings.partnerName}</h3>
              <p className="text-gray-500 max-w-md">
                Main {settings.userName} hoon. Batao baby, kaise ho aaj?
              </p>
            </div>
          ) : (
            activeChat?.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm
                  ${msg.role === 'user' ? 'bg-gray-800 text-white' : `${theme.msgUser} text-white`}
                `}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                
                <div className={`
                  flex flex-col gap-2 max-w-[80%] md:max-w-[70%]
                  ${msg.role === 'user' ? 'items-end' : 'items-start'}
                `}>
                  <div className={`
                    px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-gray-800 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}
                  `}>
                    {msg.content}
                  </div>
                  
                  {msg.image && (
                    <div className="mt-2 rounded-xl overflow-hidden shadow-lg border-4 border-white">
                      <img src={msg.image} alt="Generated content" className="w-full h-auto" />
                    </div>
                  )}
                  
                  <span className="text-[10px] text-gray-400 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
             <div className="flex gap-4 max-w-3xl mx-auto">
                <div className={`w-8 h-8 rounded-full ${theme.msgUser} flex-shrink-0 flex items-center justify-center text-white shadow-sm`}>
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme.bgSoft.replace('bg-', 'bg-').replace('-50', '-400')}`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme.bgSoft.replace('bg-', 'bg-').replace('-50', '-500')}`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme.bgSoft.replace('bg-', 'bg-').replace('-50', '-600')}`} style={{ animationDelay: '300ms' }} />
                </div>
             </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/50">
          <div className="max-w-3xl mx-auto relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Message ${settings.userName}...`}
              className={`flex-1 bg-white border-0 ring-1 ring-gray-200 hover:ring-gray-300 focus:ring-2 ${theme.ring} rounded-2xl px-5 py-4 shadow-sm transition-all focus:outline-none placeholder:text-gray-400`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              className={`
                p-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95
                ${!input.trim() || isTyping 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : `${theme.buttonGradient} text-white`}
              `}
            >
              <Send size={20} className={isTyping ? 'opacity-0' : 'opacity-100'} />
            </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400">
               AI can make mistakes. Please verify important information.
             </p>
          </div>
        </div>

        {/* Modals & Widgets */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          settings={settings}
          onSave={setSettings}
        />

        <ImageGenModal
          isOpen={showImageGen}
          onClose={() => setShowImageGen(false)}
          onImageGenerated={handleImageAction}
        />

        <NewsWidget
          isOpen={showNews}
          onClose={() => setShowNews(false)}
        />
      </main>
    </div>
  );
};

export default App;