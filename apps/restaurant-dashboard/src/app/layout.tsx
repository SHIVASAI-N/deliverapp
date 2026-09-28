import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "DeliverApp Kitchen OS | Forno d'Oro Trattoria",
  description: 'Real-time kitchen order dispatch, status state transitions, and menu inventory 86 management.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-stone-950 text-stone-100 min-h-screen flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-stone-950">
        {/* Navigation Bar */}
        <nav className="bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 text-amber-400 font-bold text-lg font-serif">
              <span>🍕</span>
              <span>Kitchen OS</span>
            </Link>
            <div className="flex items-center space-x-1 bg-stone-800/80 p-1 rounded-lg text-xs font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md hover:bg-stone-700 hover:text-white transition-colors text-stone-300"
              >
                Live Orders Pipeline
              </Link>
              <Link
                href="/menu"
                className="px-3 py-1.5 rounded-md hover:bg-stone-700 hover:text-white transition-colors text-stone-300"
              >
                Menu &amp; 86ing
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-stone-400">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Connected: WebSocket / SSE
            </span>
            <span className="text-stone-600">•</span>
            <span className="font-mono">v1.0.0 Prod</span>
          </div>
        </nav>

        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
