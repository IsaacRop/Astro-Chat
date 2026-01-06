"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Clock, CheckSquare, Trash2 } from "lucide-react";
import {
    FullScreenCalendar,
    CalendarData,
    CalendarEvent,
} from "@/components/ui/fullscreen-calendar";
import { Header } from "@/components/Header";

// Event type stored in localStorage
interface StoredEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time?: string;
    type: "personal" | "work" | "reminder";
    createdAt: number;
}

// Task type from Kanban board
interface Task {
    id: string;
    title: string;
    status: "todo" | "in-progress" | "done";
    color: string;
    dueDate?: string;
    createdAt: number;
}

// Load events from localStorage
const loadEvents = (): StoredEvent[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem("calendar-events");
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Save events to localStorage
const saveEvents = (events: StoredEvent[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("calendar-events", JSON.stringify(events));
};

// Load tasks from Kanban board
const loadTasks = (): Task[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem("kanban-tasks");
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export default function CalendarPage() {
    const [events, setEvents] = useState<StoredEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventTime, setNewEventTime] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
        null
    );

    // Load data on mount
    useEffect(() => {
        setEvents(loadEvents());
        setTasks(loadTasks());

        // Listen for storage changes (for task sync)
        const handleStorage = () => {
            setTasks(loadTasks());
            setEvents(loadEvents());
        };
        window.addEventListener("storage", handleStorage);

        // Poll for changes every 2 seconds (for same-tab updates)
        const interval = setInterval(() => {
            setTasks(loadTasks());
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleStorage);
            clearInterval(interval);
        };
    }, []);

    // Convert events and tasks to CalendarData format
    const calendarData: CalendarData[] = useMemo(() => {
        const dataMap = new Map<string, CalendarEvent[]>();

        // Add events
        events.forEach((event) => {
            const dateKey = event.date;
            const calendarEvent: CalendarEvent = {
                id: event.id,
                name: event.title,
                time: event.time,
                datetime: event.date,
                type: "event",
            };

            if (!dataMap.has(dateKey)) {
                dataMap.set(dateKey, []);
            }
            dataMap.get(dateKey)!.push(calendarEvent);
        });

        // Add tasks with due dates (exclude completed tasks)
        tasks
            .filter((task) => task.dueDate && task.status !== "done")
            .forEach((task) => {
                const dateKey = task.dueDate!;
                const calendarEvent: CalendarEvent = {
                    id: task.id,
                    name: task.title,
                    datetime: task.dueDate!,
                    type: "task",
                    status: task.status,
                };

                if (!dataMap.has(dateKey)) {
                    dataMap.set(dateKey, []);
                }
                dataMap.get(dateKey)!.push(calendarEvent);
            });

        // Convert to array format
        return Array.from(dataMap.entries()).map(([dateStr, events]) => ({
            day: parseISO(dateStr),
            events,
        }));
    }, [events, tasks]);

    // Add new event
    const handleAddEvent = useCallback(() => {
        if (!newEventTitle.trim() || !selectedDate) return;

        const newEvent: StoredEvent = {
            id: Date.now().toString(),
            title: newEventTitle.trim(),
            date: format(selectedDate, "yyyy-MM-dd"),
            time: newEventTime || undefined,
            type: "personal",
            createdAt: Date.now(),
        };

        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        saveEvents(updatedEvents);

        setNewEventTitle("");
        setNewEventTime("");
        setShowAddModal(false);
    }, [newEventTitle, newEventTime, selectedDate, events]);

    // Delete event
    const handleDeleteEvent = useCallback(
        (eventId: string) => {
            const updatedEvents = events.filter((e) => e.id !== eventId);
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
            setSelectedEvent(null);
        },
        [events]
    );

    // Handle adding event from calendar
    const handleAddFromCalendar = (date: Date) => {
        setSelectedDate(date);
        setShowAddModal(true);
    };

    // Handle event click
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
    };

    return (
        <div className="flex flex-col h-screen h-[100dvh] bg-background text-foreground">
            <Header title="Calendário" />

            <div className="flex-1 overflow-hidden">
                <FullScreenCalendar
                    data={calendarData}
                    onAddEvent={handleAddFromCalendar}
                    onEventClick={handleEventClick}
                />
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showAddModal && selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Novo Evento
                                </h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 capitalize">
                                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                                    locale: ptBR,
                                })}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Título
                                    </label>
                                    <input
                                        type="text"
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        placeholder="Nome do evento"
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Horário (opcional)
                                    </label>
                                    <div className="relative">
                                        <Clock
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        />
                                        <input
                                            type="time"
                                            value={newEventTime}
                                            onChange={(e) => setNewEventTime(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground text-sm font-medium hover:bg-muted transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddEvent}
                                        disabled={!newEventTitle.trim()}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-blue to-accent-purple text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Event Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${selectedEvent.type === "task"
                                            ? "bg-accent-green/20 text-accent-green"
                                            : "bg-accent-blue/20 text-accent-blue"
                                            }`}
                                    >
                                        {selectedEvent.type === "task" ? (
                                            <CheckSquare size={20} />
                                        ) : (
                                            <Clock size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <span
                                            className={`text-xs font-medium uppercase ${selectedEvent.type === "task"
                                                ? "text-accent-green"
                                                : "text-accent-blue"
                                                }`}
                                        >
                                            {selectedEvent.type === "task" ? "Tarefa" : "Evento"}
                                        </span>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {selectedEvent.name}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {selectedEvent.time && (
                                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                                    <Clock size={14} />
                                    {selectedEvent.time}
                                </p>
                            )}

                            {selectedEvent.type === "event" && (
                                <button
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    className="w-full px-4 py-2.5 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Excluir Evento
                                </button>
                            )}

                            {selectedEvent.type === "task" && (
                                <p className="text-sm text-muted-foreground text-center">
                                    Gerencie esta tarefa no Kanban
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
