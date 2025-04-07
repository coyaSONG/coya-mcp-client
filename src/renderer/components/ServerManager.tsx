import React, { useState } from 'react';
import { McpServer } from '../../shared/types';

interface ServerManagerProps {
  servers: McpServer[];
  activeServer: string | null;
  onAddServer: (server: Omit<McpServer, 'id' | 'connected' | 'tools' | 'resources'>) => void;
  onRemoveServer: (serverId: string) => void;
  onConnectServer: (serverId: string) => void;
  onDisconnectServer: (serverId: string) => void;
  isLoading: boolean;
}

export const ServerManager: React.FC<ServerManagerProps> = ({
  servers,
  activeServer,
  onAddServer,
  onRemoveServer,
  onConnectServer,
  onDisconnectServer,
  isLoading,
}) => {
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState<'stdio' | 'http'>('stdio');
  const [serverPath, setServerPath] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName) return;
    
    if (serverType === 'stdio' && !serverPath) return;
    if (serverType === 'http' && !serverUrl) return;
    
    onAddServer({
      name: serverName,
      type: serverType,
      path: serverType === 'stdio' ? serverPath : undefined,
      url: serverType === 'http' ? serverUrl : undefined,
    });
    
    // Reset form
    setServerName('');
    setServerPath('');
    setServerUrl('');
    setIsAddingServer(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">MCP Servers</h2>
        <button 
          onClick={() => setIsAddingServer(!isAddingServer)}
          className="p-1 rounded-full bg-blue-500 text-white"
          title={isAddingServer ? "Cancel" : "Add Server"}
        >
          {isAddingServer ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      {isAddingServer && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Server Name</label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              placeholder="My MCP Server"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Server Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="stdio"
                  checked={serverType === 'stdio'}
                  onChange={() => setServerType('stdio')}
                  className="mr-1"
                />
                <span>Local (stdio)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="http"
                  checked={serverType === 'http'}
                  onChange={() => setServerType('http')}
                  className="mr-1"
                />
                <span>Remote (HTTP)</span>
              </label>
            </div>
          </div>
          
          {serverType === 'stdio' ? (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Server Path</label>
              <input
                type="text"
                value={serverPath}
                onChange={(e) => setServerPath(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="/path/to/server.js"
                required
              />
            </div>
          ) : (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Server URL</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="http://localhost:3001"
                required
              />
            </div>
          )}
          
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                Adding...
              </span>
            ) : (
              'Add Server'
            )}
          </button>
        </form>
      )}
      
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {servers.map(server => (
          <li 
            key={server.id}
            className={`p-3 rounded border ${
              activeServer === server.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{server.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {server.type === 'stdio' ? (
                    <span title={server.path}>Local: {server.path}</span>
                  ) : (
                    <span title={server.url}>Remote: {server.url}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {server.connected ? (
                  <button
                    onClick={() => onDisconnectServer(server.id)}
                    className="p-1 text-red-500 hover:text-red-600"
                    title="Disconnect"
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => onConnectServer(server.id)}
                    className="p-1 text-green-500 hover:text-green-600"
                    title="Connect"
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => onRemoveServer(server.id)}
                  className="p-1 text-gray-500 hover:text-red-500"
                  title="Remove"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            {server.connected && server.tools && server.tools.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Available Tools:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {server.tools.map(tool => (
                    <span 
                      key={tool.name}
                      className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded"
                      title={tool.description}
                    >
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
        {servers.length === 0 && !isAddingServer && (
          <li className="text-center p-4 text-gray-500 dark:text-gray-400">
            No servers added yet. Click the + button to add a server.
          </li>
        )}
      </ul>
    </div>
  );
};
