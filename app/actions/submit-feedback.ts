"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function submitFeedback(formData: FormData) {
    const supabase = await createClient();

    // 1. Pegar os dados do formulário
    const type = formData.get("type") as string;
    const message = formData.get("message") as string;

    if (!type || !message) {
        return { success: false, message: "Campos obrigatórios faltando." };
    }

    // 2. Pegar o utilizador atual (para salvar o e-mail automaticamente)
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Inserir no Supabase (com ou sem email, dependendo se está logado)
    const { error } = await supabase.from("feedbacks").insert({
        type,
        message,
        user_email: user?.email || null,
    });

    if (error) {
        console.error("SUPABASE ERROR - submitFeedback:", error);
        return { success: false, message: `Erro: ${error.message} (Code: ${error.code})` };
    }

    return { success: true, message: "Obrigado! Feedback recebido." };
}
