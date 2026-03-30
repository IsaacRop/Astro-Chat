"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProfileForm } from "@/components/profile-form";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
                <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
                <p className="mt-4 text-muted-foreground text-sm">Carregando perfil...</p>
            </div>
        );
    }

    if (!user) {
        router.push("/");
        return null;
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
                <ProfileForm user={user} />
            </main>
        </div>
    );
}
