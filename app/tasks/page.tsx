"use client";

import { Header } from "@/components/Header";
import { Plus, Trash2, GripVertical, Calendar } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// TYPES & STORAGE
// ============================================

type TaskStatus = "todo" | "inprogress" | "done";

interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    color: "green" | "orange" | "purple" | "blue";
    dueDate?: string; // YYYY-MM-DD format for calendar sync
    createdAt: number;
}

const TASKS_STORAGE_KEY = "astro-tasks";

function generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

function saveTasks(tasks: Task[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: "todo", title: "To Do", color: "accent-blue" },
    { id: "inprogress", title: "In Progress", color: "accent-orange" },
    { id: "done", title: "Done", color: "accent-green" },
];

// ============================================
// COMPONENT
// ============================================

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDate, setNewTaskDate] = useState("");
    const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Load tasks on mount
    useEffect(() => {
        setIsClient(true);
        setTasks(loadTasks());
    }, []);

    // Persist tasks whenever they change
    useEffect(() => {
        if (isClient) {
            saveTasks(tasks);
        }
    }, [tasks, isClient]);

    // Add new task
    const handleAddTask = useCallback((status: TaskStatus) => {
        if (!newTaskTitle.trim()) return;

        const colors: Task["color"][] = ["green", "orange", "purple", "blue"];
        const newTask: Task = {
            id: generateTaskId(),
            title: newTaskTitle.trim(),
            status,
            color: colors[Math.floor(Math.random() * colors.length)],
            dueDate: newTaskDate || undefined,
            createdAt: Date.now(),
        };

        setTasks((prev) => [...prev, newTask]);
        setNewTaskTitle("");
        setNewTaskDate("");
        setAddingToColumn(null);
    }, [newTaskTitle, newTaskDate]);

    // Move task to different column
    const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        );
    }, []);

    // Delete task
    const deleteTask = useCallback((taskId: string) => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
    }, []);

    // Get tasks by status
    const getTasksByStatus = (status: TaskStatus) =>
        tasks.filter((task) => task.status === status);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col overflow-x-hidden">
            <Header title="Tarefas" />

            {/* Mobile: Vertical Stack / Desktop: Horizontal Kanban */}
            <main className="flex-1 p-4 md:p-8 overflow-x-auto">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:min-w-max h-full">
                    {columns.map((column) => (
                        <div
                            key={column.id}
                            className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-2 h-2 rounded-full ${column.id === 'done' ? 'bg-emerald-500' :
                                                column.id === 'inprogress' ? 'bg-amber-500' :
                                                    'bg-zinc-500'
                                            }`}
                                    />
                                    <h2 className="font-serif font-medium text-lg text-zinc-200 tracking-tight">{column.title}</h2>
                                    <span className="text-zinc-600 text-sm font-sans">
                                        {getTasksByStatus(column.id).length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAddingToColumn(column.id)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors"
                                >
                                    <Plus size={18} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 bg-[#1A1A1C]/50 border border-white/[0.02] rounded-2xl p-3 space-y-3 min-h-[200px] md:min-h-[400px] backdrop-blur-sm">
                                /* Add Task Input */
                                <AnimatePresence>
                                    {addingToColumn === column.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-[#1A1A1C] border border-white/[0.05] rounded-xl p-3 space-y-3 shadow-xl">
                                                <input
                                                    type="text"
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleAddTask(column.id);
                                                        if (e.key === "Escape") setAddingToColumn(null);
                                                    }}
                                                    placeholder="Nova tarefa..."
                                                    autoFocus
                                                    className="w-full px-3 py-2 bg-[#0C0C0D] border border-white/[0.05] rounded-lg text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-white/[0.2] transition-colors"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
                                                    <input
                                                        type="date"
                                                        value={newTaskDate}
                                                        onChange={(e) => setNewTaskDate(e.target.value)}
                                                        min={today}
                                                        className="flex-1 px-2 py-1.5 bg-[#0C0C0D] border border-white/[0.05] rounded-lg text-zinc-400 text-xs focus:outline-none focus:border-white/[0.2] transition-colors"
                                                        placeholder="Data (opcional)"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAddTask(column.id)}
                                                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors"
                                                    >
                                                        Adicionar
                                                    </button>
                                                    <button
                                                        onClick={() => setAddingToColumn(null)}
                                                        className="px-3 py-1.5 rounded-lg border border-white/[0.05] text-zinc-400 text-sm hover:bg-white/[0.05] hover:text-zinc-200 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Task Cards */}
                                {getTasksByStatus(column.id).map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-[#1A1A1C] border border-white/[0.05] rounded-xl p-4 group hover:border-white/[0.1] transition-all relative overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="pt-1 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hidden md:block">
                                                <GripVertical size={14} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-zinc-200 text-sm font-medium break-words leading-relaxed font-sans">
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.color === 'green' ? 'bg-emerald-500' :
                                                                task.color === 'orange' ? 'bg-amber-500' :
                                                                    task.color === 'blue' ? 'bg-blue-500' :
                                                                        'bg-purple-500'
                                                            }`}
                                                    />
                                                    {task.dueDate && (
                                                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.02]">
                                                            <Calendar size={10} strokeWidth={1.5} />
                                                            {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                    {/* Move buttons */}
                                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-auto">
                                                        {column.id !== "todo" && (
                                                            <button
                                                                onClick={() => moveTask(task.id, column.id === "done" ? "inprogress" : "todo")}
                                                                className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-white/[0.05] transition-colors"
                                                            >
                                                                ← Voltar
                                                            </button>
                                                        )}
                                                        {column.id !== "done" && (
                                                            <button
                                                                onClick={() => moveTask(task.id, column.id === "todo" ? "inprogress" : "done")}
                                                                className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-white/[0.05] transition-colors"
                                                            >
                                                                Avançar →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all flex-shrink-0 absolute top-2 right-2"
                                            >
                                                <Trash2 size={14} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Empty state */}
                                {getTasksByStatus(column.id).length === 0 && addingToColumn !== column.id && (
                                    <div className="text-center py-10 text-zinc-700 text-sm font-serif italic">
                                        Nenhuma tarefa
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
