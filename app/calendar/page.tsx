"use client";

import { Header } from "@/components/Header";
import { Calendar as CalendarIcon, Plus, Trash2, Clock } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// TYPES & STORAGE
// ============================================

interface Event {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    color: "blue" | "purple" | "green" | "orange";
    createdAt: number;
}

const EVENTS_STORAGE_KEY = "astro-events";

function generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadEvents(): Event[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveEvents(events: Event[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

// ============================================
// COMPONENT
// ============================================

export default function CalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "12:00" });

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Load events on mount
    useEffect(() => {
        setIsClient(true);
        setEvents(loadEvents());
    }, []);

    // Persist events
    useEffect(() => {
        if (isClient) {
            saveEvents(events);
        }
    }, [events, isClient]);

    // Add new event
    const handleAddEvent = useCallback(() => {
        if (!newEvent.title.trim() || !newEvent.date) return;

        const colors: Event["color"][] = ["blue", "purple", "green", "orange"];
        const event: Event = {
            id: generateEventId(),
            title: newEvent.title.trim(),
            date: newEvent.date,
            time: newEvent.time,
            color: colors[Math.floor(Math.random() * colors.length)],
            createdAt: Date.now(),
        };

        setEvents((prev) => [...prev, event].sort((a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
        ));
        setNewEvent({ title: "", date: "", time: "12:00" });
        setShowAddForm(false);
    }, [newEvent]);

    // Delete event
    const deleteEvent = useCallback((id: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
    }, []);

    // Group events by date
    const groupedEvents = events.reduce((acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date].push(event);
        return acc;
    }, {} as Record<string, Event[]>);

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Calendar" backLink="/" />

            <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4 md:space-y-6">
                {/* Add Event Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-accent-blue/90 text-background text-sm font-bold hover:bg-accent-blue transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Event</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Add Event Form */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Event title..."
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        min={today}
                                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                                    />
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddEvent}
                                        className="flex-1 px-3 py-2 rounded-lg bg-accent-blue/90 text-background text-sm font-medium hover:bg-accent-blue transition-colors"
                                    >
                                        Add Event
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-3 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {isClient && events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
                            <CalendarIcon size={32} className="md:w-10 md:h-10 text-accent-blue" />
                        </div>
                        <h2 className="text-lg md:text-xl font-serif font-bold mb-2">No Events</h2>
                        <p className="text-muted-foreground max-w-sm text-sm md:text-base">
                            Add your first event to start organizing your schedule.
                        </p>
                    </div>
                )}

                {/* Events List */}
                <div className="space-y-6">
                    {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                        <div key={date}>
                            <h3 className="text-sm md:text-base font-semibold text-foreground mb-3 capitalize">
                                {formatDate(date)}
                            </h3>
                            <div className="space-y-2">
                                {dateEvents.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg group hover:border-accent-blue/50 transition-colors"
                                    >
                                        <div
                                            className="w-1 h-10 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: `var(--accent-${event.color})` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground font-medium text-sm truncate">{event.title}</p>
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                                                <Clock size={12} />
                                                <span>{event.time}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteEvent(event.id)}
                                            className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
