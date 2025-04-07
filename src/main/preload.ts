// Preload script
// This script runs in the renderer process before the web page is loaded
// It can expose Node.js APIs to the renderer process

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    // MCP Server Management
    connectMcpStdio: (params: unknown) => ipcRenderer.invoke('connect-mcp-stdio', params),
    connectMcpHttp: (params: unknown) => ipcRenderer.invoke('connect-mcp-http', params),
    disconnectMcp: (params: unknown) => ipcRenderer.invoke('disconnect-mcp', params),
    listMcpTools: (params: unknown) => ipcRenderer.invoke('list-mcp-tools', params),
    callMcpTool: (params: unknown) => ipcRenderer.invoke('call-mcp-tool', params),
    listMcpResources: (params: unknown) => ipcRenderer.invoke('list-mcp-resources', params),
    
    // OpenRouter.ai API
    openrouterChat: (params: unknown) => ipcRenderer.invoke('openrouter-chat', params),
    openrouterModels: (params: unknown) => ipcRenderer.invoke('openrouter-models', params),
  }
); 