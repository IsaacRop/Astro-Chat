"use server";

import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const nickname = formData.get("nickname") as string;
    const fullName = formData.get("fullName") as string;

    if (!nickname || nickname.length < 2) {
        return { error: "O apelido deve ter pelo menos 2 caracteres." };
    }

    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: fullName, // Update standard full_name
            nickname: nickname, // Custom field
        },
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard"); // Update sidebar name potentially
    return { success: "Perfil atualizado com sucesso." };
}

export async function deleteAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Não autenticado." };
    }

    // NOTE: Deleting a user requires the SERVICE_ROLE_KEY.
    // Standard client cannot delete users.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is missing.");
        return { error: "Erro de configuração no servidor. Contate o suporte." };
    }

    const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    );

    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (error) {
        return { error: "Falha ao excluir conta: " + error.message };
    }

    // Sign out the current session just in case
    await supabase.auth.signOut();

    return { success: true };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
