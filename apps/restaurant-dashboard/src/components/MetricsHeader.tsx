import React from 'react';

interface MetricsProps {
  activeCount: number;
  totalRevenue: number;
  avgPrepMinutes: number;
  isOpen: boolean;
  onToggleStatus: () => void;
}

export const MetricsHeader: React.FC<MetricsProps> = ({
  activeCount,
  totalRevenue,
  avgPrepMinutes,
  isOpen,
  onToggleStatus
}) => {
  return (
    <header className="bg-stone-900 border-b border-stone-800 text-stone-100 p-6 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Kitchen Status */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-2xl font-serif font-black shadow-inner">
            F
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight">Forno d&apos;Oro Trattoria</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${
                isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isOpen ? 'Kitchen Live' : 'Kitchen Paused'}
              </span>
            </div>
            <p className="text-xs text-stone-400">Fort Kochi • Woodfired Sourdough &amp; Trattoria Specialties</p>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="text-xs text-stone-400 block uppercase tracking-wider">Active Pipeline</span>
            <span className="text-2xl font-bold text-amber-400">{activeCount}</span>
            <span className="text-xs text-stone-500 ml-1">tickets</span>
          </div>

          <div className="h-8 w-px bg-stone-800" />

          <div className="text-right">
            <span className="text-xs text-stone-400 block uppercase tracking-wider">Today&apos;s Gross</span>
            <span className="text-2xl font-bold text-emerald-400">₹{totalRevenue.toLocaleString()}</span>
          </div>

          <div className="h-8 w-px bg-stone-800" />

          <div className="text-right">
            <span className="text-xs text-stone-400 block uppercase tracking-wider">Avg Prep Time</span>
            <span className="text-2xl font-bold text-stone-200">{avgPrepMinutes}</span>
            <span className="text-xs text-stone-500 ml-1">mins</span>
          </div>

          <button
            onClick={onToggleStatus}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isOpen 
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isOpen ? 'Pause Orders' : 'Go Live'}
          </button>
        </div>
      </div>
    </header>
  );
};
