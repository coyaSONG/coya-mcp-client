import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface.js';
import { ServerManager } from './components/ServerManager.js';
import { ModelSelector } from './components/ModelSelector.js';
import { Settings } from './components/Settings.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../shared/constants';
import { McpServer, Settings as SettingsType, OpenRouterModel, ChatConversation } from '../shared/types';

const App: React.FC = () => {
  // State for servers, settings, and UI
  const [servers, setServers] = useState<McpServer[]>([]);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS as SettingsType);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    // Load settings
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Load servers
    const savedServers = localStorage.getItem(STORAGE_KEYS.SERVERS);
    if (savedServers) {
      setServers(JSON.parse(savedServers));
    }

    // Load conversations
    const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
      
      // Set active conversation to the most recent one if any exist
      const parsedConversations = JSON.parse(savedConversations);
      if (parsedConversations.length > 0) {
        setActiveConversation(parsedConversations[0].id);
      }
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations]);

  // Fetch available models from OpenRouter.ai when API key changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!settings.openrouterApiKey) return;
      
      setIsLoading(true);
      try {
        const response = await window.electron.openrouterModels({ 
          apiKey: settings.openrouterApiKey 
        });
        
        if (response.success) {
          setAvailableModels(response.models);
        } else {
          console.error('Failed to fetch models:', response.error);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [settings.openrouterApiKey]);

  // Handle adding a new server
  const handleAddServer = (server: Omit<McpServer, 'id' | 'connected' | 'tools' | 'resources'>) => {
    const newServer: McpServer = {
      ...server,
      id: `server-${Date.now()}`,
      connected: false,
      tools: [],
      resources: [],
    };
    
    setServers([...servers, newServer]);
  };

  // Handle removing a server
  const handleRemoveServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server && server.connected) {
      await window.electron.disconnectMcp({ id: serverId });
    }
    
    setServers(servers.filter(s => s.id !== serverId));
    
    // If the active server is removed, set active server to null
    if (activeServer === serverId) {
      setActiveServer(null);
    }
    
    // Remove conversations associated with this server
    setConversations(conversations.filter(c => c.serverId !== serverId));
  };

  // Handle connecting to a server
  const handleConnectServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    setIsLoading(true);
    try {
      let response;
      
      if (server.type === 'stdio') {
        response = await (window as any).electron.connectMcpStdio({ 
          id: serverId, 
          serverPath: server.path || '' 
        });
      } else {
        response = await (window as any).electron.connectMcpHttp({ 
          id: serverId, 
          serverUrl: server.url || '' 
        });
      }
      
      if (response.success) {
        // Update server with tools
        const updatedServers = servers.map(s => 
          s.id === serverId 
            ? { ...s, connected: true, tools: response.tools } 
            : s
        );
        setServers(updatedServers);
        setActiveServer(serverId);
        
        // Create a new conversation for this server if none exists
        if (!conversations.some(c => c.serverId === serverId)) {
          const newConversation: ChatConversation = {
            id: `conversation-${Date.now()}`,
            title: `Conversation with ${server.name}`,
            messages: [],
            serverId,
          };
          setConversations([newConversation, ...conversations]);
          setActiveConversation(newConversation.id);
        } else {
          // Set active conversation to the first one associated with this server
          const serverConversation = conversations.find(c => c.serverId === serverId);
          if (serverConversation) {
            setActiveConversation(serverConversation.id);
          }
        }
      } else {
        console.error('Failed to connect to server:', response.error);
      }
    } catch (error) {
      console.error('Error connecting to server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnecting from a server
  const handleDisconnectServer = async (serverId: string) => {
    setIsLoading(true);
    try {
      const response = await window.electron.disconnectMcp({ id: serverId });
      
      if (response.success) {
        const updatedServers = servers.map(s => 
          s.id === serverId 
            ? { ...s, connected: false } 
            : s
        );
        setServers(updatedServers);
        
        // If the active server is disconnected, set active server to null
        if (activeServer === serverId) {
          setActiveServer(null);
        }
      } else {
        console.error('Failed to disconnect from server:', response.error);
      }
    } catch (error) {
      console.error('Error disconnecting from server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating a new conversation
  const handleNewConversation = (serverId?: string) => {
    const newConversation: ChatConversation = {
      id: `conversation-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      serverId,
    };
    
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
  };

  // Handle updating a conversation
  const handleUpdateConversation = (conversationId: string, updatedConversation: Partial<ChatConversation>) => {
    const updatedConversations = conversations.map(c => 
      c.id === conversationId 
        ? { ...c, ...updatedConversation } 
        : c
    );
    setConversations(updatedConversations);
  };

  // Handle removing a conversation
  const handleRemoveConversation = (conversationId: string) => {
    setConversations(conversations.filter(c => c.id !== conversationId));
    
    // If the active conversation is removed, set active conversation to the first one
    if (activeConversation === conversationId) {
      if (conversations.length > 1) {
        const remainingConversations = conversations.filter(c => c.id !== conversationId);
        setActiveConversation(remainingConversations[0].id);
      } else {
        setActiveConversation(null);
      }
    }
  };

  // Handle updating settings
  const handleUpdateSettings = (updatedSettings: Partial<SettingsType>) => {
    setSettings({ ...settings, ...updatedSettings });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Server management */}
        <ServerManager 
          servers={servers}
          activeServer={activeServer}
          onAddServer={handleAddServer}
          onRemoveServer={handleRemoveServer}
          onConnectServer={handleConnectServer}
          onDisconnectServer={handleDisconnectServer}
          isLoading={isLoading}
        />
        
        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button 
              onClick={() => handleNewConversation(activeServer || undefined)}
              className="p-1 rounded-full bg-blue-500 text-white"
              title="New Conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <ul className="space-y-2">
            {conversations.map(conversation => (
              <li 
                key={conversation.id}
                className={`p-2 rounded cursor-pointer ${
                  activeConversation === conversation.id 
                    ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveConversation(conversation.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate">{conversation.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveConversation(conversation.id);
                    }}
                    className="p-1 rounded-full text-gray-500 hover:text-red-500"
                    title="Remove Conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {conversation.serverId && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {servers.find(s => s.id === conversation.serverId)?.name || 'Unknown Server'}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Settings button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Model selector */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <ModelSelector 
            models={availableModels}
            selectedModel={settings.defaultModel}
            onSelectModel={(modelId: string) => handleUpdateSettings({ defaultModel: modelId })}
            isLoading={isLoading}
          />
        </div>
        
        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          {activeConversation ? (
            <ChatInterface 
              conversation={conversations.find(c => c.id === activeConversation)!}
              server={activeServer ? servers.find(s => s.id === activeServer) : undefined}
              model={settings.defaultModel}
              apiKey={settings.openrouterApiKey}
              onUpdateConversation={(updatedConversation: Partial<ChatConversation>) => 
                handleUpdateConversation(activeConversation, updatedConversation)
              }
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">No conversation selected</h2>
                <button 
                  onClick={() => handleNewConversation(activeServer || undefined)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Start a new conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings modal */}
      {isSettingsOpen && (
        <Settings 
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
