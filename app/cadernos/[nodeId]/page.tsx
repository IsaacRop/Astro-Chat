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
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-zinc-400 mb-4">
                        Nó não encontrado
                    </h1>
                    <p className="text-zinc-600 mb-6">
                        Este nó não existe no seu grafo de conhecimento.
                    </p>
                    <Link
                        href="/cadernos"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
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
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-zinc-500">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-gray-200">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <Link
                        href="/cadernos"
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-semibold text-lg">{node.label}</h1>
                        <p className="text-zinc-500 text-xs">Personal Notes</p>
                    </div>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                    <MessageSquare size={16} />
                    Go to Chat
                </Link>
            </header>

            {/* Notes Editor */}
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <FileText size={18} />
                        <span className="text-sm font-medium">Personal Notes</span>
                    </div>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${saved
                            ? 'bg-zinc-800 text-zinc-500 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
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
                    className="w-full h-[calc(100vh-250px)] p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none font-mono text-sm leading-relaxed"
                />

                <p className="text-zinc-600 text-xs mt-2">
                    Tip: Press Ctrl+S to save • Markdown supported • Auto-saves on blur
                </p>
            </div>
        </div>
    );
}
