# Coya MCP Client

A simple Electron-based chat interface client for Model Context Protocol (MCP) servers with OpenRouter.ai integration.

## Features

- Connect to MCP servers via stdio (local) or HTTP (remote)
- View and call available tools from connected MCP servers
- Chat with AI models from OpenRouter.ai
- Tool calling support for MCP server tools
- Dark/light theme support

## Prerequisites

- Node.js (v16+)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/coyaSONG/coya-mcp-client.git
cd coya-mcp-client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenRouter.ai API key:
```
OPENROUTER_API_KEY=your_api_key_here
```

## Development

To start the development server:

```bash
npm run dev
```

This will start both the Electron app and the React development server.

## Building

To build the application:

```bash
npm run build
npm run build:electron
```

This will create a distributable package in the `dist` directory.

## License

MIT
