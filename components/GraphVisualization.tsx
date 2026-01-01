'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { loadGraph, GRAPH_STORAGE_KEY } from '@/utils/storage';
import { Network, AlertCircle, Bug, X, List } from 'lucide-react';
import GraphDebug from '@/components/GraphDebug';
import NodeSlideOver from '@/components/NodeSlideOver';

interface GraphNode {
    id: string;
    label: string;
    chatId: string;
    messageCount: number; // Used for dynamic node sizing
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

    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [slideOverOpen, setSlideOverOpen] = useState(false);
    const [debugOpen, setDebugOpen] = useState(false);

    // Load graph data
    const loadGraphData = useCallback(() => {
        try {
            const graph = loadGraph();
            // Nodes are isolated - no links are used
            const data = {
                nodes: graph.nodes.map(n => ({
                    id: n.id,
                    label: n.label,
                    chatId: n.id,
                    messageCount: n.messageCount || 1, // Fallback for legacy nodes
                })),
                links: [], // Empty - nodes are isolated
            };
            setGraphData(data);
            setRenderError(null);
        } catch (e) {
            console.error('[GraphVisualization] Error loading graph data:', e);
            setRenderError('Failed to load graph data');
        }
    }, []);

    useEffect(() => {
        loadGraphData();
    }, [loadGraphData]);

