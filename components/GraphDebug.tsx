'use client';

import { useState, useCallback, useRef, useEffect, useId } from 'react';
import {
    generateUUID,
    addNode,
    loadGraph,
    saveGraph,
    inspectAllIDs,
    getAllChats
} from '@/utils/storage';
import { Beaker, Trash2, Loader2, Search, RefreshCw } from 'lucide-react';

// Mock conversation data for testing
const MOCK_MATH_CONVERSATION = [
    { role: 'user', content: 'Explique logaritmos para mim' },
    { role: 'assistant', content: 'Logaritmo é a operação inversa da exponenciação...' },
];

const MOCK_MATH_CONVERSATION_2 = [
    { role: 'user', content: 'Como resolver equações logarítmicas?' },
    { role: 'assistant', content: 'Para resolver equações logarítmicas, use as propriedades...' },
];

const MOCK_PHYSICS_CONVERSATION = [
    { role: 'user', content: 'O que é cinemática?' },
    { role: 'assistant', content: 'Cinemática é o ramo da física que estuda o movimento...' },
];

const MOCK_BIOLOGY_CONVERSATION = [
    { role: 'user', content: 'Explique mitose' },
    { role: 'assistant', content: 'Mitose é o processo de divisão celular...' },
];

interface GraphDebugProps {
    onGraphUpdate: () => void;
}

export default function GraphDebug({ onGraphUpdate }: GraphDebugProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const uniqueId = useId();

    const addLog = (message: string) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Simulate a class with unified UUID
    const simulateClass = useCallback(
        async (name: string, conversation: typeof MOCK_MATH_CONVERSATION) => {
            setLoading(name);
            addLog(`Starting simulation: ${name}`);

            try {
                // Generate unified UUID
                const uuid = generateUUID();
                addLog(`✓ UUID generated: ${uuid.substring(0, 8)}...`);

                // Call the API to extract topic and generate embedding
                addLog('Calling /api/graph/process...');
                const response = await fetch('/api/graph/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: conversation }),
                });

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const { label, embedding } = await response.json();
                addLog(`✓ Topic extracted: "${label}"`);
                addLog(`✓ Embedding Generated - dimension: ${embedding.length}`);

                // Add to knowledge graph with unified UUID (node.id === uuid)
                addLog('Adding to knowledge graph...');
                addNode(uuid, label, embedding);

                const graph = loadGraph();
                addLog(`✓ Graph updated: ${graph.nodes.length} nodes, ${graph.links.length} links`);

                // Trigger graph refresh
                onGraphUpdate();
                addLog('✓ Visualization refreshed');
            } catch (error) {
                addLog(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                console.error('Simulation error:', error);
            } finally {
                setLoading(null);
            }
        },
        [onGraphUpdate]
    );

    // Clear graph
    const handleClearGraph = () => {
        const graph = loadGraph();
        graph.nodes = [];
        graph.links = [];
        saveGraph(graph);
        addLog('✓ Graph cleared');
        onGraphUpdate();
    };

    // QA Feature: Inspect all IDs
    const handleInspectIDs = () => {
        const ids = inspectAllIDs();
        addLog('--- Inspect All IDs ---');
        addLog(`Chats: ${ids.chats.length} total`);
        ids.chats.forEach(id => addLog(`  Chat: ${id.substring(0, 8)}...`));
        addLog(`Nodes: ${ids.nodes.length} total`);
        ids.nodes.forEach(id => addLog(`  Node: ${id.substring(0, 8)}...`));
        addLog(`Notes: ${ids.notes.length} total`);
        ids.notes.forEach(id => addLog(`  Note: ${id.substring(0, 8)}...`));

        // Log to console for easy access
        console.log('[QA] All IDs:', ids);
    };

    // QA Feature: Force sync missing nodes
    const handleForceSync = async () => {
        setLoading('sync');
        addLog('--- Force Graph Sync ---');

        const chats = getAllChats();
        const graph = loadGraph();
        const nodeUUIDs = new Set(graph.nodes.map(n => n.id));

        let created = 0;
        for (const chat of chats) {
            if (!nodeUUIDs.has(chat.uuid)) {
                addLog(`Missing node for chat: ${chat.uuid.substring(0, 8)}...`);
                // Would need to call API to get embedding - for now just log
                addLog(`  → Would create node for: ${chat.title}`);
                created++;
            }
        }

        if (created === 0) {
            addLog('✓ All chats have corresponding nodes');
        } else {
            addLog(`⚠ Found ${created} chats without nodes`);
        }

        setLoading(null);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-gray-200">
                <Beaker size={18} className="text-emerald-400" />
                <h3 className="font-semibold text-sm">Graph Debug Panel</h3>
            </div>

            {/* Simulation Buttons */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => simulateClass('Math 1', MOCK_MATH_CONVERSATION)}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                >
                    {loading === 'Math 1' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Math: Logarithms
                </button>

                <button
                    onClick={() => simulateClass('Math 2', MOCK_MATH_CONVERSATION_2)}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                >
                    {loading === 'Math 2' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Math: Log Equations
                </button>

                <button
                    onClick={() => simulateClass('Physics', MOCK_PHYSICS_CONVERSATION)}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                >
                    {loading === 'Physics' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Physics: Kinematics
                </button>

                <button
                    onClick={() => simulateClass('Biology', MOCK_BIOLOGY_CONVERSATION)}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                >
                    {loading === 'Biology' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Biology: Mitosis
                </button>
            </div>

            {/* QA Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <button
                    onClick={handleInspectIDs}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-amber-400 text-xs font-medium rounded-lg transition-colors"
                >
                    <Search size={14} />
                    Inspect IDs
                </button>

                <button
                    onClick={handleForceSync}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/50 text-cyan-400 text-xs font-medium rounded-lg transition-colors"
                >
                    {loading === 'sync' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Force Sync
                </button>
            </div>

            {/* Clear Button */}
            <button
                onClick={handleClearGraph}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 text-xs font-medium rounded-lg transition-colors"
            >
                <Trash2 size={14} />
                Clear Graph
            </button>

            {/* Console Logs */}
            <div className="bg-black rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs">
                <div className="text-zinc-500 mb-2">Console Output:</div>
                {logs.length === 0 ? (
                    <div className="text-zinc-600 italic">Click a button to simulate...</div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={`${uniqueId}-${index}`}
                            className={`py-0.5 ${log.includes('✓')
                                ? 'text-emerald-400'
                                : log.includes('✗')
                                    ? 'text-red-400'
                                    : log.includes('⚠')
                                        ? 'text-amber-400'
                                        : 'text-zinc-400'
                                }`}
                        >
                            {log}
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
