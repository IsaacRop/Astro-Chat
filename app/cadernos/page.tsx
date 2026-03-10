'use client';

import dynamic from 'next/dynamic';

// Dynamic import the entire GraphVisualization component with SSR disabled
const GraphVisualization = dynamic(
    () => import('@/components/GraphVisualization'),
    {
        ssr: false,
        loading: () => (
            <div className="flex-1 flex items-center justify-center bg-background px-4 min-h-[200px]">
                <div className="text-muted-foreground animate-pulse text-center text-sm">Carregando grafo...</div>
            </div>
        ),
    }
);

export default function CadernosPage() {
    return (
            <div className="flex-1 relative overflow-hidden bg-[#F5F9F6]">
                <GraphVisualization />
            </div>
    );
}
