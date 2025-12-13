// Manual cosine similarity implementation (works on client-side)
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Types for the knowledge graph
export interface GraphNode {
    id: string;
    label: string;
    embedding: number[];
    chatId: string;
    createdAt: number;
}

export interface GraphLink {
    source: string;
    target: string;
    similarity: number;
}

export interface KnowledgeGraph {
    nodes: GraphNode[];
    links: GraphLink[];
}

// LocalStorage key
const GRAPH_STORAGE_KEY = 'teo-knowledge-graph';

// Similarity threshold for creating links
const SIMILARITY_THRESHOLD = 0.8;

/**
 * Load the knowledge graph from localStorage
 */
export function loadGraph(): KnowledgeGraph {
    if (typeof window === 'undefined') {
        return { nodes: [], links: [] };
    }

    try {
        const stored = localStorage.getItem(GRAPH_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as KnowledgeGraph;
        }
    } catch (e) {
        console.error('[Knowledge Graph] Failed to load from localStorage:', e);
    }

    return { nodes: [], links: [] };
}

/**
 * Save the knowledge graph to localStorage
 */
export function saveGraph(graph: KnowledgeGraph): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph));
        console.log('[Knowledge Graph] Saved to localStorage');
    } catch (e) {
        console.error('[Knowledge Graph] Failed to save to localStorage:', e);
    }
}

/**
 * Add a new node to the knowledge graph and calculate links
 */
export function addToKnowledgeGraph(
    label: string,
    embedding: number[],
    chatId: string
): KnowledgeGraph {
    console.log('[Knowledge Graph] Adding node:', label);

    // Load existing graph
    const graph = loadGraph();

    // Create unique node ID
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new node
    const newNode: GraphNode = {
        id: nodeId,
        label,
        embedding,
        chatId,
        createdAt: Date.now(),
    };

    console.log('[Knowledge Graph] Embedding Generated - dimension:', embedding.length);

    // Calculate similarity with all existing nodes and create links
    const newLinks: GraphLink[] = [];

    for (const existingNode of graph.nodes) {
        const similarity = cosineSimilarity(embedding, existingNode.embedding);
        console.log(`[Knowledge Graph] Similarity Calculated: "${label}" <-> "${existingNode.label}" = ${similarity.toFixed(4)}`);

        if (similarity >= SIMILARITY_THRESHOLD) {
            console.log(`[Knowledge Graph] Link Created: "${label}" <-> "${existingNode.label}" (similarity: ${similarity.toFixed(4)})`);
            newLinks.push({
                source: nodeId,
                target: existingNode.id,
                similarity,
            });
        }
    }

    // Add new node and links to graph
    graph.nodes.push(newNode);
    graph.links.push(...newLinks);

    // Save updated graph
    saveGraph(graph);

    console.log(`[Knowledge Graph] Graph updated: ${graph.nodes.length} nodes, ${graph.links.length} links`);

    return graph;
}

/**
 * Clear the entire knowledge graph
 */
export function clearGraph(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(GRAPH_STORAGE_KEY);
    console.log('[Knowledge Graph] Graph cleared');
}

/**
 * Get graph data formatted for react-force-graph
 */
export function getForceGraphData(): { nodes: { id: string; label: string; chatId: string }[]; links: { source: string; target: string }[] } {
    const graph = loadGraph();

    return {
        nodes: graph.nodes.map(n => ({
            id: n.id,
            label: n.label,
            chatId: n.chatId,
        })),
        links: graph.links.map(l => ({
            source: l.source,
            target: l.target,
        })),
    };
}

/**
 * Get a specific node by ID
 */
export function getNodeById(nodeId: string): GraphNode | null {
    const graph = loadGraph();
    return graph.nodes.find(n => n.id === nodeId) || null;
}

// LocalStorage key for personal notes
const NOTES_STORAGE_KEY = 'teo-node-notes';

/**
 * Load all personal notes from localStorage
 */
export function loadNotes(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(NOTES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

/**
 * Save a personal note for a specific node
 */
export function saveNote(nodeId: string, content: string): void {
    if (typeof window === 'undefined') return;
    const notes = loadNotes();
    notes[nodeId] = content;
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    console.log('[Knowledge Graph] Note saved for node:', nodeId);
}

/**
 * Get personal note for a specific node
 */
export function getNote(nodeId: string): string {
    const notes = loadNotes();
    return notes[nodeId] || '';
}

