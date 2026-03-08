import { AuthGuard } from "@/components/auth/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNav } from "@/components/top-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-background">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <TopNav />
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
