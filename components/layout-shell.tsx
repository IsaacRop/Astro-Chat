"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNav } from "@/components/top-nav";

interface LayoutShellProps {
    children: React.ReactNode;
    rightElement?: React.ReactNode;
}

export function LayoutShell({ children, rightElement }: LayoutShellProps) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar automatically on route change
    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen h-[100dvh] overflow-hidden bg-background">
            <AppSidebar
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                {/* TopNav is hidden on mobile via its own className */}
                <TopNav
                    rightElement={rightElement}
                    onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)}
                />
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </div>

            {/* Mobile: floating hamburger / X button (fixed, always above sidebar) */}
            <button
                onClick={() => setMobileSidebarOpen((v) => !v)}
                className="md:hidden fixed top-4 left-4 z-[60] flex items-center justify-center w-11 h-11 rounded-lg bg-[#1E2E25] text-white shadow-lg hover:bg-[#2A3E32] transition-colors duration-150"
                aria-label={mobileSidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
                {mobileSidebarOpen
                    ? <X size={20} strokeWidth={2} />
                    : <Menu size={20} strokeWidth={2} />
                }
            </button>
        </div>
    );
}
