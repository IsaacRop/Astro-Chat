'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, MessageSquare, FileText, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { loadNote, saveNote, deleteSession } from '@/utils/storage';

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

    // Load notes when node changes (using unified UUID: node.id)
    useEffect(() => {
        if (node) {
            setNotes(loadNote(node.id));
            setSaved(true);
            setShowDeleteConfirm(false);
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
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {node && (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <div>
                                <h2 className="font-semibold text-lg text-gray-100">{node.label}</h2>
                                <p className="text-zinc-500 text-xs mt-0.5">Node Details</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        {/* Content */}
                        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
                            {/* Go to Conversation Button - using UUID */}
                            <Link
                                href={`/?session=${node.id}`}
                                onClick={onClose}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:from-indigo-500 hover:to-blue-500 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <MessageSquare size={18} />
                                Go to Conversation
                            </Link>

                            {/* Notes Section */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <FileText size={16} />
                                        <span className="text-sm font-medium">Personal Notes</span>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${saved
                                            ? 'bg-zinc-800 text-zinc-500 cursor-default'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
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
                                    className="flex-1 min-h-[200px] p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-gray-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none font-mono text-sm leading-relaxed"
                                />

                                <p className="text-zinc-600 text-xs mt-2">
                                    Ctrl+S to save • ESC to close
                                </p>
                            </div>

                            {/* Delete Section */}
                            <div className="pt-4 border-t border-zinc-800">
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-600/30 text-red-400 hover:bg-red-600/10 transition-colors text-sm"
                                    >
                                        <Trash2 size={16} />
                                        Delete Node & Conversation
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-red-400 text-xs text-center">
                                            This will delete the node, conversation, and notes permanently.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-sm font-medium"
                                            >
                                                Confirm Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer with Node ID */}
                        <footer className="p-4 border-t border-zinc-800">
                            <div className="text-zinc-600 text-xs font-mono truncate">
                                ID: {node.id}
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </>
    );
}
