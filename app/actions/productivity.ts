"use server";

import { createClient } from "@/utils/supabase/server";

// ============================================
// TYPES
// ============================================

// Tasks
export type TaskStatus = "todo" | "inprogress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    priority?: TaskPriority | null;
    color?: string | null;
    due_date?: string | null;
    position?: number | null;
    created_at: string;
}

// Ideas
export type IdeaStatus = "new" | "exploring" | "implemented";

export interface Idea {
    id: string;
    content?: string | null;
    title?: string | null;
    status?: IdeaStatus | null;
    created_at: string;
}

// Bookmarks
export type BookmarkCategory = "chat" | "note" | "link" | "other";

export interface Bookmark {
    id: string;
    title: string;
    url?: string | null;
    category: BookmarkCategory;
    tags?: string[] | null;
    created_at: string;
}

// Calendar Events
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time?: string | null;
    is_all_day?: boolean | null;
    event_type?: "personal" | "work" | "reminder" | null;
    created_at: string;
}

// ============================================
// TASKS
// ============================================

export async function getTasks(): Promise<Task[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

    if (error) {
        console.error("[getTasks] Error:", error);
        return [];
    }

    return (data || []) as Task[];
}

export async function createTask(
    title: string,
    status: TaskStatus = "todo",
    priority: TaskPriority = "medium",
    dueDate?: string
): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get max position
    const { data: existing } = await supabase
        .from("tasks")
        .select("position")
        .eq("user_id", user.id)
        .order("position", { ascending: false })
        .limit(1);

    const nextPosition = (existing?.[0]?.position || 0) + 1;

    const { data, error } = await supabase
        .from("tasks")
        .insert({
            user_id: user.id,
            title,
            status,
        } as never)
        .select("id")
        .single();

    if (error) {
        console.error("[createTask] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("[updateTaskStatus] Error:", error);
        return false;
    }

    return true;
}

export async function deleteTask(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("[deleteTask] Error:", error);
        return false;
    }

    return true;
}

// ============================================
// IDEAS
// ============================================

export async function getIdeas(): Promise<Idea[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[getIdeas] Error:", error);
        return [];
    }

    return (data || []) as Idea[];
}

export async function createIdea(
    content: string,
    title?: string,
    status: IdeaStatus = "new"
): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("ideas")
        .insert({
            user_id: user.id,
            content,
        } as never)
        .select("id")
        .single();

    if (error) {
        console.error("[createIdea] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

export async function deleteIdea(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("ideas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("[deleteIdea] Error:", error);
        return false;
    }

    return true;
}

// ============================================
// BOOKMARKS
// ============================================

export async function getBookmarks(): Promise<Bookmark[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[getBookmarks] Error:", error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
        ...item,
        category: item.category || 'link',
    })) as Bookmark[];
}

export async function createBookmark(
    title: string,
    url?: string,
    category: BookmarkCategory = "other",
    tags?: string[]
): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("bookmarks")
        .insert({
            user_id: user.id,
            title,
            url: url || '',
            tags: tags || [],
        } as never)
        .select("id")
        .single();

    if (error) {
        console.error("[createBookmark] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

export async function deleteBookmark(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("[deleteBookmark] Error:", error);
        return false;
    }

    return true;
}

// ============================================
// CALENDAR EVENTS
// ============================================

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

    if (error) {
        console.error("[getCalendarEvents] Error:", error);
        return [];
    }

    return (data || []) as CalendarEvent[];
}

export async function createEvent(
    title: string,
    startTime: string,
    endTime?: string,
    description?: string,
    isAllDay: boolean = false,
    eventType: "personal" | "work" | "reminder" = "personal"
): Promise<{ id: string } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("calendar_events")
        .insert({
            user_id: user.id,
            title,
            description: description || null,
            start_time: startTime,
            end_time: endTime || startTime,
            is_all_day: isAllDay,
        } as never)
        .select("id")
        .single();

    if (error) {
        console.error("[createEvent] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

export async function deleteEvent(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("[deleteEvent] Error:", error);
        return false;
    }

    return true;
}
