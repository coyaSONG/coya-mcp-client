interface Window {
  electron: {
    // MCP Server Management
    connectMcpStdio: (params: { id: string; serverPath: string; args?: string[] }) => Promise<any>;
    connectMcpHttp: (params: { id: string; serverUrl: string }) => Promise<any>;
    disconnectMcp: (params: { id: string }) => Promise<any>;
    listMcpTools: (params: { id: string }) => Promise<any>;
    callMcpTool: (params: { id: string; toolName: string; args: any }) => Promise<any>;
    listMcpResources: (params: { id: string }) => Promise<any>;
    
    // OpenRouter.ai API
    openrouterChat: (params: { apiKey: string; model: string; messages: any[]; tools?: any[] }) => Promise<any>;
    openrouterModels: (params: { apiKey: string }) => Promise<any>;
  };
}
