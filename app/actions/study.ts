"use server";

import { createClient } from "@/utils/supabase/server";

// ============================================
// TYPES
// ============================================

export interface Note {
    id: string;
    title: string;
    content: string;
    updated_at: string;
}

export interface GraphNode {
    id: string;
    label: string;
    val: number; // Size based on message count
}

export interface GraphLink {
    source: string;
    target: string;
    value: number; // Cosine similarity score
}

export interface KnowledgeGraph {
    nodes: GraphNode[];
    links: GraphLink[];
}

// ============================================
// KNOWLEDGE GRAPH
// ============================================

/**
 * Get knowledge graph data from chats table.
 * Nodes = chats sized by message count.
 * Links = edges between chats with similar embeddings (pgvector cosine similarity).
 */
export async function getKnowledgeGraph(): Promise<KnowledgeGraph> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { nodes: [], links: [] };
    }

    // Fetch chats with message count (nodes)
    const { data: chats, error } = await supabase
        .from("chats")
        .select(`
            id,
            title,
            messages:messages(count)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[getKnowledgeGraph] Error fetching chats:", error);
        return { nodes: [], links: [] };
    }

    const nodes: GraphNode[] = (chats || []).map((chat) => ({
        id: chat.id,
        label: chat.title || "Sem título",
        val: ((chat.messages as { count: number }[])?.[0]?.count || 1),
    }));

    // Fetch similarity edges via pgvector RPC
    let links: GraphLink[] = [];
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: edges, error: rpcError } = await (supabase as any)
            .rpc('get_chat_similarity_edges', {
                p_user_id: user.id,
                similarity_threshold: 0.45,
            });

        if (rpcError) {
            console.error("[getKnowledgeGraph] RPC error:", rpcError);
        } else {
            links = (edges || []).map((e: { source: string; target: string; value: number }) => ({
                source: e.source,
                target: e.target,
                value: e.value,
            }));
            console.log(`[getKnowledgeGraph] Found ${links.length} similarity edges`);
        }
    } catch (rpcErr) {
        console.error("[getKnowledgeGraph] RPC call failed:", rpcErr);
        // Fail gracefully — graph still shows nodes without edges
    }

    return { nodes, links };
}

// ============================================
// NOTES
// ============================================

/**
 * Get all notes for the current user
 */
export async function getUserNotes(): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[getUserNotes] Error:", error);
        return [];
    }

    return (data || []) as Note[];
}

/**
 * Get a specific note by ID
 */
export async function getNote(noteId: string): Promise<Note | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, updated_at")
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        console.error("[getNote] Error:", error);
        return null;
    }

    return data as Note;
}

/**
 * Create a new note
 */
export async function createNote(title: string = "Sem título"): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("notes")
        .insert({
            user_id: user.id,
            title,
            content: "",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[createNote] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

/**
 * Save/update a note
 */
export async function saveNote(
    noteId: string,
    title: string,
    content: string
): Promise<{ success: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { error } = await supabase
        .from("notes")
        .update({
            title,
            content,
            updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("user_id", user.id);

    if (error) {
        console.error("[saveNote] Error:", error);
        throw new Error(error.message);
    }

    return { success: true };
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<{ success: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

    if (error) {
        console.error("[deleteNote] Error:", error);
        throw new Error(error.message);
    }

    return { success: true };
}

// ============================================
// CHATS
// ============================================

/**
 * Delete a chat and its messages
 */
export async function deleteChat(chatId: string): Promise<{ success: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Delete messages first (foreign key constraint)
    await supabase
        .from("messages")
        .delete()
        .eq("chat_id", chatId);

    // Delete the chat
    const { error } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", user.id);

    if (error) {
        console.error("[deleteChat] Error:", error);
        throw new Error(error.message);
    }

    return { success: true };
}
