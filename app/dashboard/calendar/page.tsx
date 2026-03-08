import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";

export default async function CalendarPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <CalendarIcon size={24} />
                        </div>
                        <h1 className="text-2xl font-serif text-foreground">Calendário</h1>
                    </div>
                </div>

                {/* Content placeholder */}
                <div className="flex-1 bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
                        <CalendarIcon size={32} className="text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-medium text-foreground mb-2">Agenda em breve</h2>
                    <p className="text-muted-foreground max-w-sm">
                        O sistema de calendário e eventos está sendo construído. Logo você poderá gerenciar seus prazos aqui.
                    </p>
                </div>
            </div>
        </main>
    );
}
