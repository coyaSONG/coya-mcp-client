import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatConversation, ChatMessage, McpServer } from '../../shared/types';
import { DEFAULT_SYSTEM_MESSAGE } from '../../shared/constants';

interface ChatInterfaceProps {
  conversation: ChatConversation;
  server?: McpServer;
  model: string;
  apiKey: string;
  onUpdateConversation: (updatedConversation: Partial<ChatConversation>) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  server,
  model,
  apiKey,
  onUpdateConversation,
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingToolCalls, setPendingToolCalls] = useState<any[]>([]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  // Function to format MCP tools for OpenRouter.ai
  const formatMcpToolsForOpenRouter = () => {
    if (!server || !server.tools || server.tools.length === 0) {
      return [];
    }
    
    return server.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  };

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    // Add user message to conversation
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
    };
    
    // Update conversation with user message
    const updatedMessages = [...conversation.messages, userMessage];
    onUpdateConversation({ messages: updatedMessages });
    
    // Clear input
    setMessage('');
    setIsLoading(true);
    
    try {
      // Check if we have an API key
      if (!apiKey) {
        throw new Error('OpenRouter.ai API key is not set. Please set it in Settings.');
      }
      
      // Prepare messages for the API
      const messages = [
        // Add system message if it's the first message
        ...(updatedMessages.length === 1 ? [{ role: 'system', content: DEFAULT_SYSTEM_MESSAGE }] : []),
        ...updatedMessages,
      ];
      
      // Format tools for OpenRouter.ai
      const tools = formatMcpToolsForOpenRouter();
      
      // Call OpenRouter.ai API
      const response = await (window as any).electron.openrouterChat({
        apiKey,
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get response from OpenRouter.ai');
      }
      
      const assistantMessage = response.data.choices[0].message;
      
      // Check if there are tool calls in the response
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls
        const assistantMessageWithToolCalls: ChatMessage = {
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls,
        };
        
        // Update conversation with assistant message
        const messagesWithAssistant = [...updatedMessages, assistantMessageWithToolCalls];
        onUpdateConversation({ messages: messagesWithAssistant });
        
        // Process tool calls
        setPendingToolCalls(assistantMessage.tool_calls);
        
        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type === 'function' && server && server.connected) {
            try {
              // Parse arguments
              const args = JSON.parse(toolCall.function.arguments);
              
              // Call MCP tool
              const toolResponse = await (window as any).electron.callMcpTool({
                id: server.id,
                toolName: toolCall.function.name,
                args,
              });
              
              // Add tool response message
              const toolResponseMessage: ChatMessage = {
                role: 'tool',
                content: JSON.stringify(toolResponse.result || toolResponse.error, null, 2),
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
              };
              
              // Update conversation with tool response
              const messagesWithToolResponse = [
                ...messagesWithAssistant,
                toolResponseMessage,
              ];
              onUpdateConversation({ messages: messagesWithToolResponse });
              
              // Remove from pending tool calls
              setPendingToolCalls(prev => prev.filter(tc => tc.id !== toolCall.id));
            } catch (error) {
              console.error('Error calling MCP tool:', error);
              
              // Add error message
              const errorMessage: ChatMessage = {
                role: 'tool',
                content: `Error: ${error instanceof Error ? error.message : String(error) || 'Failed to call tool'}`,
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
              };
              
              // Update conversation with error message
              const messagesWithError = [...messagesWithAssistant, errorMessage];
              onUpdateConversation({ messages: messagesWithError });
              
              // Remove from pending tool calls
              setPendingToolCalls(prev => prev.filter(tc => tc.id !== toolCall.id));
            }
          }
        }
        
        // After all tool calls are processed, get a final response
        if (server && server.connected) {
          // Get all messages including tool responses
          const allMessages = [
            ...(messagesWithAssistant.length === 1 ? [{ role: 'system' as const, content: DEFAULT_SYSTEM_MESSAGE }] : []),
            ...conversation.messages,
          ];
          
          // Call OpenRouter.ai API again
          const finalResponse = await (window as any).electron.openrouterChat({
            apiKey,
            model,
            messages: allMessages,
            tools: tools.length > 0 ? tools : undefined,
          });
          
          if (finalResponse.success) {
            const finalAssistantMessage = finalResponse.data.choices[0].message;
            
            // Add final assistant message
            const finalMessage: ChatMessage = {
              role: 'assistant',
              content: finalAssistantMessage.content || '',
            };
            
            // Update conversation with final message
            const messagesWithFinalResponse = [...allMessages, finalMessage];
            onUpdateConversation({ messages: messagesWithFinalResponse });
          }
        }
      } else {
        // Add simple assistant message without tool calls
        const assistantMessageSimple: ChatMessage = {
          role: 'assistant',
          content: assistantMessage.content || '',
        };
        
        // Update conversation with assistant message
        const messagesWithAssistant = [...updatedMessages, assistantMessageSimple];
        onUpdateConversation({ messages: messagesWithAssistant });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error) || 'Something went wrong'}`,
      };
      
      // Update conversation with error message
      const messagesWithError = [...updatedMessages, errorMessage];
      onUpdateConversation({ messages: messagesWithError });
    } finally {
      setIsLoading(false);
      setPendingToolCalls([]);
    }
  };

  // Function to handle pressing Enter to send a message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to render a message
  const renderMessage = (message: ChatMessage, index: number) => {
    return (
      <div 
        key={index} 
        className={`chat-message ${message.role}`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-2">
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                U
              </div>
            )}
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                A
              </div>
            )}
            {message.role === 'system' && (
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white">
                S
              </div>
            )}
            {message.role === 'tool' && (
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                T
              </div>
            )}
          </div>
          <div className="flex-1">
            {message.name && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {message.name}
              </div>
            )}
            <div className="markdown">
              {message.role === 'tool' ? (
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {message.content}
                </pre>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
            </div>
            {message.tool_calls && (
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Tool Calls:
                </div>
                {message.tool_calls.map((toolCall: any) => (
                  <div 
                    key={toolCall.id}
                    className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 text-sm"
                  >
                    <div className="font-medium">{toolCall.function.name}</div>
                    <pre className="whitespace-pre-wrap text-xs font-mono mt-1">
                      {toolCall.function.arguments}
                    </pre>
                    {pendingToolCalls.some(tc => tc.id === toolCall.id) && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span className="spinner mr-1"></span>
                        <span>Executing...</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Start a new conversation</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {server ? (
                  <>
                    You are connected to <strong>{server.name}</strong> with{' '}
                    <strong>{server.tools?.length || 0}</strong> available tools.
                  </>
                ) : (
                  <>
                    You are using <strong>{model.split('/').pop()}</strong> from OpenRouter.ai.
                  </>
                )}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Type a message below to get started.
              </p>
            </div>
          </div>
        ) : (
          <>
            {conversation.messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
            placeholder="Type a message..."
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div>
            {server ? (
              <span>Connected to {server.name}</span>
            ) : (
              <span>Using {model.split('/').pop()}</span>
            )}
          </div>
          <div>
            <span>Press Shift+Enter for a new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
