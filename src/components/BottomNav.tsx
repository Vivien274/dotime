import React from 'react'
import { Calendar, Timer, Monitor } from 'lucide-react'

export type NavTab = 'tracker' | 'pomodoro'

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  onOpenStandby: () => void
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenStandby,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-sm px-3 pointer-events-auto">
      <nav className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#181818]/90 backdrop-blur-2xl border border-white/20 shadow-2xl text-white">
        {/* Onglet Tracker */}
        <button
          onClick={() => onTabChange('tracker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'tracker'
              ? 'bg-white text-[#181818] shadow-lg scale-102'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Calendar size={14} className={activeTab === 'tracker' ? 'text-[#181818]' : 'text-zinc-400'} />
          <span>TRACKER</span>
        </button>

        {/* Onglet Pomodoro */}
        <button
          onClick={() => onTabChange('pomodoro')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'pomodoro'
              ? 'bg-[#FF9028] text-white shadow-lg scale-102'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Timer size={14} className={activeTab === 'pomodoro' ? 'text-white' : 'text-zinc-400'} />
          <span>POMODORO</span>
        </button>

        {/* Déclencheur Standby */}
        <button
          onClick={onOpenStandby}
          title="Mode Écran de veille (Standby)"
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Monitor size={15} />
        </button>
      </nav>
    </div>
  )
}
