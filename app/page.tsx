import { LoginButton } from "@/components/LoginButton";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { DashboardGrid } from "@/components/dashboard-grid";
import { FeedbackDialog } from "@/components/feedback-dialog";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen md:h-screen w-full bg-[#0C0C0D] flex flex-col p-4 md:p-6 overflow-y-auto overflow-x-hidden md:overflow-hidden">
      {/* Content Container */}
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 h-full relative z-10">

        {/* Header Section - Compact */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#1A1A1C] border border-white/[0.05] px-6 py-6 md:px-8 md:py-8 flex flex-row items-center justify-between shrink-0">
          <div className="relative z-10 flex items-baseline gap-4">
            <h1 className="text-3xl md:text-3xl font-serif text-white/90 tracking-tighter">
              Otto
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-full">
              Beta
            </span>
            <p className="text-zinc-500 text-sm font-sans hidden md:block">
              Assistente de IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FeedbackDialog>
              <button className="flex items-center gap-2 px-4 py-2 text-base font-medium text-zinc-400 hover:text-white rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300">
                Feedback
              </button>
            </FeedbackDialog>
            {!user ? (
              <LoginButton />
            ) : (
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 relative">
                  {user.user_metadata.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User ID"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-xs font-serif text-indigo-300">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                  {user.user_metadata.full_name?.split(" ")[0] || "Perfil"}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Bento Grid - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <DashboardGrid isLoggedIn={!!user} />
        </div>
      </div>
    </div>
  );
}
