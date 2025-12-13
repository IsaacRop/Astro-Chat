'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft, Network } from 'lucide-react';
import Link from 'next/link';

// Dynamic import the entire GraphVisualization component with SSR disabled
const GraphVisualization = dynamic(
    () => import('@/components/GraphVisualization'),
    {
        ssr: false,
        loading: () => (
            <div className="flex-1 flex items-center justify-center bg-black">
                <div className="text-zinc-500">Loading graph...</div>
            </div>
        ),
    }
);

export default function CadernosPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-gray-200">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                            <Network size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg">Cadernos</h1>
                            <p className="text-zinc-500 text-xs">Knowledge Graph</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Dynamic Graph Component */}
            <GraphVisualization />
        </div>
    );
}
