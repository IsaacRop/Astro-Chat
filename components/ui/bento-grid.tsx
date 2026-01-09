"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export interface BentoItem {
    title: string;
    description: string;
    icon: ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
    href?: string;
    onClick?: () => void;
    isLoading?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

// Safe col-span mapping for Tailwind
const colSpanClasses: Record<number, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
};

export function BentoGrid({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 w-full h-full">
            {items.map((item, index) => {
                const Content = () => (
                    <>
                        <div
                            className={`absolute inset-0 ${item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                                } transition-opacity duration-500`}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px]" />
                        </div>

                        <div className="relative flex flex-col h-full z-10 p-5 md:p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] transition-colors duration-300",
                                    item.isLoading ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-100"
                                )}>
                                    {item.isLoading ? (
                                        <Loader2 size={22} className="animate-spin" />
                                    ) : (
                                        item.icon
                                    )}
                                </div>
                                {item.status && (
                                    <span
                                        className={cn(
                                            "text-[10px] items-center px-2 py-1 rounded-full border uppercase tracking-wider font-medium",
                                            "bg-white/[0.03] border-white/[0.05] text-zinc-500",
                                            "transition-colors duration-300 group-hover:bg-white/[0.05] group-hover:text-zinc-300"
                                        )}
                                    >
                                        {item.status}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 mt-auto">
                                <h3 className="font-serif text-lg md:text-xl text-zinc-200 group-hover:text-white transition-colors duration-300">
                                    {item.title}
                                    {item.meta && (
                                        <span className="ml-2 text-xs text-zinc-600 font-sans font-normal opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {item.meta}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs md:text-sm text-zinc-500 group-hover:text-zinc-400 leading-relaxed font-sans transition-colors duration-300 line-clamp-2">
                                    {item.isLoading ? "Criando..." : item.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05] opacity-50 group-hover:opacity-100 transition-all duration-300">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                                    {item.tags?.slice(0, 2).map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.02]"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                    {item.cta || "→"}
                                </span>
                            </div>
                        </div>

                        <div
                            className={`absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        />
                    </>
                );

                const containerClasses = cn(
                    "group relative rounded-2xl overflow-hidden transition-all duration-500 h-full min-h-[140px]",
                    "border border-white/[0.05] bg-[#1A1A1C]",
                    "hover:shadow-2xl hover:shadow-black/50 hover:border-white/[0.1]",
                    "hover:-translate-y-1 will-change-transform",
                    colSpanClasses[item.colSpan || 1] || "md:col-span-1",
                    {
                        "shadow-xl border-white/[0.1]": item.hasPersistentHover,
                        "opacity-70 pointer-events-none": item.isLoading,
                    }
                );

                // If onClick is provided, use a button
                if (item.onClick) {
                    return (
                        <button
                            key={index}
                            onClick={item.onClick}
                            disabled={item.isLoading}
                            className={cn(containerClasses, "text-left cursor-pointer")}
                        >
                            <Content />
                        </button>
                    );
                }

                // If href is provided, use Link
                if (item.href) {
                    return (
                        <Link key={index} href={item.href} className={containerClasses}>
                            <Content />
                        </Link>
                    );
                }

                // Default: just a div
                return (
                    <div key={index} className={containerClasses}>
                        <Content />
                    </div>
                );
            })}
        </div>
    );
}
