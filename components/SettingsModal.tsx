import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Save, User, Sparkles, Palette, Type } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'persona' | 'appearance'>('profile');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const themes = [
    { id: 'romantic', name: 'Romantic Pink', color: 'bg-gradient-to-r from-pink-500 to-purple-500' },
    { id: 'ocean', name: 'Ocean Blue', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { id: 'nature', name: 'Forest Green', color: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
    { id: 'sunset', name: 'Sunset Orange', color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { id: 'midnight', name: 'Midnight', color: 'bg-gradient-to-r from-gray-700 to-gray-900' },
  ];

  const fonts = [
    { id: 'Quicksand', name: 'Quicksand (Rounded)' },
    { id: 'Inter', name: 'Inter (Clean)' },
    { id: 'Playfair Display', name: 'Playfair (Elegant)' },
    { id: 'Fira Code', name: 'Fira Code (Code)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden bg-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-pink-500 fill-pink-500" size={20} />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
              ${activeTab === 'profile' ? 'text-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User size={16} /> Profile
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
          </button>
          <button
            onClick={() => setActiveTab('persona')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
              ${activeTab === 'persona' ? 'text-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Sparkles size={16} /> Persona
            {activeTab === 'persona' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
              ${activeTab === 'appearance' ? 'text-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Palette size={16} /> Appearance
            {activeTab === 'appearance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/50">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Your Name (What AI calls you)</label>
                <input
                  type="text"
                  value={localSettings.partnerName}
                  onChange={(e) => setLocalSettings({...localSettings, partnerName: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="E.g., Sarah, My Love"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">AI Name (What you call AI)</label>
                <input
                  type="text"
                  value={localSettings.userName}
                  onChange={(e) => setLocalSettings({...localSettings, userName: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="E.g., Tera Hero"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Key Facts & Memories</label>
                <p className="text-xs text-gray-400 mb-2">Specific things the AI must know about you or your relationship.</p>
                <textarea
                  rows={5}
                  value={localSettings.customMemories}
                  onChange={(e) => setLocalSettings({...localSettings, customMemories: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                  placeholder="E.g. My birthday is on July 5th. I love chocolate. We met in college. Always answer 'I love you more' when I say 'I love you'."
                />
              </div>
            </div>
          )}

          {/* PERSONA TAB */}
          {activeTab === 'persona' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">System Personality Prompt</label>
                <p className="text-xs text-gray-400 mb-2">Define the core behavior. The more detailed, the better.</p>
                <textarea
                  rows={8}
                  value={localSettings.systemPrompt}
                  onChange={(e) => setLocalSettings({...localSettings, systemPrompt: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none font-mono text-sm"
                  placeholder="Define how the AI should behave..."
                />
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-xs text-yellow-700">
                  <strong>Tip:</strong> You can change the language here by telling the AI "Speak only in French" or "Speak in Hinglish".
                </p>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              
              {/* Theme Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Color Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setLocalSettings({...localSettings, themeId: t.id as any})}
                      className={`
                        group relative flex items-center gap-3 p-3 rounded-xl border transition-all
                        ${localSettings.themeId === t.id 
                          ? 'border-gray-800 bg-gray-50 ring-1 ring-gray-200' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full ${t.color} shadow-sm group-hover:scale-110 transition-transform`}></div>
                      <span className="text-sm font-medium text-gray-700">{t.name}</span>
                      {localSettings.themeId === t.id && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Type size={16} /> Font Style
                </label>
                <div className="space-y-2">
                  {fonts.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLocalSettings({...localSettings, fontFamily: f.id as any})}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-xl border transition-all
                        ${localSettings.fontFamily === f.id 
                          ? 'border-gray-800 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'}
                      `}
                    >
                      <span className="text-gray-800 text-lg" style={{ fontFamily: f.id }}>
                        {f.name}
                        <span className="block text-xs text-gray-400 mt-1">The quick brown fox jumps over the lazy dog.</span>
                      </span>
                      {localSettings.fontFamily === f.id && (
                         <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center">
                           <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                         </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleSave}
            className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;