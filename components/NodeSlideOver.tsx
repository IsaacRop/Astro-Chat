'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, MessageSquare, FileText, Trash2, Plus, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { loadNote, saveNote, deleteSession } from '@/utils/storage';

// Notes storage helpers
const NOTES_STORAGE_KEY = "astro-notes";

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

function loadNotes(): Note[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(NOTES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveNotes(notes: Note[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function generateNoteId(): string {
    return `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface NodeSlideOverProps {
    node: {
        id: string;
        label: string;
        chatId: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
}

type SaveStatus = 'saved' | 'unsaved' | 'saving';

export default function NodeSlideOver({ node, isOpen, onClose, onDelete }: NodeSlideOverProps) {
    const [notes, setNotes] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [noteGenerated, setNoteGenerated] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load notes when node changes
    useEffect(() => {
        if (node) {
            setNotes(loadNote(node.id));
            setSaveStatus('saved');
            setShowDeleteConfirm(false);
            setNoteGenerated(false);
        }
    }, [node]);

    const handleNotesChange = useCallback((value: string) => {
        setNotes(value);
        setSaveStatus('unsaved');

        // Auto-save with debounce
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            if (node) {
                setIsSaving(true);
                setSaveStatus('saving');
                // Small delay for visual feedback
                setTimeout(() => {
                    saveNote(node.id, value);
                    setIsSaving(false);
                    setSaveStatus('saved');
                }, 300);
            }
        }, 1000); // Auto-save after 1 second of inactivity
    }, [node]);

    const handleSave = useCallback(() => {
        if (node && !isSaving) {
            setIsSaving(true);
            setSaveStatus('saving');

            // Small delay for visual feedback
            setTimeout(() => {
                saveNote(node.id, notes);
                setIsSaving(false);
                setSaveStatus('saved');
            }, 300);
        }
    }, [node, notes, isSaving]);

    const handleGenerateNote = useCallback(() => {
        if (!node) return;

        const allNotes = loadNotes();
        const newNote: Note = {
            id: generateNoteId(),
            title: node.label,
            content: notes || `# ${node.label}\n\nNota gerada a partir do nó do grafo.\n\nID do Nó: ${node.id}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        saveNotes([newNote, ...allNotes]);
        setNoteGenerated(true);
        setTimeout(() => setNoteGenerated(false), 2000);
    }, [node, notes]);

    const handleDelete = useCallback(() => {
        if (node) {
            deleteSession(node.id);
            setShowDeleteConfirm(false);
            onClose();
            onDelete?.();
        }
    }, [node, onClose, onDelete]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && isOpen) {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (showDeleteConfirm) {
                    setShowDeleteConfirm(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, showDeleteConfirm]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Status indicator component
    const StatusIndicator = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Salvando...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-1.5 text-accent-green text-xs">
                        <Check size={12} />
                        <span>Salvo</span>
                    </div>
                );
            case 'unsaved':
                return (
                    <div className="flex items-center gap-1.5 text-accent-yellow text-xs">
                        <span className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse" />
                        <span>Não salvo</span>
                    </div>
                );
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Slide-over Panel - Full width on mobile, max-w-md on desktop */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[90%] sm:max-w-md bg-card border-l border-border z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {node && (
                    <div className="flex flex-col h-full">
                        {/* Header - Glassmorphism Effect */}
                        <header className="flex items-center justify-between p-3 md:p-4 border-b border-border/50 bg-background/60 backdrop-blur-xl sticky top-0 z-10">
                            <div className="min-w-0 flex-1">
                                <h2 className="font-serif font-semibold text-base md:text-lg text-foreground truncate">{node.label}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-muted-foreground text-xs">Detalhes do Nó</p>
                                    <StatusIndicator />
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-2"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        {/* Content */}
                        <div className="flex-1 flex flex-col p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto">
                            {/* Action Buttons - Stack on very small screens */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Link
                                    href={`/chat?session=${node.id}&chatId=${node.chatId}`}
                                    onClick={onClose}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-3.5 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-accent-blue/25 text-sm"
                                >
                                    <MessageSquare size={18} />
                                    Ir para o Chat
                                </Link>

                                <button
                                    onClick={handleGenerateNote}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-lg font-medium transition-all shadow-sm text-sm ${noteGenerated
                                        ? 'bg-accent-green text-background'
                                        : 'bg-accent-yellow text-background hover:bg-accent-yellow/90'
                                        }`}
                                >
                                    <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                                    {noteGenerated ? 'Criado!' : 'Gerar Nota'}
                                </button>
                            </div>

                            {/* Editor Section - Card Container with Glassmorphism */}
                            <div className="flex-1 flex flex-col bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
                                {/* Editor Toolbar */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText size={14} />
                                        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">Editor Markdown</span>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/70">
                                        <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">Ctrl</kbd>
                                        <span className="text-[10px]">+</span>
                                        <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">S</kbd>
                                        <span className="text-[10px] ml-1">para salvar</span>
                                    </div>
                                </div>

                                {/* Textarea - Clean Sheet Style */}
                                <textarea
                                    value={notes}
                                    onChange={(e) => handleNotesChange(e.target.value)}
                                    onBlur={handleSave}
                                    placeholder="Escreva suas notas de estudo sobre este tópico...

Use Markdown para formatação:
- **negrito** e *itálico*
- # Títulos
- - Listas
- \`código\`"
                                    className="flex-1 min-h-[200px] md:min-h-[280px] p-4 md:p-5 bg-transparent text-foreground placeholder-muted-foreground/60 focus:outline-none resize-none font-sans text-sm md:text-base leading-7 tracking-wide"
                                    style={{ lineHeight: '1.8' }}
                                />
                            </div>

                            {/* Mobile hint */}
                            <p className="text-muted-foreground text-[10px] md:text-xs text-center sm:hidden">
                                Salva automaticamente • Toque fora para fechar
                            </p>

                            {/* Delete Section */}
                            <div className="pt-3 md:pt-4 border-t border-border">
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-xs md:text-sm"
                                    >
                                        <Trash2 size={14} className="md:w-4 md:h-4" />
                                        Excluir Nó e Chat
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-destructive text-[10px] md:text-xs text-center">
                                            Isso excluirá tudo permanentemente.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-xs md:text-sm"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-xs md:text-sm font-medium"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="p-3 md:p-4 border-t border-border bg-background/40 backdrop-blur-sm">
                            <div className="text-muted-foreground text-[10px] md:text-xs font-mono truncate">
                                ID: {node.id}
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </>
    );
}
