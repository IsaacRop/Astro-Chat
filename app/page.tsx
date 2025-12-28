import { AstroMascot } from "@/components/AstroMascot";
import { OrbitalMenu } from "@/components/OrbitalMenu";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden relative selection:bg-accent-purple/30 selection:text-foreground">

      {/* Background Decor - Optional subtle gradient or noise could go here */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-blue/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Main Hero Container */}
      <div className="z-10 flex flex-col items-center justify-center gap-8">

        {/* Title */}
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground to-accent-purple drop-shadow-sm">
          Astro
        </h1>

        <p className="font-sans text-lg md:text-xl text-muted-foreground max-w-md text-center">
          Next Gen AI Assistant
        </p>

        {/* Orbit System */}
        <OrbitalMenu>
          <AstroMascot />
        </OrbitalMenu>

      </div>

    </main>
  );
}
