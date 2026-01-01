/**
 * Astro Unified Storage Utility
 * 
 * Core Principle: One UUID links Chat, Node, and Notes
 * 
 * Storage Keys:
 * - Chat:  teo-chat-{UUID}
 * - Notes: teo-notes-{UUID}
 * - Graph: teo-knowledge-graph (contains nodes with id === UUID)
 */

import type { UIMessage } from 'ai';

// ============================================
// TYPES
// ============================================

export interface ChatSession {
    uuid: string;
    title: string;
    messages: UIMessage[];
    createdAt: number;
    updatedAt: number;
}

export interface ChatSummary {
    uuid: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
}

export interface GraphNode {
    id: string; // This IS the UUID
    label: string;
    embedding: number[];
    messageCount: number; // Size of the conversation - affects node size in visualization
    createdAt: number;
}

export interface GraphLink {
    source: string;
    target: string;
    similarity: number;
}

export interface KnowledgeGraph {
    nodes: GraphNode[];
    links: GraphLink[]; // Will be empty - nodes are isolated
}

// ============================================
// CONSTANTS
// ============================================

const CHAT_PREFIX = 'teo-chat-';
const NOTES_PREFIX = 'teo-notes-';
const GRAPH_KEY = 'teo-knowledge-graph';
const CHAT_INDEX_KEY = 'teo-chat-index'; // Stores list of all chat UUIDs

// ============================================
// UUID GENERATION
// ============================================

/**
 * Generate a cryptographically secure UUID
 */
export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ============================================
// CHAT STORAGE
// ============================================

/**
 * Save a chat session
 */
export function saveChat(uuid: string, messages: UIMessage[], title?: string): void {
    if (typeof window === 'undefined') return;

    const existingRaw = localStorage.getItem(`${CHAT_PREFIX}${uuid}`);
    const existing = existingRaw ? JSON.parse(existingRaw) as ChatSession : null;

    const session: ChatSession = {
        uuid,
        title: title || getTitleFromMessages(messages) || 'Nova Conversa',
        messages,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
    };

    localStorage.setItem(`${CHAT_PREFIX}${uuid}`, JSON.stringify(session));
    updateChatIndex(uuid, 'add');
    console.log(`[Storage] Chat saved: ${uuid}`);
}

/**
 * Load a chat session by UUID
 */
export function loadChat(uuid: string): ChatSession | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(`${CHAT_PREFIX}${uuid}`);
        if (raw) {
            return JSON.parse(raw) as ChatSession;
        }
    } catch (e) {
        console.error(`[Storage] Failed to load chat ${uuid}:`, e);
    }
    return null;
}

/**
 * Get all chat summaries (without full message content)
 */
