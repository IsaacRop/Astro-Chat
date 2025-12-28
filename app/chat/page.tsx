'use client'

import { useChat, type Message } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Bot, User, Plus, Trash2, MessageSquare, X, Network } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/Header";
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

// Markdown component styling for AI responses
const MarkdownComponents = {
    // Code blocks
    code: ({ className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;

        if (isInline) {
            return (
                <code
                    className="bg-accent-purple/10 text-accent-purple px-1.5 py-0.5 rounded text-sm font-mono border border-accent-purple/20"
                    {...props}
                >
                    {children}
                </code>
            );
        }

        return (
            <div className="my-3 rounded-lg overflow-hidden border border-border">
                {match && (
                    <div className="bg-muted px-4 py-2 text-xs text-muted-foreground font-mono border-b border-border">
                        {match[1]}
                    </div>
                )}
                <pre className="bg-card p-4 overflow-x-auto text-card-foreground">
                    <code className="text-sm font-mono" {...props}>
                        {children}
                    </code>
                </pre>
            </div>
        );
    },
    // Paragraphs
    p: ({ children }: React.ComponentProps<'p'>) => (
        <p className="mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>
    ),
    // Headers
    h1: ({ children }: React.ComponentProps<'h1'>) => (
        <h1 className="text-xl font-bold font-serif text-foreground mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: React.ComponentProps<'h2'>) => (
        <h2 className="text-lg font-semibold font-serif text-foreground mb-2 mt-4 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: React.ComponentProps<'h3'>) => (
        <h3 className="text-base font-semibold font-serif text-foreground mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    // Lists
    ul: ({ children }: React.ComponentProps<'ul'>) => (
        <ul className="list-disc list-inside mb-3 space-y-1 text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }: React.ComponentProps<'ol'>) => (
        <ol className="list-decimal list-inside mb-3 space-y-1 text-muted-foreground">{children}</ol>
    ),
    li: ({ children }: React.ComponentProps<'li'>) => (
        <li className="leading-relaxed">{children}</li>
    ),
    // Links
    a: ({ href, children }: React.ComponentProps<'a'>) => (
        <a href={href} className="text-accent-blue hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
    // Blockquotes
    blockquote: ({ children }: React.ComponentProps<'blockquote'>) => (
        <blockquote className="border-l-4 border-accent-purple pl-4 my-3 italic text-muted-foreground">
            {children}
        </blockquote>
    ),
    // Tables
    table: ({ children }: React.ComponentProps<'table'>) => (
        <div className="overflow-x-auto my-3">
            <table className="min-w-full border border-border rounded-lg overflow-hidden">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: React.ComponentProps<'thead'>) => (
        <thead className="bg-muted">{children}</thead>
    ),
    th: ({ children }: React.ComponentProps<'th'>) => (
        <th className="px-4 py-2 text-left text-sm font-semibold text-foreground border-b border-border">
            {children}
        </th>
    ),
    td: ({ children }: React.ComponentProps<'td'>) => (
        <td className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
            {children}
        </td>
    ),
    // Strong & emphasis
    strong: ({ children }: React.ComponentProps<'strong'>) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: React.ComponentProps<'em'>) => (
        <em className="italic text-muted-foreground">{children}</em>
    ),
    // Horizontal rule
    hr: () => <hr className="my-4 border-border" />,
};

export default function ChatPage() {
    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [isClient, setIsClient] = useState(false);

    // AI SDK v4: useChat with api option
    const { messages, setMessages, input, handleInputChange, handleSubmit: submitChat, isLoading } = useChat({
        api: '/api/chat',
    });

    // Track if node was created for this session (for real-time graph updates)
    const [nodeCreated, setNodeCreated] = useState(false);

    // Store AI-generated title for the conversation
    const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);

    // Ref for auto-scrolling to latest message
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Track previous isLoading for auto-save trigger
    const prevLoadingRef = useRef(isLoading);

    // Determine if AI is currently responding
    const isStreaming = isLoading;

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
                setMessages(existingChat.messages as unknown as Message[]);
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
            window.history.replaceState({}, '', `/chat?session=${uuid}`);
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
        // Trigger save when isLoading changes from true to false and we have messages
        if (prevLoadingRef.current === true && isLoading === false && messages.length > 0) {
            // Save chat using unified storage with AI-generated title
            saveChat(currentSessionId, messages as unknown as import('ai').UIMessage[], generatedTitle || undefined);

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
        prevLoadingRef.current = isLoading;
    }, [isLoading, messages, currentSessionId, generatedTitle]);

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
                        // Store the AI-generated title for use when saving chat
                        setGeneratedTitle(data.label);
                        // Use unified storage: node.id === currentSessionId (UUID)
                        addNode(currentSessionId, data.label, data.embedding);
                        // IMPORTANT: Re-save chat with the AI-generated title (fixes timing issue)
                        if (messages.length > 0) {
                            saveChat(currentSessionId, messages as unknown as import('ai').UIMessage[], data.label);
                            // Update sidebar with new title
                            setSavedChats(getAllChats().map(c => ({
                                uuid: c.uuid,
                                title: c.title,
                                createdAt: c.createdAt,
                                updatedAt: c.updatedAt,
                                messageCount: c.messageCount
                            })));
                        }
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
        setGeneratedTitle(null);
        setSidebarOpen(false);

        // Update URL without reload
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', `/chat?session=${uuid}`);
        }
    }, [setMessages]);

    // Load a saved chat (by UUID)
    const loadSavedChat = useCallback((uuid: string) => {
        const session = loadChat(uuid);
        if (session) {
            setMessages(session.messages as unknown as Message[]);
            setCurrentSessionId(uuid);
            setNodeCreated(true); // Node already exists for this chat
            setGeneratedTitle(session.title); // Restore saved title
            setSidebarOpen(false);

            // Update URL
            if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', `/chat?session=${uuid}`);
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
        if (input.trim() && !isLoading) {
            submitChat(e);
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
        <div className="flex h-screen bg-background text-foreground">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Always visible on desktop */}
            <aside
                className={`fixed md:relative z-50 h-full bg-card/50 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 md:w-64'
                    } overflow-hidden`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-border min-w-64">
                    <h2 className="text-foreground font-semibold text-sm font-serif tracking-wide">Conversas</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors md:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-3 min-w-64">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-blue/90 text-background text-sm font-medium hover:bg-accent-blue transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Nova Conversa
                    </button>
                </div>

                {/* Cadernos Navigation */}
                <div className="px-3 pb-3 min-w-64">
                    <Link
                        href="/cadernos"
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-purple/90 text-background text-sm font-medium hover:bg-accent-purple transition-all shadow-sm"
                    >
                        <Network size={18} />
                        Cadernos
                    </Link>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto p-2 min-w-64">
                    {isClient && savedChats.length === 0 && (
                        <p className="text-muted-foreground text-xs text-center py-4">
                            Nenhuma conversa salva
                        </p>
                    )}
                    {savedChats.map((chat: SavedChat) => (
                        <div
                            key={chat.uuid}
                            onClick={() => loadSavedChat(chat.uuid)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && loadSavedChat(chat.uuid)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 transition-colors group cursor-pointer ${chat.uuid === currentSessionId
                                ? 'bg-muted/80 text-foreground font-medium'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <MessageSquare size={16} className="flex-shrink-0" />
                            <span className="flex-1 text-sm truncate">{chat.title}</span>
                            <button
                                onClick={(e) => deleteChatHandler(chat.uuid, e)}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-3xl">
                {/* Header Replaced with Shared Component */}
                <Header
                    title="Astro"
                    backLink="/"
                    showMenuButton={true}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Messages Container - takes remaining space */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        {/* Welcome message when no messages */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center mb-6 shadow-none">
                                    <Bot size={48} className="text-foreground" />
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
                                    Olá! Eu sou o Astro.
                                </h2>
                                <p className="text-muted-foreground max-w-md text-base">
                                    Seu explorador do conhecimento cósmico.
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
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`}
                                >
                                    {/* AI Avatar (left side) */}
                                    {!isUser && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center mr-3 mt-1 shadow-sm">
                                            <Bot size={16} className="text-foreground" />
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={`max-w-[85%] relative ${isUser
                                            ? 'bg-accent-blue/10 text-foreground rounded-2xl rounded-br-sm px-6 py-4 border border-accent-blue/20'
                                            : 'bg-card text-foreground rounded-2xl rounded-bl-sm px-6 py-4 border border-border shadow-sm'
                                            }`}
                                    >
                                        {isUser ? (
                                            // User messages - plain text
                                            <p className="text-base leading-relaxed whitespace-pre-wrap break-words font-medium">
                                                {messageText}
                                            </p>
                                        ) : (
                                            // AI messages - Markdown rendered
                                            <div className="prose prose-sm max-w-none dark:prose-invert">
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
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center ml-3 mt-1 shadow-md shadow-accent-blue/20">
                                            <User size={16} className="text-background" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex justify-start mb-6">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center mr-3">
                                    <Bot size={16} className="text-muted-foreground" />
                                </div>
                                <div className="bg-card px-5 py-4 rounded-2xl rounded-bl-md border border-border shadow-sm">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area - fixed at bottom */}
                <div className="border-t border-border/50 bg-background/80 backdrop-blur-md px-4 py-6">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-4xl mx-auto flex items-end gap-3"
                    >
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <textarea
                                placeholder="Digite sua pergunta sobre programação..."
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                rows={1}
                                disabled={isLoading}
                                className="relative w-full resize-none rounded-xl bg-card border border-border px-5 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-purple/50 focus:border-accent-purple/50 transition-all duration-200 max-h-32 overflow-y-auto disabled:opacity-50 shadow-sm"
                                style={{ minHeight: '52px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple text-white flex items-center justify-center shadow-lg shadow-accent-purple/20 hover:shadow-accent-purple/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </form>

                    <p className="text-center text-muted-foreground/60 text-xs mt-3 font-medium">
                        Enter para enviar • Shift+Enter para nova linha
                    </p>
                </div>
            </div>
        </div>
    );
}
