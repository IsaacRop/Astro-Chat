'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, AlertCircle, Bug, X, List, Loader2, MessageCircle } from 'lucide-react';
import GraphDebug from '@/components/GraphDebug';
import NodeSlideOver from '@/components/NodeSlideOver';
import { getKnowledgeGraph, type GraphNode as ServerGraphNode } from '@/app/actions/study';
import Link from 'next/link';

interface GraphNode {
    id: string;
    label: string;
    chatId: string;
    messageCount: number;
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
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [useListView, setUseListView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [slideOverOpen, setSlideOverOpen] = useState(false);
    const [debugOpen, setDebugOpen] = useState(false);

    // Load graph data from Supabase
    const loadGraphData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const graph = await getKnowledgeGraph();

            const data = {
                nodes: graph.nodes.map((n: ServerGraphNode) => ({
                    id: n.id,
                    label: n.label,
                    chatId: n.id,
                    messageCount: n.val || 1,
                })),
                links: [] as GraphLink[],
            };

            setGraphData(data);
        } catch (e) {
            console.error('[GraphVisualization] Error loading graph data:', e);
            setLoadError('Falha ao carregar dados do grafo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGraphData();
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
                        <div className="text-muted-foreground text-[10px] md:text-xs mt-1 truncate">{node.messageCount} mensagens</div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Color palette for nodes - Muted Stone/Monochrome
    const nodeColors = [
        '#E5E7EB', // zinc-200
        '#D4D4D8', // zinc-300
        '#A1A1AA', // zinc-400
        '#71717A', // zinc-500
        '#52525B', // zinc-600
    ];

    // Graph view with custom canvas rendering
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
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const label = node.label || '';
                        const nodeIndex = stableGraphData.nodes.findIndex((n: GraphNode) => n.id === node.id);
                        const color = nodeColors[nodeIndex % nodeColors.length];

                        const baseSize = dimensions.width < 640 ? 6 : 8;
                        const msgScale = Math.log2((node.messageCount || 1) + 1);
                        const nodeSize = baseSize + msgScale * 2;

                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
                        ctx.fillStyle = color;
                        ctx.fill();

                        ctx.strokeStyle = '#0C0C0D';
                        ctx.lineWidth = 1 / globalScale * 4;
                        ctx.stroke();

                        const fontSize = Math.max(10, 11 / globalScale);
                        ctx.font = `${fontSize}px Inter, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillStyle = '#E5E7EB';

                        const maxLabelLength = 20;
                        const displayLabel = label.length > maxLabelLength
                            ? label.substring(0, maxLabelLength) + '...'
                            : label;

                        if (globalScale > 1.5 || nodeSize > 12) {
                            ctx.fillText(displayLabel, node.x, node.y + nodeSize + 4);
                        }
                    }}
                    nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                        // Path-based hit detection for Brave/Safari canvas security
                        const baseSize = dimensions.width < 640 ? 6 : 8;
                        const msgScale = Math.log2((node.messageCount || 1) + 1);
                        const nodeSize = baseSize + msgScale * 2;
                        // Make hitbox 50% larger than visual node for easier clicking
                        const hitboxSize = nodeSize * 1.5;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, hitboxSize, 0, 2 * Math.PI, false);
                        ctx.fillStyle = color;
                        ctx.fill();
                    }}
                    onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
                    onEngineStop={() => console.log('[Graph] Engine stopped')}
                    cooldownTicks={100}
                    d3VelocityDecay={0.3}
                    d3AlphaDecay={0.05}
                    enableNodeDrag={true}
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
            <div ref={containerRef} className="flex-1 bg-[#0C0C0D] relative min-h-0">
                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 pointer-events-none">
                        <Loader2 size={36} className="md:w-12 md:h-12 text-zinc-500 animate-spin mb-3 md:mb-4" />
                        <p className="text-zinc-500 text-sm md:text-base">Carregando grafo...</p>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && loadError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 pointer-events-auto">
                        <AlertCircle size={36} className="md:w-12 md:h-12 text-red-500 mb-3 md:mb-4" strokeWidth={1.5} />
                        <h2 className="text-lg md:text-xl font-serif text-zinc-200 mb-2">Erro</h2>
                        <p className="text-zinc-500 max-w-md text-xs md:text-sm font-sans">{loadError}</p>
                        <button
                            onClick={loadGraphData}
                            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !loadError && graphData.nodes.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 pointer-events-auto">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#1A1A1C] border border-white/[0.05] flex items-center justify-center mb-6">
                            <Network size={32} className="md:w-10 md:h-10 text-zinc-600" strokeWidth={1} />
                        </div>
                        <h2 className="text-lg md:text-xl font-serif text-zinc-300 mb-2">
                            Grafo Vazio
                        </h2>
                        <p className="text-zinc-500 max-w-md text-xs md:text-sm font-sans mb-6">
                            Nenhuma conversa encontrada. Inicie uma conversa com o Otto para criar seu primeiro nó.
                        </p>
                        <Link
                            href="/dashboard/chat"
                            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-sm font-medium transition-colors"
                        >
                            <MessageCircle size={16} strokeWidth={1.5} />
                            Iniciar Conversa
                        </Link>
                    </div>
                )}

                {/* Graph Content */}
                {!isLoading && !loadError && graphData.nodes.length > 0 && (
                    useListView ? renderListView() : renderGraphView()
                )}

                {/* Debug Toggle */}
                <button
                    onClick={() => setDebugOpen(!debugOpen)}
                    className={`absolute bottom-3 right-3 md:bottom-4 md:right-4 z-10 p-2 md:p-2.5 rounded-lg border transition-all ${debugOpen
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                        : 'bg-[#1A1A1C]/80 backdrop-blur-md border-white/[0.05] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.1]'
                        }`}
                    title="Toggle Debug Panel"
                >
                    <Bug size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={1.5} />
                </button>

                {/* View Toggle */}
                {!isLoading && !loadError && graphData.nodes.length > 0 && (
                    <button
                        onClick={() => setUseListView(!useListView)}
                        className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-[#1A1A1C]/80 backdrop-blur-md border border-white/[0.05] hover:border-white/[0.1] text-zinc-400 hover:text-zinc-200 text-[10px] md:text-xs rounded-lg transition-colors font-sans"
                    >
                        {useListView ? (
                            <>
                                <Network size={12} className="md:w-3.5 md:h-3.5" strokeWidth={1.5} />
                                <span>Graph</span>
                            </>
                        ) : (
                            <>
                                <List size={12} className="md:w-3.5 md:h-3.5" strokeWidth={1.5} />
                                <span>List</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Debug Panel */}
            <div
                className={`bg-[#1A1A1C] border-t md:border-t-0 md:border-l border-white/[0.05] overflow-hidden transition-all duration-300 ease-in-out ${debugOpen ? 'h-64 md:h-auto w-full md:w-72 lg:w-80' : 'h-0 md:h-auto md:w-0'
                    }`}
            >
                <div className="w-full md:w-72 lg:w-80 p-4 h-full overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-zinc-200">
                            <Bug size={14} className="md:w-4 md:h-4 text-zinc-400" strokeWidth={1.5} />
                            <span className="text-xs md:text-sm font-medium font-sans">Debug Panel</span>
                        </div>
                        <button
                            onClick={() => setDebugOpen(false)}
                            className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                            <X size={14} className="md:w-4 md:h-4" strokeWidth={1.5} />
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
