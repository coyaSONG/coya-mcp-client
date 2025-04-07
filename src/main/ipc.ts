import { ipcMain } from 'electron';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

// Map to store active MCP clients
const mcpClients: Map<string, any> = new Map();

// Setup IPC handlers for MCP client operations
export function setupIpcHandlers() {
  // Connect to an MCP server via stdio
  ipcMain.handle('connect-mcp-stdio', async (event, { id, serverPath, args = [] }) => {
    try {
      // Check if server file exists
      if (!fs.existsSync(serverPath)) {
        throw new Error(`Server file not found: ${serverPath}`);
      }

      // Determine command based on file extension
      const isJs = serverPath.endsWith('.js') || serverPath.endsWith('.mjs');
      const isPy = serverPath.endsWith('.py');
      
      if (!isJs && !isPy) {
        throw new Error('Unsupported server file type. Must be .js, .mjs, or .py');
      }

      const command = isPy ? 'python' : 'node';
      
      // Create transport
      const transport = new StdioClientTransport({
        command,
        args: [serverPath, ...args],
      });

      // Create client
      const client = new Client(
        {
          name: 'coya-mcp-client',
          version: '1.0.0',
        },
        {
          capabilities: {
            prompts: {},
            resources: {},
            tools: {},
          },
        }
      );

      // Connect client to transport
      await client.connect(transport);
      
      // Store client
      mcpClients.set(id, client);
      
      // List available tools
      const tools = await client.listTools();
      
      return {
        success: true,
        tools: tools.tools,
      };
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Other IPC handlers for HTTP connection, disconnects, tool calls, etc.
  // ...

  // OpenRouter.ai API call for chat completions
  ipcMain.handle('openrouter-chat', async (event, { apiKey, model, messages, tools = [] }) => {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages,
          tools: tools.length > 0 ? tools : undefined,
          stream: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://coya-mcp-client.app',
            'X-Title': 'Coya MCP Client',
          },
        }
      );
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Get available models from OpenRouter.ai
  ipcMain.handle('openrouter-models', async (event, { apiKey }) => {
    try {
      const response = await axios.get(
        'https://openrouter.ai/api/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        success: true,
        models: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
} 