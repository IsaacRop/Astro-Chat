"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Zap, FileText, ImageIcon } from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AstroChatInput } from "@/components/ui/astro-chat-input";

// Octopus Icon for Otto branding
const OctopusIcon = ({ className = "" }: { size?: number; className?: string }) => (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4A9E6B] to-[#5B9E9E] shadow-sm ${className}`}>
        <span className="text-white font-serif font-bold leading-none select-none">O</span>
    </div>
);

// Markdown styling
const MarkdownComponents = {
    code: ({ className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;

        if (isInline) {
            return (
                <code
                    className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-primary/20"
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
        <blockquote className="border-l-4 border-primary pl-3 md:pl-4 my-3 italic text-muted-foreground text-sm md:text-base">
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

// ── PaywallModal ─────────────────────────────────────────────────────────────
const PRICE_MONTHLY = "price_1T9Uk7CKO59buulnEpHz9iHj";
const PRICE_ANNUAL = "price_1T9Uk6CKO59buuln4Pfbrvuq";

function PaywallModal({ onClose }: { onClose: () => void }) {
    const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

    const handleUpgrade = async (priceId: string) => {
        setUpgradeLoading(priceId);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao iniciar checkout");
            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            setUpgradeLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Dark overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Card */}
            <div className="relative z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
                {/* Icon badge */}
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-accent-light)] mx-auto mb-5">
                    <Zap className="w-7 h-7 text-[var(--color-accent)]" />
                </div>

                <h2 className="text-xl font-serif font-bold text-[var(--color-text)] mb-2">
                    Limite diário atingido
                </h2>

                <p className="text-sm text-[var(--color-text-sec)] mb-5 leading-relaxed">
                    Você atingiu o limite diário do plano Free{" "}
                    <span className="font-semibold text-[var(--color-text)]">(10 mensagens)</span>.
                    <br />
                    Faça upgrade para continuar aprendendo sem limites.
                </p>

                {/* Plan options */}
                <div className="space-y-2.5 mb-3">
                    <button
                        onClick={() => handleUpgrade(PRICE_ANNUAL)}
                        disabled={upgradeLoading !== null}
                        className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-150 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {upgradeLoading === PRICE_ANNUAL ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Redirecionando...
                            </>
                        ) : (
                            <>Assinar Anual — R$ 15,00/mês</>
                        )}
                    </button>

                    <button
                        onClick={() => handleUpgrade(PRICE_MONTHLY)}
                        disabled={upgradeLoading !== null}
                        className="w-full bg-[var(--color-surface)] hover:bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold py-3 px-4 rounded-lg border border-[var(--color-accent)] transition-colors duration-150 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {upgradeLoading === PRICE_MONTHLY ? (
                            <>
                                <span className="w-4 h-4 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
                                Redirecionando...
                            </>
                        ) : (
                            <>Assinar Mensal — R$ 19,90/mês</>
                        )}
                    </button>
                </div>

                <p className="text-xs text-[var(--color-text-muted)] mb-3">
                    Economize 25% no plano anual
                </p>

                {/* Dismiss */}
                <button
                    onClick={onClose}
                    className="w-full text-[var(--color-text-muted)] hover:text-[var(--color-text-sec)] text-sm py-2 transition-colors duration-150"
                >
                    Voltar amanhã
                </button>
            </div>
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

// File metadata stored in-memory per message for display
interface FileAttachment {
    name: string;
    type: string; // "image" | "pdf"
    previewUrl?: string; // blob URL for image preview
}

interface ChatInterfaceProps {
    chatId: string | null;
    initialMessages: Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
    }>;
}

