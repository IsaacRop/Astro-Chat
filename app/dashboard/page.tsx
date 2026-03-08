import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserNotes } from "@/app/actions/study";
import { getTasks, getIdeas } from "@/app/actions/productivity";
import { getUserChats } from "@/app/actions/chat";
import { DashboardHome } from "@/components/dashboard-home";

function calcStreak(dates: string[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = new Set(
        dates.map((d) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            return x.getTime();
        })
    );
    let streak = 0;
    let cur = today.getTime();
    while (days.has(cur)) {
        streak++;
        cur -= 86400000;
    }
    return streak;
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/");

    const [notes, tasks, ideas, chats] = await Promise.all([
        getUserNotes(),
        getTasks(),
        getIdeas(),
        getUserChats(),
    ]);

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const notesThisWeek = notes.filter((n) => new Date(n.updated_at) > weekAgo).length;
    const pendingTasks = tasks.filter((t) => t.status !== "done").length;
    const tasksThisWeek = tasks.filter((t) => new Date(t.created_at) > weekAgo).length;
    const streakDays = calcStreak([
        ...notes.map((n) => n.updated_at),
        ...tasks.map((t) => t.created_at),
        ...ideas.map((i) => i.created_at),
        ...chats.map((c) => c.updated_at),
    ]);

    const recentActivity = [
        ...notes.slice(0, 4).map((n) => ({ type: "note",  title: n.title || "Nota",          action: "Nota atualizada",      time: n.updated_at,  href: "/notes/" + n.id })),
        ...tasks.slice(0, 3).map((t) => ({ type: "task",  title: t.title,                    action: "Tarefa " + (t.status === "done" ? "concluída" : "adicionada"), time: t.created_at, href: "/tasks" })),
        ...ideas.slice(0, 3).map((i) => ({ type: "idea",  title: i.title || (i.content ? i.content.slice(0, 45) : "Ideia"), action: "Ideia capturada", time: i.created_at, href: "/ideas" })),
        ...chats.slice(0, 3).map((c) => ({ type: "chat",  title: c.title || "Conversa",      action: "Conversa com Otto",    time: c.updated_at,  href: "/dashboard/chat/" + c.id })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

    const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "você";

    return (
        <DashboardHome
            userName={userName}
            stats={{ notesCount: notes.length, notesThisWeek, pendingTasks, tasksThisWeek, ideasCount: ideas.length, streakDays }}
            recentActivity={recentActivity}
            latestChatId={chats[0]?.id ?? null}
        />
    );
}
