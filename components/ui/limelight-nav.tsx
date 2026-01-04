"use client";

import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    MessageCircle,
    Calendar,
    CheckSquare,
    FileText,
    Lightbulb,
    Network,
    Star,
    Settings,
} from 'lucide-react';

// --- Types ---
type NavItem = {
    id: string;
    icon: React.ReactElement;
    label: string;
    href: string;
};

// Navigation items for Otto app
const navItems: NavItem[] = [
    { id: 'home', icon: <Home />, label: 'Início', href: '/' },
    { id: 'chat', icon: <MessageCircle />, label: 'Chat', href: '/chat' },
    { id: 'calendar', icon: <Calendar />, label: 'Calendário', href: '/calendar' },
    { id: 'tasks', icon: <CheckSquare />, label: 'Tarefas', href: '/tasks' },
    { id: 'notes', icon: <FileText />, label: 'Notas', href: '/notes' },
    { id: 'ideas', icon: <Lightbulb />, label: 'Ideias', href: '/ideas' },
    { id: 'cadernos', icon: <Network />, label: 'Cadernos', href: '/cadernos' },
    { id: 'favorites', icon: <Star />, label: 'Favoritos', href: '/favorites' },
    { id: 'settings', icon: <Settings />, label: 'Config', href: '/settings' },
];

type LimelightNavProps = {
    className?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights the active item.
 */
export const LimelightNav = ({ className = "" }: LimelightNavProps) => {
    const pathname = usePathname();
    const router = useRouter();

    // Find current active index based on pathname
    const getActiveIndex = () => {
        const index = navItems.findIndex(item => {
            if (item.href === '/') return pathname === '/';
            return pathname.startsWith(item.href);
        });
        return index >= 0 ? index : 0;
    };

    const [activeIndex, setActiveIndex] = useState(getActiveIndex());
    const [isReady, setIsReady] = useState(false);
    const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const limelightRef = useRef<HTMLDivElement | null>(null);

    // Update active index when pathname changes
    React.useEffect(() => {
        setActiveIndex(getActiveIndex());
    }, [pathname]);

    useLayoutEffect(() => {
        if (navItems.length === 0) return;

        const limelight = limelightRef.current;
        const activeItem = navItemRefs.current[activeIndex];

        if (limelight && activeItem) {
            const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
            limelight.style.left = `${newLeft}px`;

            if (!isReady) {
                setTimeout(() => setIsReady(true), 50);
            }
        }
    }, [activeIndex, isReady]);

    const handleItemClick = (index: number, href: string) => {
        setActiveIndex(index);
        router.push(href);
    };

    return (
        <nav className={`relative inline-flex items-center h-12 md:h-14 rounded-xl bg-card/80 backdrop-blur-md border border-border px-1 md:px-2 shadow-lg ${className}`}>
            {navItems.map(({ id, icon, label, href }, index) => (
                <button
                    key={id}
                    ref={el => { navItemRefs.current[index] = el; }}
                    className="relative z-20 flex h-full cursor-pointer items-center justify-center px-2.5 md:px-4 transition-colors"
                    onClick={() => handleItemClick(index, href)}
                    aria-label={label}
                    title={label}
                >
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                        className: `w-4 h-4 md:w-5 md:h-5 transition-all duration-200 ${activeIndex === index
                            ? 'opacity-100 text-accent-purple scale-110'
                            : 'opacity-50 text-foreground hover:opacity-70'
                            }`,
                    })}
                </button>
            ))}

            {/* Limelight effect */}
            <div
                ref={limelightRef}
                className={`absolute top-0 z-10 w-8 md:w-10 h-[4px] rounded-full bg-accent-purple shadow-[0_20px_25px_var(--accent-purple)] ${isReady ? 'transition-[left] duration-300 ease-out' : ''
                    }`}
                style={{ left: '-999px' }}
            >
                <div className="absolute left-[-30%] top-[4px] w-[160%] h-10 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-accent-purple/30 to-transparent pointer-events-none" />
            </div>
        </nav>
    );
};

export default LimelightNav;
