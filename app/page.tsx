import { OctopusMascot } from "@/components/OctopusMascot";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden relative selection:bg-accent-purple/30 selection:text-foreground">

      {/* Background Decor - Cosmic gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-purple/10 via-accent-blue/5 to-transparent opacity-60 pointer-events-none" />

      {/* Starfield effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-1 bg-white/20 rounded-full top-[10%] left-[15%] animate-pulse" />
        <div className="absolute w-0.5 h-0.5 bg-white/30 rounded-full top-[20%] left-[80%] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-1 h-1 bg-white/15 rounded-full top-[70%] left-[25%] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white/25 rounded-full top-[85%] left-[70%] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute w-1 h-1 bg-white/20 rounded-full top-[45%] left-[90%] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Hero Container */}
      <div className="z-10 flex flex-col items-center justify-center gap-4">

        {/* Title */}
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground via-accent-purple to-foreground drop-shadow-sm">
          Astro
        </h1>

        <p className="font-sans text-lg md:text-xl text-muted-foreground max-w-md text-center mb-4">
          Next Gen AI Assistant
        </p>

        {/* Octopus Mascot with Interactive Tentacles */}
        <OctopusMascot />

      </div>

      {/* Bottom Star Decoration */}
      <div className="absolute bottom-8 right-8 text-foreground/30">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>

    </main>
  );
}
