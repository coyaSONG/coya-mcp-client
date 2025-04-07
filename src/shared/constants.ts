// Default settings
export const DEFAULT_SETTINGS = {
  openrouterApiKey: '',
  defaultModel: 'openai/gpt-3.5-turbo',
  theme: 'system',
};

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'coya-mcp-client-settings',
  SERVERS: 'coya-mcp-client-servers',
  CONVERSATIONS: 'coya-mcp-client-conversations',
};

// Default system message for chat
export const DEFAULT_SYSTEM_MESSAGE = 
  'You are a helpful assistant with access to tools provided by MCP servers. ' +
  'Use the tools when appropriate to help the user.';

// Default fallback model if OpenRouter.ai API key is not set
export const FALLBACK_MODEL = {
  id: 'openai/gpt-3.5-turbo',
  name: 'GPT-3.5 Turbo',
  context_length: 4096,
  pricing: {
    prompt: 0.0015,
    completion: 0.002,
  },
  provider: {
    name: 'openai',
    label: 'OpenAI',
  },
}; 