export function ChatInterface({ chatId: initialChatId, initialMessages }: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    // Track file attachments per message ID for display in bubbles
    const [messageAttachments, setMessageAttachments] = useState<Record<string, FileAttachment>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Keep a ref to the latest activeChatId so async callbacks always see the current value
    const activeChatIdRef = useRef(activeChatId);
    activeChatIdRef.current = activeChatId;

    // Convert initial messages to the format expected by useChat
    const formattedInitialMessages: UIMessage[] = initialMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text' as const, text: msg.content }],
    }));

    // AI SDK useChat hook — use a STABLE id so the hook never resets mid-conversation.
    // The id is only for client-side cache keying; the AI API route doesn't use it.
    const chatHookId = initialChatId || "new-chat";
    const { messages, setMessages, sendMessage, status } = useChat({
        id: chatHookId,
        onError: (error) => {
            if (error.message.includes('PAYWALL_LIMIT_REACHED')) {
                setShowPaywall(true);
            }
        },
    });

    // Set initial messages on mount (only for existing chats with history)
    useEffect(() => {
        if (formattedInitialMessages.length > 0 && messages.length === 0) {
            setMessages(formattedInitialMessages);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // When the component receives a new chatId prop (e.g. navigating to an existing chat), sync state
    useEffect(() => {
        setActiveChatId(initialChatId);
    }, [initialChatId]);

    // Save messages to Supabase after AI response completes
    const prevStatusRef = useRef(status);
    useEffect(() => {
        const currentChatId = activeChatIdRef.current;
        // When status transitions from streaming to ready, save the AI response
        if (prevStatusRef.current !== 'ready' && status === 'ready' && messages.length > 0 && currentChatId) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                // Save AI response to database
                fetch('/api/chat/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: currentChatId,
                        role: 'assistant',
                        content: getMessageText(lastMessage),
                    }),
                }).catch(err => console.error('[ChatInterface] Failed to save AI message:', err));
            }
        }
        prevStatusRef.current = status;
    }, [status, messages]);

    /**
     * Lazy Chat Creation: creates the chat row in Supabase only when the user
     * actually sends their first message. Returns the new chatId.
     */
    const ensureChatExists = useCallback(async (): Promise<string> => {
        // Always read from the ref — it's the source of truth
        if (activeChatIdRef.current) {
            return activeChatIdRef.current;
        }

        setIsCreatingChat(true);
        try {
            const res = await fetch('/api/chat/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('Failed to create chat');
            }

            const { id: newChatId } = await res.json();

            // Update BOTH the ref (immediate, for async code) and state (for re-renders)
            activeChatIdRef.current = newChatId;
            setActiveChatId(newChatId);

            // Silent URL update — uses the native History API so Next.js does NOT
            // trigger a navigation cycle (which would remount this component and
            // kill the active useChat stream).
            window.history.replaceState(null, '', `/chat/${newChatId}`);

            // Notify sidebar components to prepend this new chat to their list
            window.dispatchEvent(new CustomEvent('chat-created', {
                detail: { id: newChatId, title: 'Nova Conversa', updated_at: new Date().toISOString() },
            }));

            return newChatId;
        } finally {
            setIsCreatingChat(false);
        }
    }, []);

    /**
     * Handle file upload flow — sends FormData to /api/chat/upload
     * and manually processes the streaming response.
     */
    const handleFileUpload = useCallback(async (messageText: string, file: File, chatId: string) => {
        setIsUploading(true);

        // Create a temporary user message ID
        const userMsgId = `user-${Date.now()}`;

        // Track file attachment for display
        const isImage = file.type.startsWith("image/");
        let previewUrl: string | undefined;
        if (isImage) {
            // Convert to base64 data URL (persistent across renders, no blob leak)
            const buf = await file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
            );
            previewUrl = `data:${file.type};base64,${base64}`;
        }
        const attachment: FileAttachment = {
            name: file.name,
            type: isImage ? "image" : "pdf",
            previewUrl,
        };
        setMessageAttachments(prev => ({ ...prev, [userMsgId]: attachment }));

        // The display text for the user bubble (don't show extracted PDF text)
        const displayText = messageText || (isImage ? "📷 Imagem enviada" : `📄 ${file.name}`);

        // Add user message to the chat UI immediately
        const userMessage: UIMessage = {
            id: userMsgId,
            role: "user",
            parts: [{ type: "text" as const, text: displayText }],
        };
        setMessages(prev => [...prev, userMessage]);

        // Save user message to DB (fire-and-forget)
        fetch('/api/chat/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId,
                role: 'user',
                content: displayText,
            }),
        }).catch(err => console.error('[ChatInterface] Failed to save user message:', err));

        try {
            // Build FormData
            const formData = new FormData();
            formData.append("message", messageText);
            formData.append("file", file);
            formData.append("messages", JSON.stringify(messages));

            const response = await fetch("/api/chat/upload", {
                method: "POST",
                body: formData,
                // Do NOT set Content-Type — browser sets it with boundary
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));

                if (errorData.error === "PAYWALL_LIMIT_REACHED") {
                    setShowPaywall(true);
                    return;
                }

                // Show error as assistant message
                const errorMsg: UIMessage = {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    parts: [{ type: "text" as const, text: `⚠️ ${errorData.error || "Erro ao processar arquivo."}` }],
                };
                setMessages(prev => [...prev, errorMsg]);
                return;
            }

            // Read the streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            const assistantMsgId = `assistant-${Date.now()}`;
            let fullText = "";
            let lineBuffer = "";

            // Add empty assistant message that we'll stream into
            setMessages(prev => [
                ...prev,
                {
                    id: assistantMsgId,
                    role: "assistant" as const,
                    parts: [{ type: "text" as const, text: "" }],
                },
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Parse AI SDK UI stream protocol
                // Format: "type:data\n" — we look for text parts ("0:text\n")
                // Buffer partial lines across chunks to avoid splitting mid-JSON
                const lines = (lineBuffer + chunk).split("\n");
                // Last element may be incomplete — keep it for next chunk
                lineBuffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.trim()) continue;

                    // AI SDK UI message stream format: "0:string" for text deltas
                    if (line.startsWith("0:")) {
                        try {
                            const textDelta = JSON.parse(line.slice(2));
                            if (typeof textDelta === "string") {
                                fullText += textDelta;
                            }
                        } catch {
                            // Not valid JSON, skip
                        }
                    }
                }

                // Update the assistant message with accumulated text
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMsgId
                            ? {
                                ...msg,
                                parts: [{ type: "text" as const, text: fullText }],
                            }
                            : msg
                    )
                );
            }

            // Save assistant response to DB
            if (fullText) {
                fetch('/api/chat/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId,
                        role: 'assistant',
                        content: fullText,
                    }),
                }).catch(err => console.error('[ChatInterface] Failed to save AI message:', err));
            }
        } catch (err) {
            console.error("[ChatInterface] File upload error:", err);
            const errorMsg: UIMessage = {
                id: `error-${Date.now()}`,
                role: "assistant",
                parts: [{ type: "text" as const, text: "⚠️ Ocorreu um erro ao processar o arquivo. Tente novamente." }],
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsUploading(false);
        }
    }, [messages, setMessages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Capture & validate input immediately
        const trimmedInput = input.trim();
        const currentFile = selectedFile;

        if (!trimmedInput && !currentFile) return;
        if (status !== "ready" || isCreatingChat || showPaywall || isUploading) return;

        // 2. Clear input immediately for optimistic UX
        setInput("");
        setSelectedFile(null);

        try {
            // 3. Lazy creation: get the definitive chatId
            const chatId = await ensureChatExists();

            if (currentFile) {
                // ── File upload flow ─────────────────────────────────────
                await handleFileUpload(trimmedInput, currentFile, chatId);
            } else {
                // ── Normal text flow (unchanged) ─────────────────────────
                // Fire-and-forget: persist user message to Supabase
                fetch('/api/chat/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId,
                        role: 'user',
                        content: trimmedInput,
                    }),
                }).catch(err => console.error('[ChatInterface] Failed to save user message:', err));

                // Send to AI
                sendMessage({ text: trimmedInput });
            }
        } catch (err) {
            console.error('[ChatInterface] Failed to send message:', err);
            // Restore input on failure so the user doesn't lose their text
            setInput(trimmedInput);
        }
    };

    const isLoading = status !== "ready" || isCreatingChat || isUploading;

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
        <div className="flex-1 flex flex-col min-w-0 bg-background h-screen h-[100dvh]">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-8 scroll-smooth">
                <div className="max-w-3xl mx-auto">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
                            <div className="mb-6">
                                <OctopusIcon className="w-16 h-16 text-4xl" />
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-foreground mb-3 tracking-tight">
                                Olá, eu sou o Otto.
                            </h2>
                            <p className="text-muted-foreground max-w-md text-sm md:text-base font-sans leading-relaxed">
                                Seu explorador do conhecimento. Como posso ajudar você hoje?
                            </p>
                        </div>
                    )}

                    {/* Message bubbles */}
                    {messages.map((message) => {
                        const isUser = message.role === 'user';
                        const messageText = getMessageText(message);
                        const attachment = messageAttachments[message.id];

                        return (
                            <div
                                key={message.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
                            >
                                {!isUser && (
                                    <div className="mr-4 mt-1">
                                        <OctopusIcon className="w-8 h-8 text-lg rounded-full" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[95%] sm:max-w-[90%] md:max-w-[85%] relative ${isUser
                                        ? 'bg-card text-foreground rounded-2xl rounded-tr-sm px-5 py-3 border border-border'
                                        : 'text-foreground px-0 py-2'
                                        }`}
                                >
                                    {isUser ? (
                                        <div>
                                            {/* File attachment display */}
                                            {attachment && (
                                                <div className="mb-2">
                                                    {attachment.type === "image" && attachment.previewUrl ? (
                                                        <img
                                                            src={attachment.previewUrl}
                                                            alt="Imagem enviada"
                                                            className="rounded-lg max-w-[200px] max-h-[150px] object-cover border border-border"
                                                        />
                                                    ) : attachment.type === "pdf" ? (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
                                                            <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                                {attachment.name}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words font-sans">
                                                {messageText}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm prose-invert max-w-none prose-p:text-foreground prose-headings:font-serif prose-headings:text-foreground">
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
                    {status !== "ready" && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex justify-start mb-6">
                            <div className="mr-4">
                                <OctopusIcon className="w-8 h-8 text-lg rounded-full" />
                            </div>
                            <div className="px-0 py-2">
                                <div className="flex space-x-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-background px-4 pb-6 pt-2">
                <div className="max-w-3xl mx-auto">
                    <AstroChatInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onSubmit={handleSubmit}
                        onFileChange={setSelectedFile}
                        isLoading={isLoading || showPaywall}
                        placeholder={showPaywall ? "Limite diário atingido. Faça upgrade para continuar." : "Pergunte qualquer coisa..."}
                    />
                    <p className="text-center text-[10px] text-muted-foreground mt-3 font-sans">Otto pode cometer erros. Verifique informações importantes.</p>
                </div>
            </div>

            {/* Paywall Modal */}
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
        </div>
    );
}
