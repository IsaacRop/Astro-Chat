"use client";

import { Header } from "@/components/Header";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
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

interface Task {
    id: string;
    title: string;
    status: "todo" | "inprogress" | "done";
    color: "green" | "orange" | "purple" | "blue";
    dueDate?: string;
    createdAt: number;
}

const EVENTS_STORAGE_KEY = "astro-events";
const TASKS_STORAGE_KEY = "astro-tasks";

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

function loadTasks(): Task[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// ============================================
// CALENDAR HELPERS
// ============================================

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================
// COMPONENT
// ============================================

export default function CalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState({ title: "", time: "12:00" });

    // Current view month/year
    const [viewDate, setViewDate] = useState(() => new Date());
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    // Get today's date
    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Load data on mount
    useEffect(() => {
        setIsClient(true);
        setEvents(loadEvents());
        setTasks(loadTasks());

        // Listen for storage changes (for task sync)
        const handleStorage = () => {
            setTasks(loadTasks());
        };
        window.addEventListener('storage', handleStorage);

        // Poll for changes every 2 seconds (for same-tab updates)
        const interval = setInterval(() => {
            setTasks(loadTasks());
        }, 2000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    // Persist events
    useEffect(() => {
        if (isClient) {
            saveEvents(events);
        }
    }, [events, isClient]);

    // Calculate calendar grid
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(viewYear, viewMonth);
        const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
        const days: { day: number; isCurrentMonth: boolean; dateKey: string }[] = [];

        // Previous month days
        const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
        const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            days.push({
                day,
                isCurrentMonth: false,
                dateKey: formatDateKey(prevYear, prevMonth, day)
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                isCurrentMonth: true,
                dateKey: formatDateKey(viewYear, viewMonth, day)
            });
        }

        // Next month days (fill to 42 cells = 6 rows)
        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        const remaining = 42 - days.length;
        for (let day = 1; day <= remaining; day++) {
            days.push({
                day,
                isCurrentMonth: false,
                dateKey: formatDateKey(nextYear, nextMonth, day)
            });
        }

        return days;
    }, [viewYear, viewMonth]);

    // Get items for a specific date
    const getItemsForDate = useCallback((dateKey: string) => {
        const dateEvents = events.filter(e => e.date === dateKey);
        const dateTasks = tasks.filter(t => t.dueDate === dateKey && t.status !== 'done');
        return { events: dateEvents, tasks: dateTasks };
    }, [events, tasks]);

    // Navigation
    const goToPrevMonth = () => {
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const goToNextMonth = () => {
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const goToToday = () => {
        setViewDate(new Date());
    };

    // Add new event
    const handleAddEvent = useCallback(() => {
        if (!newEvent.title.trim() || !selectedDate) return;

        const colors: Event["color"][] = ["blue", "purple", "green", "orange"];
        const event: Event = {
            id: generateEventId(),
            title: newEvent.title.trim(),
            date: selectedDate,
            time: newEvent.time,
            color: colors[Math.floor(Math.random() * colors.length)],
            createdAt: Date.now(),
        };

        setEvents((prev) => [...prev, event].sort((a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
        ));
        setNewEvent({ title: "", time: "12:00" });
        setShowAddForm(false);
    }, [newEvent, selectedDate]);

    // Delete event
    const deleteEvent = useCallback((id: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
    }, []);

    // Format month name
    const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    // Selected date items
    const selectedItems = selectedDate ? getItemsForDate(selectedDate) : { events: [], tasks: [] };
    const selectedDateFormatted = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Calendar" backLink="/" />

            <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-serif font-bold capitalize">{monthName}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                            Hoje
                        </button>
                        <button
                            onClick={goToPrevMonth}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={goToNextMonth}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Week day headers */}
                    <div className="grid grid-cols-7 border-b border-border">
                        {weekDays.map((day) => (
                            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((dayInfo, index) => {
                            const { events: dayEvents, tasks: dayTasks } = getItemsForDate(dayInfo.dateKey);
                            const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
                            const isToday = dayInfo.dateKey === todayKey;
                            const isSelected = dayInfo.dateKey === selectedDate;

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(dayInfo.dateKey)}
                                    className={`
                                        relative min-h-[60px] md:min-h-[80px] p-1 md:p-2 border-b border-r border-border text-left transition-colors
                                        ${!dayInfo.isCurrentMonth ? 'text-muted-foreground/50 bg-muted/20' : 'hover:bg-muted/50'}
                                        ${isSelected ? 'bg-accent-blue/10 ring-2 ring-accent-blue ring-inset' : ''}
                                    `}
                                >
                                    <span className={`
                                        inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm rounded-full
                                        ${isToday ? 'bg-accent-blue text-background font-bold' : ''}
                                    `}>
                                        {dayInfo.day}
                                    </span>

                                    {/* Item indicators */}
                                    {hasItems && (
                                        <div className="mt-1 space-y-0.5 hidden md:block">
                                            {dayEvents.slice(0, 2).map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="text-[10px] px-1 py-0.5 rounded truncate"
                                                    style={{ backgroundColor: `var(--accent-${event.color})`, color: 'var(--background)' }}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayTasks.slice(0, 2).map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="text-[10px] px-1 py-0.5 rounded truncate bg-muted border border-border flex items-center gap-0.5"
                                                >
                                                    <CheckSquare size={8} className="flex-shrink-0" />
                                                    <span className="truncate">{task.title}</span>
                                                </div>
                                            ))}
                                            {(dayEvents.length + dayTasks.length) > 2 && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    +{dayEvents.length + dayTasks.length - 2} mais
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mobile: dots indicator */}
                                    {hasItems && (
                                        <div className="flex gap-0.5 mt-1 md:hidden">
                                            {dayEvents.length > 0 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                                            )}
                                            {dayTasks.length > 0 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Panel */}
                <AnimatePresence>
                    {selectedDate && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-card border border-border rounded-xl p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif font-bold capitalize">{selectedDateFormatted}</h3>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-blue/90 text-background hover:bg-accent-blue transition-colors"
                                >
                                    <Plus size={14} />
                                    Evento
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
                                        <div className="bg-background border border-border rounded-lg p-3 space-y-2">
                                            <input
                                                type="text"
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddEvent();
                                                    if (e.key === 'Escape') setShowAddForm(false);
                                                }}
                                                placeholder="Event title..."
                                                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="time"
                                                    value={newEvent.time}
                                                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                                    className="w-24 px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                                                />
                                                <button
                                                    onClick={handleAddEvent}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-accent-blue/90 text-background text-sm font-medium hover:bg-accent-blue transition-colors"
                                                >
                                                    Add
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

                            {/* Events for selected date */}
                            {selectedItems.events.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <CalendarIcon size={12} />
                                        Events
                                    </h4>
                                    {selectedItems.events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-3 p-2 bg-background border border-border rounded-lg group"
                                        >
                                            <div
                                                className="w-1 h-8 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: `var(--accent-${event.color})` }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{event.title}</p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock size={10} />
                                                    {event.time}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tasks for selected date */}
                            {selectedItems.tasks.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <CheckSquare size={12} />
                                        Tasks (from Kanban)
                                    </h4>
                                    {selectedItems.tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-2 bg-background border border-border rounded-lg"
                                        >
                                            <div
                                                className="w-1 h-8 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: `var(--accent-${task.color})` }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{task.title}</p>
                                                <span className={`
                                                    text-xs px-1.5 py-0.5 rounded
                                                    ${task.status === 'todo' ? 'bg-accent-blue/20 text-accent-blue' : ''}
                                                    ${task.status === 'inprogress' ? 'bg-accent-orange/20 text-accent-orange' : ''}
                                                `}>
                                                    {task.status === 'todo' ? 'To Do' : 'In Progress'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state for selected date */}
                            {selectedItems.events.length === 0 && selectedItems.tasks.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No events or tasks for this date
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
