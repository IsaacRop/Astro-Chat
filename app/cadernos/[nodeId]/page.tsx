'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageSquare, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import { getChatById, getNote, saveNote, createNote } from '@/app/actions/study';

// Lightweight pointer stored in localStorage: chatId → Supabase noteId
// Only stores a UUID reference, no content
const NOTE_PTR_PREFIX = 'teo-caderno-note-';

interface NodeData {
    id: string;
    label: string;
}

export default function NodeDetailPage({
    params
}: {
    params: Promise<{ nodeId: string }>
}) {
    const { nodeId } = use(params);
    const [node, setNode] = useState<NodeData | null>(null);
    const [noteId, setNoteId] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        async function load() {
            const chat = await getChatById(nodeId);
            if (!chat) {
                setNotFound(true);
                return;
            }
            setNode({ id: chat.id, label: chat.title || 'Sem título' });

            // Resolve the Supabase noteId from the lightweight localStorage pointer
            const storedNoteId = typeof window !== 'undefined'
                ? localStorage.getItem(NOTE_PTR_PREFIX + nodeId)
                : null;

            if (storedNoteId) {
                const existing = await getNote(storedNoteId);
                if (existing) {
                    setNoteId(existing.id);
                    setNotes(existing.content);
                }
            }
        }
        load();
    }, [nodeId]);

    const handleNotesChange = useCallback((value: string) => {
        setNotes(value);
        setSaved(false);
    }, []);

    const handleSave = useCallback(async () => {
        if (!node) return;
        try {
            if (noteId) {
                await saveNote(noteId, node.label, notes);
            } else {
                // First save: create a new note and persist the pointer
                const result = await createNote(node.label);
                if (result) {
                    localStorage.setItem(NOTE_PTR_PREFIX + nodeId, result.id);
                    setNoteId(result.id);
                    await saveNote(result.id, node.label, notes);
                }
            }
            setSaved(true);
        } catch (e) {
            console.error('[NodeDetailPage] Failed to save note:', e);
        }
    }, [node, noteId, nodeId, notes]);

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
                        className="inline-flex items-center gap-1.5 px-4 py-3 min-h-[44px] rounded-lg text-accent-purple hover:text-accent-purple/80 hover:bg-muted transition-colors text-sm font-medium"
                    >
                        ← Voltar para Cadernos
                    </Link>
                </div>
            </div>
        );
    }

    if (!node) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
            <header className="flex items-center justify-between p-3 md:p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Link
                        href="/cadernos"
                        className="p-2.5 min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-semibold text-base md:text-lg truncate">{node.label}</h1>
                        <p className="text-muted-foreground text-xs">Notas Pessoais</p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/chat/${node.id}`}
                    className="flex items-center gap-1 md:gap-2 px-3 py-3 min-h-[44px] rounded-lg bg-primary hover:bg-primary/80 text-background text-xs md:text-sm font-medium transition-colors flex-shrink-0"
                >
                    <MessageSquare size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Ir para o Chat</span>
                    <span className="sm:hidden">Chat</span>
                </Link>
            </header>

            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <FileText size={18} className="flex-shrink-0" />
                        <span className="text-sm font-medium truncate">Notas Pessoais</span>
                    </div>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg text-sm transition-colors flex-shrink-0 ${saved
                            ? 'bg-muted text-muted-foreground cursor-default'
                            : 'bg-accent-green hover:bg-accent-green/80 text-background'
                            }`}
                    >
                        <Save size={14} />
                        {saved ? 'Salvo' : 'Salvar'}
                    </button>
                </div>

                <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Escreva suas notas de estudo usando Markdown...

# Exemplo de Título
- Item 1
- Item 2

**Texto em negrito** e *texto em itálico*"
                    className="w-full min-h-[300px] md:h-[calc(100vh-250px)] p-4 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none font-mono text-sm leading-relaxed"
                />

                <p className="text-muted-foreground text-xs mt-2">
                    Dica: Ctrl+S para salvar • Suporta Markdown • Salva automaticamente
                </p>
            </div>
        </div>
    );
}
