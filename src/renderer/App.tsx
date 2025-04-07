import React, { useState, useEffect } from 'react';
import { Settings } from '../shared/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';
import ChatInterface from './components/ChatInterface';
import ServerManager from './components/ServerManager';
import SettingsComponent from './components/Settings';

function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  
  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);
  
  // Save settings to localStorage
  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

  return (
    <div className={`flex h-screen ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <div className="w-64 h-full bg-gray-100 dark:bg-gray-800 border-r dark:border-gray-700">
        <ServerManager />
        <div className="absolute bottom-0 left-0 p-4 w-64">
          <SettingsComponent settings={settings} onSaveSettings={saveSettings} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface settings={settings} />
      </div>
    </div>
  );
}

export default App; 