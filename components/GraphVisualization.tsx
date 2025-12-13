'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { loadGraph, GRAPH_STORAGE_KEY } from '@/utils/storage';
import { Network, AlertCircle, Bug, X } from 'lucide-react';
import GraphDebug from '@/components/GraphDebug';
import NodeSlideOver from '@/components/NodeSlideOver';

// Node type for the graph
interface GraphNode {
    id: string;
    label: string;
    chatId: string;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
}

export default function GraphVisualization() {
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
        nodes: [],
        links: [],
    });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [renderError, setRenderError] = useState<string | null>(null);
    const [useListView, setUseListView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Slide-over state
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [slideOverOpen, setSlideOverOpen] = useState(false);

    // Debug panel state (hidden by default)
    const [debugOpen, setDebugOpen] = useState(false);

    // Load graph data - memoize the loading logic
    const loadGraphData = useCallback(() => {
        try {
            const graph = loadGraph();
            // Transform for react-force-graph
            const data = {
                nodes: graph.nodes.map(n => ({
                    id: n.id,
                    label: n.label,
                    chatId: n.id, // With unified UUID, node.id === chatId
                })),
                links: graph.links.map(l => ({
                    source: l.source,
                    target: l.target,
                })),
            };
            setGraphData(data);
            setRenderError(null);
        } catch (e) {
            console.error('[GraphVisualization] Error loading graph data:', e);
            setRenderError('Failed to load graph data');
        }
    }, []);

    // Load on mount
    useEffect(() => {
        loadGraphData();
    }, [loadGraphData]);

    // Cross-tab sync: listen for storage changes (Fix 3)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === GRAPH_STORAGE_KEY) {
                console.log('[GraphVisualization] Cross-tab sync: Graph updated in another tab');
                loadGraphData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadGraphData]);

    // Handle resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Memoize graph data to prevent unnecessary re-renders
    const stableGraphData = useMemo(() => ({
        nodes: graphData.nodes.map(n => ({ ...n })),
        links: graphData.links.map(l => ({ ...l })),
    }), [graphData]);

    // Handle node click - open slide-over instead of redirect
    const handleNodeClick = useCallback((node: GraphNode) => {
        console.log('[Graph] Node clicked:', node.label, '| chatId:', node.chatId);
        setSelectedNode(node);
        setSlideOverOpen(true);
    }, []);

    // Close slide-over
    const handleCloseSlideOver = useCallback(() => {
        setSlideOverOpen(false);
    }, []);

    // Render list view
    const renderListView = () => (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-200">
                    Knowledge Graph ({graphData.nodes.length} nodes, {graphData.links.length} links)
                </h2>
                <button
                    onClick={() => setUseListView(false)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                >
                    Try Graph View
                </button>
            </div>
            <div className="space-y-2">
                {graphData.nodes.map(node => (
                    <div
                        key={node.id}
                        className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer hover:border-purple-500/50 transition-colors"
                        onClick={() => handleNodeClick(node)}
                    >
                        <div className="text-gray-200 font-medium">{node.label}</div>
                        <div className="text-zinc-500 text-xs mt-1">{node.id}</div>
                    </div>
                ))}
            </div>
            {graphData.links.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Connections</h3>
                    <div className="text-xs text-zinc-500 space-y-1">
                        {graphData.links.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-purple-400">•</span>
                                <span>{typeof link.source === 'string' ? link.source : link.source.label || link.source.id}</span>
                                <span className="text-zinc-600">↔</span>
                                <span>{typeof link.target === 'string' ? link.target : link.target.label || link.target.id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Render graph view
    const renderGraphView = () => {
        try {
            return (
                /* eslint-disable @typescript-eslint/no-explicit-any */
                <ForceGraph2D
                    graphData={stableGraphData as any}
                    width={dimensions.width}
                    height={dimensions.height}
                    backgroundColor="#000000"
                    nodeLabel={(node: any) => node.label}
                    nodeColor={() => '#8b5cf6'}
                    nodeRelSize={8}
                    linkColor={() => '#4b5563'}
                    linkWidth={2}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={2}
                    onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
                    onEngineStop={() => console.log('[Graph] Engine stopped')}
                    cooldownTicks={100}
                    d3VelocityDecay={0.4}
                />
                /* eslint-enable @typescript-eslint/no-explicit-any */
            );
        } catch (e) {
            console.error('[GraphVisualization] ForceGraph2D render error:', e);
            setUseListView(true);
            return null;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
            {/* Graph Container */}
            <div ref={containerRef} className="flex-1 bg-black relative">                {/* Main Graph/List Content */}
                {renderError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <AlertCircle size={48} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
                        <p className="text-zinc-500 max-w-md text-sm">{renderError}</p>
                    </div>
                ) : graphData.nodes.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <Network size={48} className="text-zinc-700 mb-4" />
                        <h2 className="text-xl font-semibold text-zinc-400 mb-2">
                            Grafo Vazio
                        </h2>
                        <p className="text-zinc-600 max-w-md text-sm">
                            Seu grafo de conhecimento está vazio. Converse com o TEO para começar a construir conexões.
                        </p>
                    </div>
                ) : useListView ? (
                    renderListView()
                ) : (
                    renderGraphView()
                )}

                {/* Debug Toggle Button - Bottom Right */}
                <button
                    onClick={() => setDebugOpen(!debugOpen)}
                    className={`absolute bottom-4 right-4 z-10 p-2.5 rounded-lg border transition-all ${debugOpen
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-zinc-900/95 backdrop-blur-sm border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50'
                        }`}
                    title="Toggle Debug Panel"
                >
                    <Bug size={18} />
                </button>

                {/* View Toggle - Bottom Left (when nodes exist) */}
                {graphData.nodes.length > 0 && (
                    <button
                        onClick={() => setUseListView(!useListView)}
                        className="absolute bottom-4 left-4 z-10 px-3 py-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors"
                    >
                        {useListView ? 'Graph View' : 'List View'}
                    </button>
                )}
            </div>

            {/* Collapsible Debug Panel */}
            <div
                className={`bg-zinc-950 border-l border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out ${debugOpen ? 'w-full lg:w-80' : 'w-0'
                    }`}
            >
                <div className="w-80 p-4 h-full overflow-y-auto">
                    {/* Debug Header with Close */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-200">
                            <Bug size={16} className="text-emerald-400" />
                            <span className="text-sm font-semibold">Debug Panel</span>
                        </div>
                        <button
                            onClick={() => setDebugOpen(false)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <GraphDebug onGraphUpdate={loadGraphData} />
                </div>
            </div>

            {/* Node Slide-Over Panel */}
            <NodeSlideOver
                node={selectedNode}
                isOpen={slideOverOpen}
                onClose={handleCloseSlideOver}
                onDelete={loadGraphData}
            />
        </div>
    );
}
