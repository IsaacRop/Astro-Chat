import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
        return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "Arquivo muito grande. Máximo 2 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    // Upload to Supabase Storage (upsert to overwrite previous avatar)
    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
        });

    if (uploadError) {
        console.error("[avatar upload]", uploadError);
        return NextResponse.json({ error: "Falha ao enviar imagem." }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    // Append cache-buster so the browser picks up the new image
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
    });

    if (updateError) {
        console.error("[avatar updateUser]", updateError);
        return NextResponse.json({ error: "Imagem salva, mas falha ao atualizar perfil." }, { status: 500 });
    }

    // Also update the profiles table
    await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

    return NextResponse.json({ avatarUrl });
}
