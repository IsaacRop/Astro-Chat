import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface NotePageProps {
    params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
    const { id: noteId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Fetch note
    const { data: note, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

    if (error || !note || note.user_id !== user.id) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-[#0C0C0D] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-serif text-zinc-100">{note.title || "Sem título"}</h1>
                </div>

                {/* Content placeholder */}
                <div className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-6 min-h-[400px]">
                    <p className="text-zinc-400">
                        {note.content || "Comece a escrever..."}
                    </p>
                    <p className="text-zinc-600 text-sm mt-8">
                        Editor completo em breve.
                    </p>
                </div>
            </div>
        </main>
    );
}
