'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';

// Dynamic import the entire GraphVisualization component with SSR disabled
const GraphVisualization = dynamic(
    () => import('@/components/GraphVisualization'),
    {
        ssr: false,
        loading: () => (
            <div className="flex-1 flex items-center justify-center bg-background px-4">
                <div className="text-muted-foreground animate-pulse text-center text-sm md:text-base">Loading cosmic graph...</div>
            </div>
        ),
    }
);

export default function CadernosPage() {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden">
            {/* Shared Header */}
            <Header title="Cadernos" />

            {/* Dynamic Graph Component - fits remaining height */}
            <div className="flex-1 relative overflow-hidden bg-background">
                <GraphVisualization />
            </div>
        </div>
    );
}