export function getAllChats(): ChatSummary[] {
    if (typeof window === 'undefined') return [];

    const index = getChatIndex();
    const summaries: ChatSummary[] = [];

    for (const uuid of index) {
        const session = loadChat(uuid);
        if (session) {
            summaries.push({
                uuid: session.uuid,
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                messageCount: session.messages.length,
            });
        }
    }

    // Sort by most recent first
    return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Extract title from first user message
 */
function getTitleFromMessages(messages: UIMessage[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'Nova Conversa';

    const text = firstUserMessage.parts
        ?.filter((part: { type: string }) => part.type === 'text')
        .map((part: { type: string; text?: string }) => part.text || '')
        .join('') || '';

    if (text.length <= 30) return text;
    return text.substring(0, 30) + '...';
}

// ============================================
// CHAT INDEX MANAGEMENT
// ============================================

function getChatIndex(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(CHAT_INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function updateChatIndex(uuid: string, action: 'add' | 'remove'): void {
    if (typeof window === 'undefined') return;

    const index = getChatIndex();

    if (action === 'add' && !index.includes(uuid)) {
        index.push(uuid);
    } else if (action === 'remove') {
        const idx = index.indexOf(uuid);
        if (idx !== -1) index.splice(idx, 1);
    }

    localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(index));
}

// ============================================
// NOTES STORAGE
// ============================================

/**
 * Save personal notes for a UUID
 */
export function saveNote(uuid: string, content: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${NOTES_PREFIX}${uuid}`, content);
    console.log(`[Storage] Note saved: ${uuid}`);
}

/**
 * Load personal notes for a UUID
 */
export function loadNote(uuid: string): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`${NOTES_PREFIX}${uuid}`) || '';
}

// ============================================
// GRAPH STORAGE
// ============================================

/**
 * Load the knowledge graph
 */
export function loadGraph(): KnowledgeGraph {
    if (typeof window === 'undefined') return { nodes: [], links: [] };

    try {
        const raw = localStorage.getItem(GRAPH_KEY);
        if (raw) {
            return JSON.parse(raw) as KnowledgeGraph;
        }
    } catch (e) {
        console.error('[Storage] Failed to load graph:', e);
    }
    return { nodes: [], links: [] };
}

/**
 * Save the knowledge graph
 */
export function saveGraph(graph: KnowledgeGraph): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GRAPH_KEY, JSON.stringify(graph));
    console.log('[Storage] Graph saved');
}

/**
 * Add or update a node in the graph with the given UUID
 * The node ID === UUID for 1:1 linking
 * Nodes are ISOLATED (no links between them)
 * messageCount affects the visual size of the node
 */
export function addNode(uuid: string, label: string, embedding: number[], messageCount: number = 1): void {
    const graph = loadGraph();

    // Check if node already exists
    const existingIndex = graph.nodes.findIndex(n => n.id === uuid);
    if (existingIndex !== -1) {
        // Update existing node - preserve embedding if same, update messageCount
        graph.nodes[existingIndex].label = label;
        graph.nodes[existingIndex].embedding = embedding;
        graph.nodes[existingIndex].messageCount = messageCount;
        console.log(`[Storage] Node updated: ${uuid} -> "${label}" (${messageCount} messages)`);
    } else {
        // Add new node
        graph.nodes.push({
            id: uuid,
            label,
            embedding,
            messageCount,
            createdAt: Date.now(),
        });
        console.log(`[Storage] Node added: ${uuid} -> "${label}" (${messageCount} messages)`);
    }

    // NOTE: Links are intentionally NOT created
    // Nodes are isolated - their size is based on messageCount
    // This provides a cleaner visualization focused on individual conversations

    saveGraph(graph);
}

/**
 * Get a node by UUID
 */
export function getNode(uuid: string): GraphNode | null {
    const graph = loadGraph();
    return graph.nodes.find(n => n.id === uuid) || null;
}

/**
 * Update only the messageCount of an existing node
 * This is called when the conversation grows
 */
export function updateNodeMessageCount(uuid: string, messageCount: number): void {
    const graph = loadGraph();
    const node = graph.nodes.find(n => n.id === uuid);
    if (node) {
        node.messageCount = messageCount;
        saveGraph(graph);
        console.log(`[Storage] Node messageCount updated: ${uuid} -> ${messageCount} messages`);
    }
}

// ============================================
// SESSION DELETION (WITH PHANTOM LINK CLEANUP)
// ============================================

/**
 * Delete a session completely: Chat, Notes, Node, AND all links
 * 
 * CRUCIAL: Removes phantom links to prevent visualization crashes
 */
export function deleteSession(uuid: string): void {
    if (typeof window === 'undefined') return;

    console.log(`[Storage] Deleting session: ${uuid}`);

    // 1. Remove chat
    localStorage.removeItem(`${CHAT_PREFIX}${uuid}`);
    updateChatIndex(uuid, 'remove');

    // 2. Remove notes
    localStorage.removeItem(`${NOTES_PREFIX}${uuid}`);

    // 3. Remove node AND phantom links from graph
    const graph = loadGraph();

    // Filter out the node
    const nodeIndex = graph.nodes.findIndex(n => n.id === uuid);
    if (nodeIndex !== -1) {
        graph.nodes.splice(nodeIndex, 1);
        console.log(`[Storage] Node removed: ${uuid}`);
    }

    // CRUCIAL: Filter out all links that reference this UUID
    const originalLinkCount = graph.links.length;
    graph.links = graph.links.filter(
        link => link.source !== uuid && link.target !== uuid
    );
    const removedLinks = originalLinkCount - graph.links.length;
    if (removedLinks > 0) {
        console.log(`[Storage] Phantom links removed: ${removedLinks}`);
    }

    saveGraph(graph);
    console.log(`[Storage] Session deleted: ${uuid}`);
}

// ============================================
// SYNC & SELF-CORRECTION
// ============================================

/**
 * Sync missing nodes: Create nodes for chats that don't have them
 * Returns count of nodes created
 */
export function syncMissingNodes(
    generateEmbedding: (messages: UIMessage[]) => Promise<{ label: string; embedding: number[] } | null>
): Promise<number> {
    return new Promise(async (resolve) => {
        if (typeof window === 'undefined') {
            resolve(0);
            return;
        }

        const chats = getAllChats();
        const graph = loadGraph();
        const existingUUIDs = new Set(graph.nodes.map(n => n.id));

        let created = 0;

        for (const chat of chats) {
            if (!existingUUIDs.has(chat.uuid)) {
                console.log(`[Storage] Missing node for chat: ${chat.uuid}`);

                const session = loadChat(chat.uuid);
                if (session && session.messages.length > 0) {
                    try {
                        const result = await generateEmbedding(session.messages);
                        if (result) {
                            addNode(chat.uuid, result.label, result.embedding);
                            created++;
                        }
                    } catch (e) {
                        console.error(`[Storage] Failed to sync node for ${chat.uuid}:`, e);
                    }
                }
            }
        }

        console.log(`[Storage] Sync complete: ${created} nodes created`);
        resolve(created);
    });
}

/**
 * Get all UUIDs for debugging
 */
export function inspectAllIDs(): { chats: string[]; nodes: string[]; notes: string[] } {
    if (typeof window === 'undefined') {
        return { chats: [], nodes: [], notes: [] };
    }

    const chats = getChatIndex();
    const nodes = loadGraph().nodes.map(n => n.id);

    // Find all notes keys
    const notes: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(NOTES_PREFIX)) {
            notes.push(key.replace(NOTES_PREFIX, ''));
        }
    }

    return { chats, nodes, notes };
}

// ============================================
// UTILITY: COSINE SIMILARITY
// ============================================

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================
// GRAPH KEY EXPORT (for cross-tab sync)
// ============================================

export const GRAPH_STORAGE_KEY = GRAPH_KEY;
