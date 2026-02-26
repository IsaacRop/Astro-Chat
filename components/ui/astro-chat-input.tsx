"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
    Plus,
    ArrowUp,
    X,
    FileText,
    Loader2,
    Archive,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* --- UTILS --- */
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/* --- FILE PREVIEW CARD --- */
interface AttachedFile {
    id: string;
    file: File;
    type: string;
    preview: string | null;
    uploadStatus: string;
}

interface FilePreviewCardProps {
    file: AttachedFile;
    onRemove: (id: string) => void;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
    file,
    onRemove,
}) => {
    const isImage = file.type.startsWith("image/") && file.preview;

    return (
        <div
            className={cn(
                "relative group flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden",
                "border border-border bg-card animate-in fade-in-0 slide-in-from-bottom-2",
                "transition-all hover:border-accent-purple/50"
            )}
        >
            {isImage ? (
                <div className="w-full h-full relative">
                    <img
                        src={file.preview!}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>
            ) : (
                <div className="w-full h-full p-2 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-muted rounded">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase truncate">
                            {file.file.name.split(".").pop()}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        <p
                            className="text-[10px] font-medium text-foreground truncate"
                            title={file.file.name}
                        >
                            {file.file.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                            {formatFileSize(file.file.size)}
                        </p>
                    </div>
                </div>
            )}

            {/* Remove Button */}
            <button
                onClick={() => onRemove(file.id)}
                className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="w-2.5 h-2.5" />
            </button>

            {/* Upload Status */}
            {file.uploadStatus === "uploading" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
            )}
        </div>
    );
};

/* --- MAIN CHAT INPUT --- */
interface AstroChatInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading?: boolean;
    placeholder?: string;
}

export const AstroChatInput: React.FC<AstroChatInputProps> = ({
    value,
    onChange,
    onSubmit,
    isLoading = false,
    placeholder = "Como posso ajudar você hoje?",
}) => {
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 200) + "px";
        }
    }, [value]);

    // Auto-focus input when loading ends so the user can keep typing
    const prevLoadingRef = useRef(isLoading);
    useEffect(() => {
        if (prevLoadingRef.current && !isLoading) {
            textareaRef.current?.focus();
        }
        prevLoadingRef.current = isLoading;
    }, [isLoading]);

    // File Handling
    const handleFiles = useCallback((newFilesList: FileList | File[]) => {
        const newFiles = Array.from(newFilesList).map((file) => {
            const isImage =
                file.type.startsWith("image/") ||
                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
            return {
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: isImage ? "image/unknown" : file.type || "application/octet-stream",
                preview: isImage ? URL.createObjectURL(file) : null,
                uploadStatus: "pending",
            };
        });

        setFiles((prev) => [...prev, ...newFiles]);

        // Simulate upload completion
        newFiles.forEach((f) => {
            setTimeout(() => {
                setFiles((prev) =>
                    prev.map((p) =>
                        p.id === f.id ? { ...p, uploadStatus: "complete" } : p
                    )
                );
            }, 800 + Math.random() * 500);
        });
    }, []);

    // Drag & Drop
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    // Paste Handling for files
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === "file") {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        if (pastedFiles.length > 0) {
            e.preventDefault();
            handleFiles(pastedFiles);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return; // Block submission during loading
        if (!value.trim() && files.length === 0) return;
        onSubmit(e);
        setFiles([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const hasContent = value.trim() || files.length > 0;

    return (
        <div
            className="relative w-full max-w-4xl mx-auto"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Main Container */}
            <div
                className={cn(
                    "flex flex-col items-stretch transition-all duration-200 relative z-10",
                    "rounded-2xl cursor-text border border-white/[0.05]",
                    "shadow-sm bg-[#1A1A1C] backdrop-blur-xl"
                )}
            >
                <div className="flex flex-col px-3 pt-3 pb-2 gap-2">
                    {/* Attached Files */}
                    {files.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                            {files.map((file) => (
                                <FilePreviewCard
                                    key={file.id}
                                    file={file}
                                    onRemove={(id) =>
                                        setFiles((prev) => prev.filter((f) => f.id !== id))
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="relative">
                        <div className="max-h-48 w-full overflow-y-auto">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={onChange}
                                onPaste={handlePaste}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                disabled={isLoading}
                                className={cn(
                                    "w-full bg-transparent border-0 outline-none",
                                    "text-zinc-200 text-base font-sans",
                                    "placeholder:text-zinc-500",
                                    "resize-none overflow-hidden py-1 leading-relaxed",
                                    "disabled:opacity-50"
                                )}
                                rows={1}
                                autoFocus
                                style={{ minHeight: "1.5em" }}
                            />
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-2 w-full items-center justify-between">
                        {/* Left Tools */}
                        <div className="flex items-center gap-1">
                            {/* Attach Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "inline-flex items-center justify-center",
                                    "h-10 w-10 rounded-lg transition-colors",
                                    "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                                )}
                                type="button"
                                aria-label="Anexar arquivo"
                            >
                                <Plus className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            {/* AI Enhancement indicator */}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] text-zinc-400 text-xs font-medium border border-white/[0.05]">
                                <Sparkles className="w-3 h-3" />
                                <span className="hidden sm:inline">Otto AI</span>
                            </div>
                        </div>

                        {/* Send Button */}
                        <div className="flex items-center">
                            <button
                                onClick={handleSubmit}
                                disabled={!hasContent || isLoading}
                                className={cn(
                                    "inline-flex items-center justify-center",
                                    "h-10 w-10 rounded-lg transition-all duration-200",
                                    hasContent && !isLoading
                                        ? "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-white"
                                        : "bg-white/[0.05] text-zinc-600 cursor-not-allowed"
                                )}
                                type="button"
                                aria-label="Enviar mensagem"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArrowUp className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-[#1A1A1C]/90 border border-white/[0.1] rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
                    <Archive className="w-8 h-8 text-zinc-300 mb-2 animate-bounce" strokeWidth={1.5} />
                    <p className="text-zinc-300 font-medium text-sm font-sans">
                        Solte os arquivos aqui
                    </p>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = "";
                }}
            />
        </div>
    );
};

export default AstroChatInput;
