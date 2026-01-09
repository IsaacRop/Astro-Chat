"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Plus, Network } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/Header";
import { AstroChatInput } from "@/components/ui/astro-chat-input";

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

// Markdown styling
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
    strong: ({ children }: React.ComponentProps<'strong'>) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: React.ComponentProps<'em'>) => (
        <em className="italic text-muted-foreground">{children}</em>
    ),
    hr: () => <hr className="my-4 border-border" />,
};

interface ChatInterfaceProps {
    chatId: string;
    initialMessages: Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
    }>;
}

export function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Convert initial messages to the format expected by useChat
    const formattedInitialMessages: UIMessage[] = initialMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text' as const, text: msg.content }],
    }));

    // AI SDK useChat hook
    // Note: Messages are saved to Supabase via /api/chat/save endpoint
    const { messages, setMessages, sendMessage, status } = useChat({
        id: chatId,
    });

    // Set initial messages on mount
    useEffect(() => {
        if (formattedInitialMessages.length > 0 && messages.length === 0) {
            setMessages(formattedInitialMessages);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Save messages to Supabase after AI response completes
    const prevStatusRef = useRef(status);
    useEffect(() => {
        // When status transitions from streaming to ready, save the AI response
        if (prevStatusRef.current !== 'ready' && status === 'ready' && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                // Save AI response to database
                fetch('/api/chat/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId,
                        role: 'assistant',
                        content: getMessageText(lastMessage),
                    }),
                }).catch(err => console.error('[ChatInterface] Failed to save AI message:', err));
            }
        }
        prevStatusRef.current = status;
    }, [status, messages, chatId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && status === "ready") {
            // Save user message to database first
            try {
                await fetch('/api/chat/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId,
                        role: 'user',
                        content: input.trim(),
                    }),
                });
            } catch (err) {
                console.error('[ChatInterface] Failed to save user message:', err);
            }

            // Then send to AI
            sendMessage({ text: input });
            setInput("");
        }
    };

    const isLoading = status !== "ready";

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getMessageText = (message: typeof messages[number]): string => {
        // Handle parts array format (AI SDK v6)
        if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
            const textParts = message.parts
                .filter((part): part is { type: 'text'; text: string } =>
                    part.type === 'text' && typeof (part as { text?: string }).text === 'string'
                )
                .map(part => part.text)
                .join('');
            if (textParts) return textParts;
        }
        // Fallback - try to access content if it exists
        const anyMessage = message as unknown as { content?: string };
        return anyMessage.content || '';
    };

    return (
        <div className="flex h-screen h-[100dvh] bg-[#0C0C0D] text-foreground overflow-hidden">


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
                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
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
