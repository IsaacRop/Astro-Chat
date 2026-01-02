'use client'

import { useChat, type Message } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Send, User, Plus, Trash2, MessageSquare, X, Network } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/Header";
import { AstroChatInput } from "@/components/ui/astro-chat-input";
import {
    generateUUID,
    saveChat,
    loadChat,
    getAllChats,
    deleteSession,
    addNode,
    updateNodeMessageCount,
    ChatSummary
} from "@/utils/storage";

// Octopus Icon for Otto branding
const OctopusIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <ellipse cx="12" cy="9" rx="5" ry="4" />
        <circle cx="10" cy="8.5" r="0.5" fill="currentColor" />
        <circle cx="14" cy="8.5" r="0.5" fill="currentColor" />
        <path d="M7 12c-1 1.5-1.5 3.5-1 5" />
        <path d="M9 13c-.5 1.5-.5 3.5 0 5" />
        <path d="M12 13c0 1.5 0 3.5 0 5" />
        <path d="M15 13c.5 1.5.5 3.5 0 5" />
        <path d="M17 12c1 1.5 1.5 3.5 1 5" />
    </svg>
);

// Type for sidebar display
type SavedChat = ChatSummary;

// Markdown component styling for AI responses
const MarkdownComponents = {
    code: ({ className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;

        if (isInline) {
            return (
                <code
                    className="bg-accent-purple/10 text-accent-purple px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-accent-purple/20"
                    {...props}
                >
                    {children}
                </code>
            );
        }

        return (
            <div className="my-3 rounded-lg overflow-hidden border border-border">
                {match && (
                    <div className="bg-muted px-3 md:px-4 py-2 text-xs text-muted-foreground font-mono border-b border-border">
                        {match[1]}
                    </div>
                )}
                <pre className="bg-card p-3 md:p-4 overflow-x-auto text-card-foreground">
                    <code className="text-xs md:text-sm font-mono" {...props}>
                        {children}
                    </code>
                </pre>
            </div>
        );
    },
    p: ({ children }: React.ComponentProps<'p'>) => (
        <p className="mb-3 last:mb-0 leading-relaxed text-foreground text-sm md:text-base">{children}</p>
    ),
    h1: ({ children }: React.ComponentProps<'h1'>) => (
        <h1 className="text-lg md:text-xl font-bold font-serif text-foreground mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: React.ComponentProps<'h2'>) => (
        <h2 className="text-base md:text-lg font-semibold font-serif text-foreground mb-2 mt-4 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: React.ComponentProps<'h3'>) => (
        <h3 className="text-sm md:text-base font-semibold font-serif text-foreground mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    ul: ({ children }: React.ComponentProps<'ul'>) => (
        <ul className="list-disc list-inside mb-3 space-y-1 text-muted-foreground text-sm md:text-base">{children}</ul>
    ),
    ol: ({ children }: React.ComponentProps<'ol'>) => (
        <ol className="list-decimal list-inside mb-3 space-y-1 text-muted-foreground text-sm md:text-base">{children}</ol>
    ),
    li: ({ children }: React.ComponentProps<'li'>) => (
        <li className="leading-relaxed">{children}</li>
    ),
    a: ({ href, children }: React.ComponentProps<'a'>) => (
        <a href={href} className="text-accent-blue hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
    blockquote: ({ children }: React.ComponentProps<'blockquote'>) => (
        <blockquote className="border-l-4 border-accent-purple pl-3 md:pl-4 my-3 italic text-muted-foreground text-sm md:text-base">
            {children}
        </blockquote>
    ),
    table: ({ children }: React.ComponentProps<'table'>) => (
        <div className="overflow-x-auto my-3">
            <table className="min-w-full border border-border rounded-lg overflow-hidden text-sm">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: React.ComponentProps<'thead'>) => (
        <thead className="bg-muted">{children}</thead>
    ),
    th: ({ children }: React.ComponentProps<'th'>) => (
        <th className="px-3 md:px-4 py-2 text-left text-xs md:text-sm font-semibold text-foreground border-b border-border">
            {children}
        </th>
    ),
    td: ({ children }: React.ComponentProps<'td'>) => (
        <td className="px-3 md:px-4 py-2 text-xs md:text-sm text-muted-foreground border-b border-border">
            {children}
        </td>
    ),
    strong: ({ children }: React.ComponentProps<'strong'>) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: React.ComponentProps<'em'>) => (
        <em className="italic text-muted-foreground">{children}</em>
    ),
    hr: () => <hr className="my-4 border-border" />,
};

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [isClient, setIsClient] = useState(false);

    const { messages, setMessages, input, handleInputChange, handleSubmit: submitChat, isLoading } = useChat({
        api: '/api/chat',
    });

    const [nodeCreated, setNodeCreated] = useState(false);
    const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevLoadingRef = useRef(isLoading);
    const isStreaming = isLoading;

    // Load saved chats
    useEffect(() => {
        setIsClient(true);
        const urlParams = new URLSearchParams(window.location.search);
        const sessionFromUrl = urlParams.get('session');

        if (sessionFromUrl) {
            const existingChat = loadChat(sessionFromUrl);
            if (existingChat) {
                setCurrentSessionId(sessionFromUrl);
                setMessages(existingChat.messages as unknown as Message[]);
                setNodeCreated(true);
            } else {
                setCurrentSessionId(sessionFromUrl);
            }
        } else {
            const uuid = generateUUID();
            setCurrentSessionId(uuid);
            window.history.replaceState({}, '', `/chat?session=${uuid}`);
        }

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

    // Auto-save chat and update node size
    useEffect(() => {
        if (prevLoadingRef.current === true && isLoading === false && messages.length > 0) {
            saveChat(currentSessionId, messages as unknown as import('ai').UIMessage[], generatedTitle || undefined);
            // Update node size based on new message count
            updateNodeMessageCount(currentSessionId, messages.length);
            setSavedChats(getAllChats().map(c => ({
                uuid: c.uuid,
                title: c.title,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                messageCount: c.messageCount
            })));
        }
        prevLoadingRef.current = isLoading;
    }, [isLoading, messages, currentSessionId, generatedTitle]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Real-time node creation and update
    useEffect(() => {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length > 0 && !nodeCreated && currentSessionId) {
            setNodeCreated(true);
            fetch('/api/graph/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.label && data.embedding) {
                        setGeneratedTitle(data.label);
                        // Pass messageCount for dynamic node sizing
                        addNode(currentSessionId, data.label, data.embedding, messages.length);
                        if (messages.length > 0) {
                            saveChat(currentSessionId, messages as unknown as import('ai').UIMessage[], data.label);
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
                .catch(err => console.error('Failed to create node:', err));
        }
    }, [messages, nodeCreated, currentSessionId]);

    const startNewChat = useCallback(() => {
        setMessages([]);
        const uuid = generateUUID();
        setCurrentSessionId(uuid);
        setNodeCreated(false);
        setGeneratedTitle(null);
        setSidebarOpen(false);
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', `/chat?session=${uuid}`);
        }
    }, [setMessages]);

    const loadSavedChat = useCallback((uuid: string) => {
        const session = loadChat(uuid);
        if (session) {
            setMessages(session.messages as unknown as Message[]);
            setCurrentSessionId(uuid);
            setNodeCreated(true);
            setGeneratedTitle(session.title);
            setSidebarOpen(false);
            if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', `/chat?session=${uuid}`);
            }
        }
    }, [setMessages]);

    const deleteChatHandler = useCallback((uuid: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteSession(uuid);
        setSavedChats(getAllChats().map(c => ({
            uuid: c.uuid,
            title: c.title,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            messageCount: c.messageCount
        })));
        if (uuid === currentSessionId) {
            startNewChat();
        }
    }, [currentSessionId, startNewChat]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            submitChat(e);
        }
    };

    const getMessageText = (message: typeof messages[number]) => {
        // Handle AI SDK v6 parts array format
        if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
            return message.parts
                .filter(part => part.type === 'text')
                .map(part => (part as { type: 'text'; text: string }).text)
                .join('');
        }
        // Fallback to content field (legacy format or streaming)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((message as any).content) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return String((message as any).content);
        }
        return '';
    };


    return (
        <div className="flex h-screen h-[100dvh] bg-background text-foreground overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:relative z-50 h-full bg-card/50 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 md:w-64'
                    } overflow-hidden`}
            >
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-border min-w-64">
                    <h2 className="text-foreground font-semibold text-sm font-serif tracking-wide">Conversas</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors md:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-3 min-w-64">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg bg-accent-blue/90 text-background text-sm font-medium hover:bg-accent-blue transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Nova Conversa
                    </button>
                </div>

                <div className="px-3 pb-3 min-w-64">
                    <Link
                        href="/cadernos"
                        className="w-full flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg bg-accent-purple/90 text-background text-sm font-medium hover:bg-accent-purple transition-all shadow-sm"
                    >
                        <Network size={18} />
                        Cadernos
                    </Link>
                </div>

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
                <Header title="Otto" />

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] md:min-h-[400px] text-center px-4">
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center mb-4 md:mb-6 shadow-none">
                                    <OctopusIcon size={32} className="md:w-12 md:h-12 text-accent-purple" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 md:mb-3">
                                    Olá! Eu sou o Otto.
                                </h2>
                                <p className="text-muted-foreground max-w-md text-sm md:text-base">
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
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 md:mb-8 group`}
                                >
                                    {!isUser && (
                                        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-card border border-border flex items-center justify-center mr-2 md:mr-3 mt-1 shadow-sm">
                                            <OctopusIcon size={14} className="md:w-4 md:h-4 text-accent-purple" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[90%] md:max-w-[85%] relative ${isUser
                                            ? 'bg-accent-blue/10 text-foreground rounded-2xl rounded-br-sm px-4 md:px-6 py-3 md:py-4 border border-accent-blue/20'
                                            : 'bg-card text-foreground rounded-2xl rounded-bl-sm px-4 md:px-6 py-3 md:py-4 border border-border shadow-sm'
                                            }`}
                                    >
                                        {isUser ? (
                                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words font-medium">
                                                {messageText}
                                            </p>
                                        ) : (
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

                                    {isUser && (
                                        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-accent-blue flex items-center justify-center ml-2 md:ml-3 mt-1 shadow-md shadow-accent-blue/20">
                                            <User size={14} className="md:w-4 md:h-4 text-background" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex justify-start mb-6">
                                <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-card border border-border flex items-center justify-center mr-2 md:mr-3">
                                    <OctopusIcon size={14} className="md:w-4 md:h-4 text-accent-purple" />
                                </div>
                                <div className="bg-card px-4 md:px-5 py-3 md:py-4 rounded-2xl rounded-bl-md border border-border shadow-sm">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area - Claude-style */}
                <div className="border-t border-border/50 bg-background/80 backdrop-blur-md px-3 md:px-4 py-4 md:py-6">
                    <AstroChatInput
                        value={input}
                        onChange={handleInputChange}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        placeholder="Como posso ajudar você hoje?"
                    />
                </div>
            </div>
        </div>
    );
}
