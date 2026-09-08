import React, { useState, useEffect } from 'react'
import type { HourSlot, DaySummaryStats } from '../types'
import { X, Moon, Clock, Maximize2, Minimize2 } from 'lucide-react'

interface StandbyModeProps {
  isOpen: boolean
  onClose: () => void
  slots: HourSlot[]
  stats: DaySummaryStats
  selectedDate: string
}

export const StandbyMode: React.FC<StandbyModeProps> = ({
  isOpen,
  onClose,
  slots,
  stats,
  selectedDate,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Horloge en temps réel (seconde par seconde)
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  // Quitter avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Gestion du plein écran navigateur
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  if (!isOpen) return null

  const hoursStr = currentTime.getHours().toString().padStart(2, '0')
  const minutesStr = currentTime.getMinutes().toString().padStart(2, '0')
  const secondsStr = currentTime.getSeconds().toString().padStart(2, '0')

  const dateObj = new Date(selectedDate + 'T12:00:00')
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase()
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  const currentHourNum = currentTime.getHours()
  const dayPercent = Math.min(100, Math.round((stats.totalHours / 24) * 100))

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-fade-in">
      {/* Barre supérieure Nothing OS */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto text-zinc-500 font-mono-tech text-xs tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="font-dot text-white text-sm tracking-wider">TIMDOT // STANDBY</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-mono-tech font-bold"
            title="Quitter le mode veille (Échap)"
          >
            <X size={14} />
            <span>QUITTER</span>
          </button>
        </div>
      </div>

      {/* Contenu central : Horloge géante + Matrice 24 points */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-3xl mx-auto text-center space-y-8">
        {/* Date stylisée */}
        <div className="font-mono-tech text-sm sm:text-base tracking-[0.25em] text-zinc-400 font-semibold uppercase">
          {dayName} · {dateFormatted}
        </div>

        {/* Horloge géante Dot-Matrix Nothing OS */}
        <div className="flex items-baseline justify-center font-dot font-bold tracking-tight text-white select-none">
          <span className="text-7xl sm:text-8xl md:text-9xl leading-none">
            {hoursStr}
          </span>
          <span className="text-6xl sm:text-7xl md:text-8xl leading-none mx-2 text-zinc-500 animate-pulse">
            :
          </span>
          <span className="text-7xl sm:text-8xl md:text-9xl leading-none">
            {minutesStr}
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl text-[#FF9028] ml-3 font-mono-tech">
            {secondsStr}
          </span>
        </div>

        {/* Matrice des 24 heures en version Standby haute visibilité */}
        <div className="w-full bg-white/5 rounded-3xl p-6 sm:p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-400 mb-5 px-1">
            <span className="tracking-wider uppercase">CYCLE 24H EN COURS</span>
            <span className="font-dot text-white font-bold">{stats.totalHours}H / 24H · {dayPercent}%</span>
          </div>

          {/* Grille 24 points (12 x 2) */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-3 sm:gap-4 justify-items-center">
            {slots.map((slot) => {
              const isCurrent = slot.hour === currentHourNum
              let dotBg = 'bg-white/10 border border-white/10'

              if (slot.isFilled && slot.matchingEntry) {
                if (slot.isNight) {
                  dotBg = 'bg-zinc-700 border border-zinc-500'
                } else if (slot.matchingEntry.type === 'pro') {
                  dotBg = 'bg-white border-white text-black'
                } else if (slot.matchingEntry.type === 'perso') {
                  dotBg = 'bg-[#F59E0B] border-[#F59E0B]'
                } else if (slot.matchingEntry.type === 'entreprises') {
                  dotBg = 'bg-[#3B82F6] border-[#3B82F6]'
                }
              }

              return (
                <div key={slot.hour} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${dotBg} ${
                      isCurrent ? 'ring-2 ring-[#FF9028] ring-offset-2 ring-offset-black scale-110' : ''
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full bg-[#FF9028] animate-ping opacity-40" />
                    )}
                    {slot.isNight ? (
                      <Moon size={12} className="text-zinc-300" />
                    ) : (
                      <span className="font-mono-tech text-[9px] font-bold opacity-60">
                        {slot.hour}h
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Légende minimaliste en bas */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10 text-xs font-mono-tech text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span>PRO ({stats.byType.find((t) => t.type === 'pro')?.hours || 0}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span>PERSO ({stats.byType.find((t) => t.type === 'perso')?.hours || 0}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <span>ENTP ({stats.byType.find((t) => t.type === 'entreprises')?.hours || 0}h)</span>
            </div>
            {stats.sleepHours > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span>SOMMEIL ({stats.sleepHours}h)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Standby */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between text-zinc-500 font-mono-tech text-[11px] pt-4 border-t border-white/10">
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>Appuyez sur Échap ou cliquez sur QUITTER pour reprendre</span>
        </span>
        <span className="text-[#FF9028] font-bold">NOTHING OS STANDBY MODE</span>
      </div>
    </div>
  )
}
