"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Clock, CheckSquare, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    FullScreenCalendar,
    CalendarData,
    CalendarEvent,
} from "@/components/ui/fullscreen-calendar";
import { Header } from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import {
    getCalendarEvents,
    createEvent,
    deleteEvent as deleteEventAction,
    getTasks,
    type CalendarEvent as DBCalendarEvent,
    type Task,
} from "@/app/actions/productivity";

export default function CalendarPage() {
    const router = useRouter();
    const [events, setEvents] = useState<DBCalendarEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isPending, startTransition] = useTransition();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventTime, setNewEventTime] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Check auth and load data on mount
    useEffect(() => {
        async function checkAuthAndLoadData() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsAuthenticated(false);
                    router.replace("/?redirect=calendar");
                    return;
                }

                setIsAuthenticated(true);

                // Load both events and tasks
                const [eventsData, tasksData] = await Promise.all([
                    getCalendarEvents(),
                    getTasks(),
                ]);

                setEvents(eventsData);
                setTasks(tasksData);
            } catch (error) {
                console.error("[Calendar] Failed to load:", error);
            } finally {
                setIsLoading(false);
            }
        }
        checkAuthAndLoadData();
    }, [router]);

    // Convert events and tasks to CalendarData format
    const calendarData: CalendarData[] = useMemo(() => {
        const dataMap = new Map<string, CalendarEvent[]>();

        // Add events
        events.forEach((event) => {
            // Extract date from start_time
            const dateKey = event.start_time.split("T")[0];
            const timeMatch = event.start_time.includes("T")
                ? event.start_time.split("T")[1]?.slice(0, 5)
                : undefined;

            const calendarEvent: CalendarEvent = {
                id: event.id,
                name: event.title,
                time: timeMatch,
                datetime: dateKey,
                type: "event",
            };

            if (!dataMap.has(dateKey)) {
                dataMap.set(dateKey, []);
            }
            dataMap.get(dateKey)!.push(calendarEvent);
        });

        // Add tasks with due dates (exclude completed tasks)
        tasks
            .filter((task) => task.due_date && task.status !== "done")
            .forEach((task) => {
                const dateKey = task.due_date!;
                const calendarEvent: CalendarEvent = {
                    id: task.id,
                    name: task.title,
                    datetime: task.due_date!,
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

        startTransition(async () => {
            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const startTime = newEventTime
                    ? `${dateStr}T${newEventTime}:00`
                    : `${dateStr}T00:00:00`;

                await createEvent(
                    newEventTitle.trim(),
                    startTime,
                    undefined,
                    undefined,
                    !newEventTime, // is_all_day if no time specified
                    "personal"
                );

                // Reload events
                const eventsData = await getCalendarEvents();
                setEvents(eventsData);

                setNewEventTitle("");
                setNewEventTime("");
                setShowAddModal(false);
            } catch (error) {
                console.error("[Calendar] Create failed:", error);
            }
        });
    }, [newEventTitle, newEventTime, selectedDate]);

    // Delete event
    const handleDeleteEvent = useCallback((eventId: string) => {
        // Optimistic update
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setSelectedEvent(null);

        startTransition(async () => {
            try {
                await deleteEventAction(eventId);
            } catch (error) {
                console.error("[Calendar] Delete failed:", error);
                // Revert on error
                const eventsData = await getCalendarEvents();
                setEvents(eventsData);
            }
        });
    }, []);

    // Handle adding event from calendar
    const handleAddFromCalendar = (date: Date) => {
        setSelectedDate(date);
        setShowAddModal(true);
    };

    // Handle event click
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
    };

    // Loading state
    if (isLoading || isAuthenticated === null) {
        return (
            <div className="flex flex-col h-screen h-[100dvh] bg-[#0C0C0D] text-foreground">
                <Header title="Calendário" />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={32} className="text-zinc-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen h-[100dvh] bg-[#0C0C0D] text-foreground">
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-serif font-medium text-zinc-100">
                                    Novo Evento
                                </h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors"
                                >
                                    <X size={18} strokeWidth={1.5} />
                                </button>
                            </div>

                            <p className="text-sm text-zinc-400 mb-6 capitalize font-serif italic">
                                {format(selectedDate, "EEEE, d 'de' MMMM", {
                                    locale: ptBR,
                                })}
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                                        Título
                                    </label>
                                    <input
                                        type="text"
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && newEventTitle.trim()) handleAddEvent();
                                            if (e.key === "Escape") setShowAddModal(false);
                                        }}
                                        placeholder="Nome do evento"
                                        className="w-full px-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-white/[0.2] transition-colors placeholder:text-zinc-600"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                                        Horário (opcional)
                                    </label>
                                    <div className="relative">
                                        <Clock
                                            size={16}
                                            strokeWidth={1.5}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                        />
                                        <input
                                            type="time"
                                            value={newEventTime}
                                            onChange={(e) => setNewEventTime(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-white/[0.2] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-white/[0.05] rounded-xl text-zinc-400 text-sm font-medium hover:bg-white/[0.03] hover:text-zinc-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddEvent}
                                        disabled={!newEventTitle.trim() || isPending}
                                        className="flex-1 px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isPending ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={16} strokeWidth={1.5} />
                                                Adicionar
                                            </>
                                        )}
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`p-3 rounded-xl border ${selectedEvent.type === "task"
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                            }`}
                                    >
                                        {selectedEvent.type === "task" ? (
                                            <CheckSquare size={20} strokeWidth={1.5} />
                                        ) : (
                                            <Clock size={20} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div>
                                        <span
                                            className={`text-[10px] font-medium uppercase tracking-widest ${selectedEvent.type === "task"
                                                ? "text-emerald-500"
                                                : "text-blue-500"
                                                }`}
                                        >
                                            {selectedEvent.type === "task" ? "Tarefa" : "Evento"}
                                        </span>
                                        <h3 className="text-xl font-serif font-medium text-zinc-100 mt-0.5">
                                            {selectedEvent.name}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors"
                                >
                                    <X size={18} strokeWidth={1.5} />
                                </button>
                            </div>

                            {selectedEvent.time && (
                                <p className="text-sm text-zinc-400 mb-6 flex items-center gap-2 font-sans bg-[#0C0C0D] p-3 rounded-xl border border-white/[0.05]">
                                    <Clock size={16} strokeWidth={1.5} />
                                    {selectedEvent.time}
                                </p>
                            )}

                            {selectedEvent.type === "event" && (
                                <button
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    disabled={isPending}
                                    className="w-full px-4 py-2.5 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 size={16} strokeWidth={1.5} />
                                            Excluir Evento
                                        </>
                                    )}
                                </button>
                            )}

                            {selectedEvent.type === "task" && (
                                <p className="text-sm text-zinc-500 text-center font-sans">
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
