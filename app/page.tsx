'use client'

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Bot, User, Menu, Plus, Trash2, MessageSquare, X, Network } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  generateUUID,
  saveChat,
  loadChat,
  getAllChats,
  deleteSession,
  addNode,
  ChatSummary
} from "@/utils/storage";

// Type for sidebar display
type SavedChat = ChatSummary;

// Get title from first user message
const getTitleFromMessages = (messages: UIMessage[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Nova Conversa';

  const text = firstUserMessage.parts
    ?.filter((part: { type: string }) => part.type === 'text')
    .map((part: { type: string; text?: string }) => part.text || '')
    .join('') || '';

  if (text.length <= 30) return text;
  return text.substring(0, 30) + '...';
};

// Markdown component styling for AI responses
const MarkdownComponents = {
  // Code blocks
  code: ({ className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !className;

    if (isInline) {
      return (
        <code
          className="bg-black/60 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="my-3 rounded-lg overflow-hidden border border-zinc-700/50">
        {match && (
          <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 font-mono border-b border-zinc-700/50">
            {match[1]}
          </div>
        )}
        <pre className="bg-black p-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-200" {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  },
  // Paragraphs
  p: ({ children }: React.ComponentProps<'p'>) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  // Headers
  h1: ({ children }: React.ComponentProps<'h1'>) => (
    <h1 className="text-xl font-bold text-gray-100 mb-3 mt-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: React.ComponentProps<'h2'>) => (
    <h2 className="text-lg font-semibold text-gray-100 mb-2 mt-4 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: React.ComponentProps<'h3'>) => (
    <h3 className="text-base font-semibold text-gray-200 mb-2 mt-3 first:mt-0">{children}</h3>
  ),
  // Lists
  ul: ({ children }: React.ComponentProps<'ul'>) => (
    <ul className="list-disc list-inside mb-3 space-y-1 text-gray-300">{children}</ul>
  ),
  ol: ({ children }: React.ComponentProps<'ol'>) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-300">{children}</ol>
  ),
  li: ({ children }: React.ComponentProps<'li'>) => (
    <li className="leading-relaxed">{children}</li>
  ),
  // Links
  a: ({ href, children }: React.ComponentProps<'a'>) => (
    <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  // Blockquotes
  blockquote: ({ children }: React.ComponentProps<'blockquote'>) => (
    <blockquote className="border-l-4 border-indigo-500 pl-4 my-3 italic text-gray-400">
      {children}
    </blockquote>
  ),
  // Tables
  table: ({ children }: React.ComponentProps<'table'>) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-zinc-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: React.ComponentProps<'thead'>) => (
    <thead className="bg-zinc-800">{children}</thead>
  ),
  th: ({ children }: React.ComponentProps<'th'>) => (
    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-200 border-b border-zinc-700">
      {children}
    </th>
  ),
  td: ({ children }: React.ComponentProps<'td'>) => (
    <td className="px-4 py-2 text-sm text-gray-300 border-b border-zinc-800">
      {children}
    </td>
  ),
  // Strong & emphasis
  strong: ({ children }: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-gray-100">{children}</strong>
  ),
  em: ({ children }: React.ComponentProps<'em'>) => (
    <em className="italic text-gray-300">{children}</em>
  ),
  // Horizontal rule
  hr: () => <hr className="my-4 border-zinc-700" />,
};

export default function Home() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // AI SDK v5: useChat with transport, manage input state manually
  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  // Manage input state manually (SDK v5 requirement)
  const [input, setInput] = useState('');

  // Track if node was created for this session (for real-time graph updates)
  const [nodeCreated, setNodeCreated] = useState(false);

  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track previous status for auto-save trigger
  const prevStatusRef = useRef(status);

  // Determine if AI is currently responding
  const isStreaming = status === 'streaming' || status === 'submitted';

  // Load saved chats from localStorage on mount and handle session from URL
  useEffect(() => {
    setIsClient(true);

    // Check if there's a session UUID in the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');

    if (sessionFromUrl) {
      // Try to load existing chat from URL session
      const existingChat = loadChat(sessionFromUrl);
      if (existingChat) {
        console.log('[Session] Loading existing chat from URL:', sessionFromUrl);
        setCurrentSessionId(sessionFromUrl);
        setMessages(existingChat.messages);
        setNodeCreated(true); // Node already exists for loaded chat
      } else {
        // URL has session but no matching chat - use the UUID anyway (fresh session)
        console.log('[Session] Using session from URL (new):', sessionFromUrl);
        setCurrentSessionId(sessionFromUrl);
      }
    } else {
      // No session in URL - generate new UUID
      const uuid = generateUUID();
      setCurrentSessionId(uuid);
      console.log('[Session] Generated new UUID:', uuid);

      // Update URL without reload
      window.history.replaceState({}, '', `/?session=${uuid}`);
    }

    // Load all chat summaries for sidebar
    try {
      const chats = getAllChats();
      setSavedChats(chats.map(c => ({
        uuid: c.uuid,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messageCount
      })));
    } catch (e) {
      console.error('Failed to load chats:', e);
    }
  }, [setMessages]);

  // Auto-save chat when AI finishes responding (using new storage)
  useEffect(() => {
    // Trigger save when status changes from 'streaming' to 'ready' and we have messages
    if (prevStatusRef.current === 'streaming' && status === 'ready' && messages.length > 0) {
      // Save chat using unified storage
      saveChat(currentSessionId, messages);

      // Update local state for sidebar
      setSavedChats(prev => {
        const updated = getAllChats().map(c => ({
          uuid: c.uuid,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c.messageCount
        }));
        return updated;
      });
    }
    prevStatusRef.current = status;
  }, [status, messages, currentSessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time node creation: trigger on first user message (using unified UUID)
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0 && !nodeCreated && currentSessionId) {
      setNodeCreated(true);
      console.log('[Real-time Graph] Triggering node creation for UUID:', currentSessionId);

      // Call API for topic classification and embedding
      fetch('/api/graph/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.label && data.embedding) {
            console.log('[Real-time Graph] Node created with label:', data.label);
            // Use unified storage: node.id === currentSessionId (UUID)
            addNode(currentSessionId, data.label, data.embedding);
          }
        })
        .catch(err => console.error('[Real-time Graph] Failed to create node:', err));
    }
  }, [messages, nodeCreated, currentSessionId]);

  // Start a new chat session (UUID on mount pattern)
  const startNewChat = useCallback(() => {
    setMessages([]);
    const uuid = generateUUID();
    setCurrentSessionId(uuid);
    setNodeCreated(false);
    setSidebarOpen(false);

    // Update URL without reload
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/?session=${uuid}`);
    }
  }, [setMessages]);

  // Load a saved chat (by UUID)
  const loadSavedChat = useCallback((uuid: string) => {
    const session = loadChat(uuid);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(uuid);
      setNodeCreated(true); // Node already exists for this chat
      setSidebarOpen(false);

      // Update URL
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/?session=${uuid}`);
      }
    }
  }, [setMessages]);

  // Delete a chat (with phantom link cleanup via deleteSession)
  const deleteChatHandler = useCallback((uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Use unified storage deleteSession (removes chat, notes, node, AND phantom links)
    deleteSession(uuid);

    // Update local state
    setSavedChats(getAllChats().map(c => ({
      uuid: c.uuid,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messageCount
    })));

    // If we deleted the current chat, start a new one
    if (uuid === currentSessionId) {
      startNewChat();
    }
  }, [currentSessionId, startNewChat]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input });
      setInput('');
    }
  };

  // Helper function to get text content from message parts
  const getMessageText = (message: typeof messages[number]) => {
    return message.parts
      .filter(part => part.type === 'text')
      .map(part => (part as { type: 'text'; text: string }).text)
      .join('');
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 min-w-64">
          <h2 className="text-gray-200 font-semibold text-sm">Conversas</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-gray-200 transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 min-w-64">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-blue-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            Nova Conversa
          </button>
        </div>

        {/* Cadernos Navigation */}
        <div className="px-3 pb-3 min-w-64">
          <Link
            href="/cadernos"
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
          >
            <Network size={18} />
            Cadernos
          </Link>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 min-w-64">
          {isClient && savedChats.length === 0 && (
            <p className="text-zinc-500 text-xs text-center py-4">
              Nenhuma conversa salva
            </p>
          )}
          {savedChats.map(chat => (
            <button
              key={chat.uuid}
              onClick={() => loadSavedChat(chat.uuid)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 transition-colors group ${chat.uuid === currentSessionId
                ? 'bg-zinc-800 text-gray-100'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-gray-200'
                }`}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="flex-1 text-sm truncate">{chat.title}</span>
              <button
                onClick={(e) => deleteChatHandler(chat.uuid, e)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between py-4 px-4 md:px-6 border-b border-zinc-800/80 bg-zinc-950">
          {/* Left: Menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-gray-200 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Center: Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-gray-100 font-semibold text-lg">Assistente IA</h1>
              <p className="text-zinc-500 text-xs flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                {isStreaming ? "Processando..." : "Online"}
              </p>
            </div>
          </div>

          {/* Right: Placeholder for balance */}
          <div className="w-10" />
        </header>

        {/* Messages Container - takes remaining space */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Welcome message when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                  <Bot size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-100 mb-2">
                  Olá! Como posso te ajudar?
                </h2>
                <p className="text-zinc-500 max-w-md text-sm">
                  T.E.O. - Seu Tutor de Estudo Otimizado
                </p>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const messageText = getMessageText(message);

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
                >
                  {/* AI Avatar (left side) */}
                  {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mr-3 border border-zinc-700/50">
                      <Bot size={16} className="text-zinc-400" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] ${isUser
                      ? 'bg-gradient-to-r from-indigo-950 to-blue-900 text-gray-100 rounded-2xl rounded-br-md px-4 py-3 border border-indigo-800/50'
                      : 'bg-zinc-900 text-gray-300 rounded-2xl rounded-bl-md px-5 py-4 border border-zinc-800'
                      }`}
                  >
                    {isUser ? (
                      // User messages - plain text
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {messageText}
                      </p>
                    ) : (
                      // AI messages - Markdown rendered
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents}
                        >
                          {messageText}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* User Avatar (right side) */}
                  {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-900 flex items-center justify-center ml-3 border border-indigo-700/50">
                      <User size={16} className="text-indigo-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading indicator */}
            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mr-3 border border-zinc-700/50">
                  <Bot size={16} className="text-zinc-400" />
                </div>
                <div className="bg-zinc-900 px-5 py-4 rounded-2xl rounded-bl-md border border-zinc-800">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - fixed at bottom */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 px-4 py-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto flex items-end gap-3"
          >
            <div className="flex-1 relative">
              <textarea
                placeholder="Digite sua pergunta sobre programação..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                disabled={status !== 'ready'}
                className="w-full resize-none rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-gray-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 max-h-32 overflow-y-auto disabled:opacity-50"
                style={{ minHeight: '48px' }}
              />
            </div>

            <button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-3">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
