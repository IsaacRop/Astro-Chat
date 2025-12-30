"use client";

import { Header } from "@/components/Header";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
    const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);

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
            createdAt: Date.now(),
        };

        setTasks((prev) => [...prev, newTask]);
        setNewTaskTitle("");
        setAddingToColumn(null);
    }, [newTaskTitle]);

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
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Tasks" backLink="/" />

            {/* Mobile: Vertical Stack / Desktop: Horizontal Kanban */}
            <main className="flex-1 p-4 md:p-6 overflow-x-auto">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:min-w-max">
                    {columns.map((column) => (
                        <div
                            key={column.id}
                            className="w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: `var(--${column.color})` }}
                                    />
                                    <h2 className="font-serif font-bold text-base md:text-lg">{column.title}</h2>
                                    <span className="text-muted-foreground text-sm ml-1">
                                        ({getTasksByStatus(column.id).length})
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAddingToColumn(column.id)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 bg-card/30 border border-border rounded-xl p-3 space-y-3 min-h-[200px] md:min-h-[400px]">
                                {/* Add Task Input */}
                                <AnimatePresence>
                                    {addingToColumn === column.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                                                <input
                                                    type="text"
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleAddTask(column.id);
                                                        if (e.key === "Escape") setAddingToColumn(null);
                                                    }}
                                                    placeholder="Task title..."
                                                    autoFocus
                                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAddTask(column.id)}
                                                        className="flex-1 px-3 py-1.5 rounded-lg bg-accent-green/90 text-background text-sm font-medium hover:bg-accent-green transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        onClick={() => setAddingToColumn(null)}
                                                        className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
                                                    >
                                                        Cancel
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
                                        className="bg-card border border-border rounded-lg p-3 group hover:shadow-md hover:border-accent-purple/30 transition-all"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="pt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hidden md:block">
                                                <GripVertical size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-foreground text-sm font-medium break-words">
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <div
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: `var(--accent-${task.color})` }}
                                                    />
                                                    {/* Move buttons - Always visible on mobile */}
                                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        {column.id !== "todo" && (
                                                            <button
                                                                onClick={() => moveTask(task.id, column.id === "done" ? "inprogress" : "todo")}
                                                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                                                            >
                                                                ← Back
                                                            </button>
                                                        )}
                                                        {column.id !== "done" && (
                                                            <button
                                                                onClick={() => moveTask(task.id, column.id === "todo" ? "inprogress" : "done")}
                                                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                                                            >
                                                                Next →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1 rounded md:opacity-0 md:group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Empty state */}
                                {getTasksByStatus(column.id).length === 0 && addingToColumn !== column.id && (
                                    <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
                                        No tasks
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
