'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';

// Dynamic import the entire GraphVisualization component with SSR disabled
const GraphVisualization = dynamic(
    () => import('@/components/GraphVisualization'),
    {
        ssr: false,
        loading: () => (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-muted-foreground animate-pulse">Loading cosmic graph...</div>
            </div>
        ),
    }
);

export default function CadernosPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Shared Header */}
            <Header title="Cadernos" backLink="/" />

            {/* Dynamic Graph Component - Needs to fit remaining height */}
            <div className="flex-1 relative overflow-hidden bg-background">
                <GraphVisualization />
            </div>
        </div>
    );
}
