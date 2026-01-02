import { OctopusMascot } from "@/components/OctopusMascot";
import { InfiniteGrid } from "@/components/ui/infinite-grid";
import { Typewriter } from "@/components/ui/typewriter";

export default function Home() {
  return (
    <InfiniteGrid className="min-h-[100dvh] selection:bg-accent-purple/30 selection:text-foreground px-4 py-8 md:px-8">
      {/* Main Hero Container */}
      <div className="z-10 flex flex-col items-center justify-center gap-2 md:gap-4 w-full max-w-full">
        {/* Title - Responsive text sizes */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground via-accent-purple to-foreground drop-shadow-sm">
          Astro
        </h1>

        {/* Subtitle with Typewriter effect */}
        <p className="font-sans text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-xs sm:max-w-sm md:max-w-md text-center mb-2 md:mb-4 px-2">
          <Typewriter
            text={[
              "Assistente de IA de Próxima Geração",
              "Seu Companheiro de Conhecimento",
              "Pense com mais inteligência",
              "Organize ideias sem esforço",
              "Seu Centro de Inteligência Pessoal",
            ]}
            speed={60}
            deleteSpeed={35}
            waitTime={2500}
            initialDelay={500}
            cursorChar="_"
            cursorClassName="text-accent-purple ml-0.5"
            className="text-muted-foreground"
          />
        </p>

        {/* Octopus Mascot with Interactive Tentacles - Responsive container */}
        <div className="w-full max-w-[95vw] sm:max-w-[85vw] md:max-w-[800px] flex items-center justify-center">
          <OctopusMascot />
        </div>
      </div>

      {/* Bottom Star Decoration - Responsive positioning */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-foreground/30 z-20">
        <svg
          width="24"
          height="24"
          className="md:w-8 md:h-8"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>
    </InfiniteGrid>
  );
}
