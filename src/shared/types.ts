// Server types
export interface Server {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  path?: string;
  url?: string;
  args?: string[];
  connected: boolean;
}

// Tool types
export interface Tool {
  name: string;
  description: string;
  parameters: any;
}

// Chat message types
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// Settings type
export interface Settings {
  openrouterApiKey: string;
  defaultModel: string;
  theme: 'light' | 'dark' | 'system';
}

// Model types
export interface Model {
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