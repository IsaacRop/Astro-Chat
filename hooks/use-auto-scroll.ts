import { useRef, useEffect, useCallback } from "react";

const SCROLL_THRESHOLD = 100;

export function useAutoScroll(deps: unknown[]) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isUserScrollingRef = useRef(false);

    const checkIfAtBottom = useCallback(() => {
        const el = containerRef.current;
        if (!el) return true;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        return distanceFromBottom <= SCROLL_THRESHOLD;
    }, []);

    // Track user scroll position
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleScroll = () => {
            isUserScrollingRef.current = !checkIfAtBottom();
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [checkIfAtBottom]);

    // Auto-scroll when dependencies change, only if user is at bottom
    useEffect(() => {
        if (!isUserScrollingRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { containerRef, bottomRef };
}
