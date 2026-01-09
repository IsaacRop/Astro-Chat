"use client";

import { Header } from "@/components/Header";
import { FileText, Plus, X, Trash2, Save, Bold, Italic, List, Heading } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// TYPES & STORAGE
// ============================================

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

const NOTES_STORAGE_KEY = "astro-notes";

function generateNoteId(): string {
    return `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

// ============================================
// COMPONENT
// ============================================

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");

    // Load notes on mount
    useEffect(() => {
        setIsClient(true);
        setNotes(loadNotes());
    }, []);

    // Persist notes whenever they change
    useEffect(() => {
        if (isClient && notes.length >= 0) {
            saveNotes(notes);
        }
    }, [notes, isClient]);

    // Create new note
    const handleCreate = useCallback(() => {
        if (!formTitle.trim()) return;

        const newNote: Note = {
            id: generateNoteId(),
            title: formTitle.trim(),
            content: formContent.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        setNotes((prev) => [newNote, ...prev]);
        setFormTitle("");
        setFormContent("");
        setIsCreating(false);
    }, [formTitle, formContent]);

    // Update existing note
    const handleUpdate = useCallback(() => {
        if (!editingNote || !formTitle.trim()) return;

        setNotes((prev) =>
            prev.map((note) =>
                note.id === editingNote.id
                    ? { ...note, title: formTitle.trim(), content: formContent.trim(), updatedAt: Date.now() }
                    : note
            )
        );

        setEditingNote(null);
        setFormTitle("");
        setFormContent("");
    }, [editingNote, formTitle, formContent]);

    // Delete note
    const handleDelete = useCallback((id: string) => {
        setNotes((prev) => prev.filter((note) => note.id !== id));
        if (editingNote?.id === id) {
            setEditingNote(null);
            setFormTitle("");
            setFormContent("");
        }
    }, [editingNote]);

    // Open edit modal
    const openEdit = (note: Note) => {
        setEditingNote(note);
        setFormTitle(note.title);
        setFormContent(note.content);
        setIsCreating(false);
    };

    // Open create modal
    const openCreate = () => {
        setIsCreating(true);
        setEditingNote(null);
        setFormTitle("");
        setFormContent("");
    };

    // Close modal
    const closeModal = () => {
        setIsCreating(false);
        setEditingNote(null);
        setFormTitle("");
        setFormContent("");
    };

    // Format helpers
    const insertFormat = (format: string) => {
        const textarea = document.getElementById("note-content") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formContent;
        const selectedText = text.substring(start, end);

        let newText = "";
        let cursorOffset = 0;

        switch (format) {
            case "bold":
                newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
                cursorOffset = selectedText ? 0 : 2;
                break;
            case "italic":
                newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
                cursorOffset = selectedText ? 0 : 1;
                break;
            case "heading":
                newText = text.substring(0, start) + `## ${selectedText}` + text.substring(end);
                cursorOffset = 3;
                break;
            case "list":
                newText = text.substring(0, start) + `\n- ${selectedText}` + text.substring(end);
                cursorOffset = 3;
                break;
            default:
                return;
        }

        setFormContent(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }, 0);
    };

    const isModalOpen = isCreating || editingNote !== null;

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col overflow-x-hidden">
            <Header title="Notas" />

            <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Actions */}
                <div className="flex justify-end">
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-all shadow-sm ring-1 ring-white/10"
                    >
                        <Plus size={18} strokeWidth={1.5} />
                        <span className="hidden sm:inline">Nova Nota</span>
                        <span className="sm:hidden">Nova</span>
                    </button>
                </div>

                {/* Empty State */}
                {isClient && notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#1A1A1C] border border-white/[0.05] flex items-center justify-center mb-6">
                            <FileText size={32} className="md:w-10 md:h-10 text-zinc-500" strokeWidth={1.2} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif font-medium text-zinc-200 mb-3">Nenhuma nota ainda</h2>
                        <p className="text-zinc-500 max-w-sm text-sm md:text-base font-sans leading-relaxed">
                            Clique no botão "Nova Nota" para criar seu primeiro pensamento.
                        </p>
                    </div>
                )}

                {/* Notes Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-5 md:p-6 hover:border-white/[0.1] transition-all cursor-pointer group relative flex flex-col h-[280px]"
                            onClick={() => openEdit(note)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-white/[0.03] text-zinc-400 group-hover:text-zinc-200 transition-colors border border-white/[0.02]">
                                    <FileText size={18} className="md:w-5 md:h-5" strokeWidth={1.5} />
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
                                    {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <h3 className="font-serif font-medium text-lg md:text-xl text-zinc-200 mb-3 line-clamp-2 leading-tight">
                                {note.title}
                            </h3>
                            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-4 font-sans flex-1">
                                {note.content || "Sem conteúdo"}
                            </p>

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(note.id);
                                }}
                                className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Full-Page Editor Modal - Responsive */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#0C0C0D]/95 backdrop-blur-xl z-50 flex flex-col"
                    >
                        {/* Editor Header - Responsive */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/[0.05] bg-[#0C0C0D]">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-xl hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
                                >
                                    <X size={20} strokeWidth={1.5} />
                                </button>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Título da nota..."
                                    className="text-xl md:text-3xl font-serif font-medium bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-700 flex-1 min-w-0"
                                />
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 pl-4">
                                <button
                                    onClick={closeModal}
                                    className="hidden sm:block px-4 py-2 rounded-xl border border-white/[0.05] text-zinc-400 text-sm hover:bg-white/[0.03] hover:text-zinc-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={isCreating ? handleCreate : handleUpdate}
                                    disabled={!formTitle.trim()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={16} strokeWidth={1.5} />
                                    <span className="hidden sm:inline">{isCreating ? "Criar" : "Salvar"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Formatting Toolbar - Responsive */}
                        <div className="flex items-center gap-1 p-2 px-4 md:px-8 border-b border-white/[0.05] bg-[#0C0C0D] overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => insertFormat("bold")}
                                className="p-2 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
                                title="Negrito"
                            >
                                <Bold size={18} strokeWidth={1.5} />
                            </button>
                            <button
                                onClick={() => insertFormat("italic")}
                                className="p-2 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
                                title="Itálico"
                            >
                                <Italic size={18} strokeWidth={1.5} />
                            </button>
                            <button
                                onClick={() => insertFormat("heading")}
                                className="p-2 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
                                title="Título"
                            >
                                <Heading size={18} strokeWidth={1.5} />
                            </button>
                            <button
                                onClick={() => insertFormat("list")}
                                className="p-2 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
                                title="Lista"
                            >
                                <List size={18} strokeWidth={1.5} />
                            </button>
                            <div className="h-4 w-px bg-white/[0.05] mx-2 flex-shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium whitespace-nowrap">Markdown Suportado</span>
                        </div>

                        {/* Content Editor */}
                        <div className="flex-1 p-4 md:p-8 overflow-hidden bg-[#0C0C0D]">
                            <div className="max-w-3xl mx-auto h-full">
                                <textarea
                                    id="note-content"
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="Comece a escrever..."
                                    className="w-full h-full resize-none bg-transparent border-none outline-none text-zinc-300 placeholder-zinc-800 text-base md:text-lg leading-relaxed font-sans selection:bg-zinc-800 selection:text-zinc-100"
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
