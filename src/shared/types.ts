// MCP Server types
export interface McpServer {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  path?: string;
  url?: string;
  connected: boolean;
  tools?: McpTool[];
  resources?: McpResource[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpResource {
  name: string;
  uri: string;
  description?: string;
}

// OpenRouter.ai types
export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  provider: {
    name: string;
    label: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// UI types
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  serverId?: string;
}

export interface Settings {
  openrouterApiKey: string;
  defaultModel: string;
  theme: 'light' | 'dark' | 'system';
}
