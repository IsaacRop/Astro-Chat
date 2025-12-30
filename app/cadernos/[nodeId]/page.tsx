'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageSquare, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import { getNodeById, getNote, saveNote } from '@/lib/knowledge-graph';

interface NodeData {
    id: string;
    label: string;
    chatId: string;
}

export default function NodeDetailPage({
    params
}: {
    params: Promise<{ nodeId: string }>
}) {
    const { nodeId } = use(params);
    const [node, setNode] = useState<NodeData | null>(null);
    const [notes, setNotes] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [saved, setSaved] = useState(true);

    // Load node and notes on mount
    useEffect(() => {
        const foundNode = getNodeById(nodeId);
        if (foundNode) {
            setNode({
                id: foundNode.id,
                label: foundNode.label,
                chatId: foundNode.chatId
            });
            setNotes(getNote(nodeId));
        } else {
            setNotFound(true);
        }
    }, [nodeId]);

    // Handle notes change
    const handleNotesChange = useCallback((value: string) => {
        setNotes(value);
        setSaved(false);
    }, []);

    // Save notes
    const handleSave = useCallback(() => {
        saveNote(nodeId, notes);
        setSaved(true);
    }, [nodeId, notes]);

    // Keyboard shortcut for save (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // 404 State
    if (notFound) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-xl md:text-2xl font-bold text-muted-foreground mb-4">
                        Nó não encontrado
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-6">
                        Este nó não existe no seu grafo de conhecimento.
                    </p>
                    <Link
                        href="/cadernos"
                        className="text-accent-purple hover:text-accent-purple/80 transition-colors"
                    >
                        ← Voltar para Cadernos
                    </Link>
                </div>
            </div>
        );
    }

    // Loading State
    if (!node) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
            {/* Header - Responsive */}
            <header className="flex items-center justify-between p-3 md:p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Link
                        href="/cadernos"
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-semibold text-base md:text-lg truncate">{node.label}</h1>
                        <p className="text-muted-foreground text-xs">Personal Notes</p>
                    </div>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/80 text-background text-xs md:text-sm font-medium transition-colors flex-shrink-0"
                >
                    <MessageSquare size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Go to Chat</span>
                    <span className="sm:hidden">Chat</span>
                </Link>
            </header>

            {/* Notes Editor - Responsive */}
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText size={18} />
                        <span className="text-sm font-medium">Personal Notes</span>
                    </div>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${saved
                            ? 'bg-muted text-muted-foreground cursor-default'
                            : 'bg-accent-green hover:bg-accent-green/80 text-background'
                            }`}
                    >
                        <Save size={14} />
                        {saved ? 'Saved' : 'Save'}
                    </button>
                </div>

                <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Write your study notes about this topic using Markdown...

# Example Heading
- Bullet point 1
- Bullet point 2

**Bold text** and *italic text*

```code block```"
                    className="w-full h-[calc(100vh-250px)] min-h-[300px] p-4 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-purple/50 focus:border-accent-purple/50 resize-none font-mono text-sm leading-relaxed"
                />

                <p className="text-muted-foreground text-xs mt-2">
                    Tip: Press Ctrl+S to save • Markdown supported • Auto-saves on blur
                </p>
            </div>
        </div>
    );
}
