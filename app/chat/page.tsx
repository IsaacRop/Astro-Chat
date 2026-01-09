'use client'

import { useChat } from "@ai-sdk/react";
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
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
    const [input, setInput] = useState('');
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

    // AI SDK v6 useChat hook
    const { messages, setMessages, sendMessage, status } = useChat();

    // Derive loading states from status
    const isLoading = status !== 'ready';

    const [nodeCreated, setNodeCreated] = useState(false);
    const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevLoadingRef = useRef(isLoading);
    const isStreaming = isLoading;

    // Load saved chats and check auth
    useEffect(() => {
        setIsClient(true);

        // Check if user is authenticated - redirect to dashboard chat
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Logged in users go to the Supabase-backed chat
                window.location.href = '/dashboard/chat';
                return;
            }
            setSupabaseUser(user);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const sessionFromUrl = urlParams.get('session');

        if (sessionFromUrl) {
            const existingChat = loadChat(sessionFromUrl);
            if (existingChat) {
                setCurrentSessionId(sessionFromUrl);
                setMessages(existingChat.messages as Parameters<typeof setMessages>[0]);
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
        if (prevLoadingRef.current === true && !isLoading && messages.length > 0) {
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
            setMessages(session.messages as Parameters<typeof setMessages>[0]);
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
        if (input.trim() && status === 'ready') {
            sendMessage({ text: input });
            setInput('');
        }
    };

    const getMessageText = (message: typeof messages[number]) => {
        // Handle AI SDK v6 parts array format - this is the primary format for v6
        if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
            const textParts = message.parts
                .filter((part): part is { type: 'text'; text: string } =>
                    part.type === 'text' && typeof (part as { text?: string }).text === 'string'
                )
                .map(part => part.text)
                .join('');

            if (textParts) {
                return textParts;
            }
        }

        // Fallback to content field (legacy format or during initial streaming)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyMessage = message as any;
        if (anyMessage.content) {
            return String(anyMessage.content);
        }

        // Also check for text property directly on message (some edge cases)
        if (anyMessage.text) {
            return String(anyMessage.text);
        }

        return '';
    };


    return (
        <div className="flex h-screen h-[100dvh] bg-[#0C0C0D] text-foreground overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:relative z-50 h-full bg-[#1A1A1C] border-r border-white/[0.05] flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 md:w-64'
                    } overflow-hidden`}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/[0.05] min-w-64">
                    <h2 className="text-zinc-400 font-medium text-xs font-sans tracking-wider uppercase">Conversas</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors md:hidden"
                    >
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="p-4 min-w-64 space-y-2">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-200 text-sm font-medium transition-all border border-white/[0.05]"
                    >
                        <Plus size={16} strokeWidth={1.5} />
                        Nova Conversa
                    </button>

                    <Link
                        href="/cadernos"
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-all border border-transparent hover:border-white/[0.05]"
                    >
                        <Network size={16} strokeWidth={1.5} />
                        Cadernos
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-2 min-w-64">
                    {isClient && savedChats.length === 0 && (
                        <p className="text-zinc-600 text-xs text-center py-8 font-sans">
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
                                ? 'bg-white/[0.06] text-zinc-100'
                                : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
                                }`}
                        >
                            <MessageSquare size={14} className="flex-shrink-0 opacity-70" strokeWidth={1.5} />
                            <span className="flex-1 text-sm truncate font-sans">{chat.title}</span>
                            <button
                                onClick={(e) => deleteChatHandler(chat.uuid, e)}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all"
                            >
                                <Trash2 size={13} strokeWidth={1.5} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0C0C0D]">
                <Header title="Otto" />

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-8 scroll-smooth">
                    <div className="max-w-3xl mx-auto">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
                                <div className="w-16 h-16 rounded-full border border-white/[0.05] bg-[#1A1A1C] flex items-center justify-center mb-6">
                                    <OctopusIcon size={28} className="text-zinc-100" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-serif font-medium text-zinc-100 mb-3 tracking-tight">
                                    Olá, eu sou o Otto.
                                </h2>
                                <p className="text-zinc-500 max-w-md text-sm md:text-base font-sans leading-relaxed">
                                    Seu explorador do conhecimento. Como posso ajudar você hoje?
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
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
                                >
                                    {!isUser && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white/[0.05] bg-[#1A1A1C] flex items-center justify-center mr-4 mt-1">
                                            <OctopusIcon size={14} className="text-zinc-100" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[90%] md:max-w-[85%] relative ${isUser
                                            ? 'bg-[#1A1A1C] text-zinc-100 rounded-2xl rounded-tr-sm px-5 py-3 border border-white/[0.05]'
                                            : 'text-zinc-300 px-0 py-2'
                                            }`}
                                    >
                                        {isUser ? (
                                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words font-sans">
                                                {messageText}
                                            </p>
                                        ) : (
                                            <div className="prose prose-sm prose-invert max-w-none prose-p:text-zinc-400 prose-headings:font-serif prose-headings:text-zinc-200">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={MarkdownComponents}
                                                >
                                                    {messageText}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex justify-start mb-6">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white/[0.05] bg-[#1A1A1C] flex items-center justify-center mr-4">
                                    <OctopusIcon size={14} className="text-zinc-100" />
                                </div>
                                <div className="px-0 py-2">
                                    <div className="flex space-x-2">
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-[#0C0C0D] px-4 pb-6 pt-2">
                    <div className="max-w-3xl mx-auto">
                        <AstroChatInput
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                            placeholder="Pergunte qualquer coisa..."
                        />
                        <p className="text-center text-[10px] text-zinc-600 mt-3 font-sans">Otto pode cometer erros. Verifique informações importantes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
