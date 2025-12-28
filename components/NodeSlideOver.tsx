'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, MessageSquare, FileText, Save, Trash2, Plus } from 'lucide-react';
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
        id: string;  // This IS the UUID
        label: string;
        chatId: string;  // Same as id (unified UUID)
    } | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void; // Callback to refresh graph after deletion
}

export default function NodeSlideOver({ node, isOpen, onClose, onDelete }: NodeSlideOverProps) {
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [noteGenerated, setNoteGenerated] = useState(false);

    // Load notes when node changes (using unified UUID: node.id)
    useEffect(() => {
        if (node) {
            setNotes(loadNote(node.id));
            setSaved(true);
            setShowDeleteConfirm(false);
            setNoteGenerated(false);
        }
    }, [node]);

    // Handle notes change
    const handleNotesChange = useCallback((value: string) => {
        setNotes(value);
        setSaved(false);
    }, []);

    // Save notes (using unified UUID)
    const handleSave = useCallback(() => {
        if (node) {
            saveNote(node.id, notes);
            setSaved(true);
        }
    }, [node, notes]);

    // Generate note from this node
    const handleGenerateNote = useCallback(() => {
        if (!node) return;

        const allNotes = loadNotes();
        const newNote: Note = {
            id: generateNoteId(),
            title: node.label,
            content: notes || `# ${node.label}\n\nNote generated from knowledge graph node.\n\nNode ID: ${node.id}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        saveNotes([newNote, ...allNotes]);
        setNoteGenerated(true);

        // Reset after 2 seconds
        setTimeout(() => setNoteGenerated(false), 2000);
    }, [node, notes]);

    // Delete node AND conversation (bidirectional)
    const handleDelete = useCallback(() => {
        if (node) {
            console.log('[NodeSlideOver] Deleting session:', node.id);
            deleteSession(node.id); // Deletes chat, notes, node, and phantom links
            setShowDeleteConfirm(false);
            onClose();
            onDelete?.(); // Refresh graph
        }
    }, [node, onClose, onDelete]);

    // Keyboard shortcut for save (Ctrl+S)
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

    // Handle escape key
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

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {node && (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <header className="flex items-center justify-between p-4 border-b border-border">
                            <div>
                                <h2 className="font-serif font-semibold text-lg text-foreground">{node.label}</h2>
                                <p className="text-muted-foreground text-xs mt-0.5">Node Details</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        {/* Content */}
                        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {/* Go to Conversation Button - using UUID */}
                                <Link
                                    href={`/chat?session=${node.id}`}
                                    onClick={onClose}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent-blue text-background font-medium hover:bg-accent-blue/90 transition-all shadow-sm"
                                >
                                    <MessageSquare size={18} />
                                    Go to Chat
                                </Link>

                                {/* Generate Note Button */}
                                <button
                                    onClick={handleGenerateNote}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm ${noteGenerated
                                            ? 'bg-accent-green text-background'
                                            : 'bg-accent-yellow text-background hover:bg-accent-yellow/90'
                                        }`}
                                >
                                    <Plus size={18} />
                                    {noteGenerated ? 'Note Created!' : 'Generate Note'}
                                </button>
                            </div>

                            {/* Notes Section */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText size={16} />
                                        <span className="text-sm font-medium">Personal Notes</span>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${saved
                                            ? 'bg-muted text-muted-foreground cursor-default'
                                            : 'bg-accent-green hover:bg-accent-green/90 text-background'
                                            }`}
                                    >
                                        <Save size={12} />
                                        {saved ? 'Saved' : 'Save'}
                                    </button>
                                </div>

                                <textarea
                                    value={notes}
                                    onChange={(e) => handleNotesChange(e.target.value)}
                                    onBlur={handleSave}
                                    placeholder="Write your study notes about this topic...

Use Markdown for formatting:
# Heading
- Bullet points
**Bold** and *italic*"
                                    className="flex-1 min-h-[200px] p-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-purple/50 resize-none font-mono text-sm leading-relaxed"
                                />

                                <p className="text-muted-foreground text-xs mt-2">
                                    Ctrl+S to save • ESC to close
                                </p>
                            </div>

                            {/* Delete Section */}
                            <div className="pt-4 border-t border-border">
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-sm"
                                    >
                                        <Trash2 size={16} />
                                        Delete Node & Conversation
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-destructive text-xs text-center">
                                            This will delete the node, conversation, and notes permanently.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
                                            >
                                                Confirm Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer with Node ID */}
                        <footer className="p-4 border-t border-border">
                            <div className="text-muted-foreground text-xs font-mono truncate">
                                ID: {node.id}
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </>
    );
}
