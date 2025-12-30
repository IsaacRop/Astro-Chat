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
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Notes" backLink="/" />

            <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4 md:space-y-6">
                {/* Actions */}
                <div className="flex justify-end">
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-accent-yellow/90 text-background text-sm font-bold hover:bg-accent-yellow transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Note</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>

                {/* Empty State */}
                {isClient && notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent-yellow/10 flex items-center justify-center mb-4">
                            <FileText size={32} className="md:w-10 md:h-10 text-accent-yellow" />
                        </div>
                        <h2 className="text-lg md:text-xl font-serif font-bold mb-2">No Notes Yet</h2>
                        <p className="text-muted-foreground max-w-sm text-sm md:text-base">
                            Click the &quot;New Note&quot; button to create your first note.
                        </p>
                    </div>
                )}

                {/* Notes Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-lg hover:border-accent-yellow/50 transition-all cursor-pointer group relative"
                            onClick={() => openEdit(note)}
                        >
                            <div className="flex items-start justify-between mb-3 md:mb-4">
                                <div className="p-2 rounded-lg bg-accent-yellow/10 text-accent-yellow group-hover:bg-accent-yellow group-hover:text-background transition-colors">
                                    <FileText size={18} className="md:w-5 md:h-5" />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-serif font-bold text-base md:text-lg mb-2 group-hover:text-accent-yellow transition-colors truncate">
                                {note.title}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-3">
                                {note.content || "No content"}
                            </p>

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(note.id);
                                }}
                                className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 size={16} />
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
                        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col"
                    >
                        {/* Editor Header - Responsive */}
                        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur-sm gap-2">
                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Note title..."
                                    className="text-lg md:text-2xl font-serif font-bold bg-transparent border-none outline-none text-foreground placeholder-muted-foreground flex-1 min-w-0"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={closeModal}
                                    className="hidden sm:block px-3 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={isCreating ? handleCreate : handleUpdate}
                                    disabled={!formTitle.trim()}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-yellow/90 text-background text-sm font-medium hover:bg-accent-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={16} />
                                    <span className="hidden sm:inline">{isCreating ? "Create" : "Save"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Formatting Toolbar - Responsive */}
                        <div className="flex items-center gap-1 p-2 px-4 md:px-6 border-b border-border bg-card/30 overflow-x-auto">
                            <button
                                onClick={() => insertFormat("bold")}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title="Bold"
                            >
                                <Bold size={18} />
                            </button>
                            <button
                                onClick={() => insertFormat("italic")}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title="Italic"
                            >
                                <Italic size={18} />
                            </button>
                            <button
                                onClick={() => insertFormat("heading")}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title="Heading"
                            >
                                <Heading size={18} />
                            </button>
                            <button
                                onClick={() => insertFormat("list")}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title="Bullet List"
                            >
                                <List size={18} />
                            </button>
                            <div className="h-6 w-px bg-border mx-2 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Markdown</span>
                        </div>

                        {/* Content Editor */}
                        <div className="flex-1 p-4 md:p-6 overflow-hidden">
                            <div className="max-w-4xl mx-auto h-full">
                                <textarea
                                    id="note-content"
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="Start writing your note..."
                                    className="w-full h-full resize-none bg-transparent border-none outline-none text-foreground placeholder-muted-foreground text-base md:text-lg leading-relaxed font-sans"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
