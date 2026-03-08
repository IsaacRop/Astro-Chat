import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNav } from "@/components/top-nav";
import { createClient } from "@/utils/supabase/server";
import { LoginButton } from "@/components/LoginButton";
import Link from "next/link";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Otto",
  description: "Seu Assistente de Estudos",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const HeaderLogin = () => (
    <LoginButton className="h-[34px] px-4 py-1.5 text-[13px] bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-none rounded-lg" />
  );

  const ProfileLink = () => (
    <Link href="/dashboard" className="h-[34px] flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
      Acessar Perfil
    </Link>
  );

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased font-sans bg-background text-foreground overflow-x-hidden`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <div className="flex h-screen overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
              <TopNav rightElement={!user ? <HeaderLogin /> : <ProfileLink />} />
              <div className="flex-1 overflow-auto relative">
                {children}
              </div>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html >
  );
}
