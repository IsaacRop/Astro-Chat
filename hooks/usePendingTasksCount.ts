"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function usePendingTasksCount() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const supabase = createClient();
        let channelRef: ReturnType<typeof supabase.channel> | null = null;

        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fetchCount = async () => {
                const { count: c, error } = await supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.id)
                    .neq("status", "done");
                if (!error && c !== null) setCount(c);
            };

            await fetchCount();

            channelRef = supabase
                .channel("pending-tasks")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "tasks",
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => fetchCount()
                )
                .subscribe();
        }

        init();

        return () => {
            if (channelRef) supabase.removeChannel(channelRef);
        };
    }, []);

    return count;
}
