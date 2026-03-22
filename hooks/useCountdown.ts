import { useEffect, useState } from "react";

export function useCountdown(resetAt: string | null): string {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!resetAt) {
            setTimeLeft("");
            return;
        }

        const update = () => {
            const diff = new Date(resetAt).getTime() - Date.now();

            if (diff <= 0) {
                setTimeLeft("Renovando...");
                return;
            }

            const hours = Math.floor(diff / 3_600_000);
            const minutes = Math.floor((diff % 3_600_000) / 60_000);
            const seconds = Math.floor((diff % 60_000) / 1_000);

            setTimeLeft(
                `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds.toString().padStart(2, "0")}s`
            );
        };

        update();
        const interval = setInterval(update, 1_000);
        return () => clearInterval(interval);
    }, [resetAt]);

    return timeLeft;
}