    // Cross-tab sync
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === GRAPH_STORAGE_KEY) {
                loadGraphData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadGraphData]);

    // Responsive dimensions
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

    const stableGraphData = useMemo(() => ({
        nodes: graphData.nodes.map(n => ({ ...n })),
        links: graphData.links.map(l => ({ ...l })),
    }), [graphData]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNode(node);
        setSlideOverOpen(true);
    }, []);

    const handleCloseSlideOver = useCallback(() => {
        setSlideOverOpen(false);
    }, []);

    // List view - Responsive
    const renderListView = () => (
        <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm md:text-lg font-semibold text-foreground truncate">
                    Knowledge Graph ({graphData.nodes.length} nodes)
                </h2>
                <button
                    onClick={() => setUseListView(false)}
                    className="text-xs text-accent-purple hover:text-accent-purple/80 whitespace-nowrap"
                >
                    Graph View
                </button>
            </div>
            <div className="space-y-2">
                {graphData.nodes.map(node => (
                    <div
                        key={node.id}
                        className="p-3 bg-card rounded-lg border border-border cursor-pointer hover:border-accent-purple/50 transition-colors active:bg-muted"
                        onClick={() => handleNodeClick(node)}
                    >
                        <div className="text-foreground font-medium text-sm md:text-base truncate">{node.label}</div>
                        <div className="text-muted-foreground text-[10px] md:text-xs mt-1 truncate">{node.id}</div>
                    </div>
                ))}
            </div>
            {graphData.links.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">Connections ({graphData.links.length})</h3>
                    <div className="text-[10px] md:text-xs text-muted-foreground space-y-1 max-h-[150px] overflow-y-auto">
                        {graphData.links.slice(0, 10).map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-accent-purple">•</span>
                                <span className="truncate">{typeof link.source === 'string' ? link.source : link.source.label || link.source.id}</span>
                                <span className="text-muted-foreground/50">↔</span>
                                <span className="truncate">{typeof link.target === 'string' ? link.target : link.target.label || link.target.id}</span>
                            </div>
                        ))}
                        {graphData.links.length > 10 && (
                            <div className="text-muted-foreground">...and {graphData.links.length - 10} more</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Graph view
    const renderGraphView = () => {
        try {
            return (
                /* eslint-disable @typescript-eslint/no-explicit-any */
                <ForceGraph2D
                    graphData={stableGraphData as any}
                    width={dimensions.width}
                    height={dimensions.height}
                    backgroundColor="transparent"
                    nodeLabel={(node: any) => `${node.label} (${node.messageCount} msgs)`}
                    nodeColor={() => 'var(--accent-purple)'}
                    // Dynamic node size based on messageCount
                    nodeVal={(node: any) => {
                        const baseSize = dimensions.width < 640 ? 3 : 5;
                        const msgScale = Math.log2((node.messageCount || 1) + 1);
                        return baseSize + msgScale * 2;
                    }}
                    onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
                    onEngineStop={() => console.log('[Graph] Engine stopped')}
                    cooldownTicks={100}
                    d3VelocityDecay={0.3}
                    d3AlphaDecay={0.05}
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
        <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)] md:h-[calc(100vh-73px)]">
            {/* Graph Container */}
            <div ref={containerRef} className="flex-1 bg-background relative min-h-0">
                {renderError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8">
                        <AlertCircle size={36} className="md:w-12 md:h-12 text-destructive mb-3 md:mb-4" />
                        <h2 className="text-lg md:text-xl font-semibold text-destructive mb-2">Error</h2>
                        <p className="text-muted-foreground max-w-md text-xs md:text-sm">{renderError}</p>
                    </div>
                ) : graphData.nodes.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8">
                        <Network size={36} className="md:w-12 md:h-12 text-muted-foreground/50 mb-3 md:mb-4" />
                        <h2 className="text-lg md:text-xl font-semibold text-muted-foreground mb-2">
                            Grafo Vazio
                        </h2>
                        <p className="text-muted-foreground/70 max-w-md text-xs md:text-sm">
                            Converse com o Astro para começar a construir seu grafo de conhecimento.
                        </p>
                    </div>
                ) : useListView ? (
                    renderListView()
                ) : (
                    renderGraphView()
                )}

                {/* Debug Toggle - Responsive positioning */}
                <button
                    onClick={() => setDebugOpen(!debugOpen)}
                    className={`absolute bottom-3 right-3 md:bottom-4 md:right-4 z-10 p-2 md:p-2.5 rounded-lg border transition-all ${debugOpen
                        ? 'bg-accent-green border-accent-green text-background'
                        : 'bg-card/95 backdrop-blur-sm border-border text-muted-foreground hover:text-accent-green hover:border-accent-green/50'
                        }`}
                    title="Toggle Debug Panel"
                >
                    <Bug size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                {/* View Toggle */}
                {graphData.nodes.length > 0 && (
                    <button
                        onClick={() => setUseListView(!useListView)}
                        className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-card/95 backdrop-blur-sm border border-border hover:border-accent-purple/50 text-muted-foreground text-[10px] md:text-xs rounded-lg transition-colors"
                    >
                        {useListView ? (
                            <>
                                <Network size={12} className="md:w-3.5 md:h-3.5" />
                                <span>Graph</span>
                            </>
                        ) : (
                            <>
                                <List size={12} className="md:w-3.5 md:h-3.5" />
                                <span>List</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Debug Panel - Full width on mobile when open */}
            <div
                className={`bg-background border-t md:border-t-0 md:border-l border-border overflow-hidden transition-all duration-300 ease-in-out ${debugOpen ? 'h-64 md:h-auto w-full md:w-72 lg:w-80' : 'h-0 md:h-auto md:w-0'
                    }`}
            >
                <div className="w-full md:w-72 lg:w-80 p-3 md:p-4 h-full overflow-y-auto">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-2 text-foreground">
                            <Bug size={14} className="md:w-4 md:h-4 text-accent-green" />
                            <span className="text-xs md:text-sm font-semibold">Debug Panel</span>
                        </div>
                        <button
                            onClick={() => setDebugOpen(false)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={14} className="md:w-4 md:h-4" />
                        </button>
                    </div>
                    <GraphDebug onGraphUpdate={loadGraphData} />
                </div>
            </div>

            {/* Node Slide-Over */}
            <NodeSlideOver
                node={selectedNode}
                isOpen={slideOverOpen}
                onClose={handleCloseSlideOver}
                onDelete={loadGraphData}
            />
        </div>
    );
}
