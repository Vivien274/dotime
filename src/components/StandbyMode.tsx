import React, { useState, useEffect } from 'react'
import type { HourSlot, DaySummaryStats } from '../types'
import { usePomodoro, POMODORO_PRESETS, type PomodoroMode } from '../hooks/usePomodoro'
import { X, Maximize2, Minimize2, Play, Pause, RotateCcw, Timer, Sparkles } from 'lucide-react'

interface StandbyModeProps {
  isOpen: boolean
  onClose: () => void
  slots: HourSlot[]
  stats: DaySummaryStats
  selectedDate: string
  pomodoro: ReturnType<typeof usePomodoro>
}

export const StandbyMode: React.FC<StandbyModeProps> = ({
  isOpen,
  onClose,
  slots,
  stats,
  selectedDate,
  pomodoro,
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

  const {
    mode: pomoMode,
    timeFormatted: pomoTime,
    isRunning: isPomoRunning,
    taskTitle: pomoTask,
    isBreak: isPomoBreak,
    completedSession: pomoCompleted,
    togglePlay: togglePomo,
    handleReset: resetPomo,
    handleSelectMode: selectPomoMode,
    handleSaveToTimdot,
    dismissCompletedSession,
  } = pomodoro

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col justify-between p-5 sm:p-8 select-none overflow-y-auto animate-fade-in">
      {/* Barre supérieure Nothing OS */}
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto text-zinc-500 font-mono-tech text-xs tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF9028] animate-pulse" />
          <span className="font-dot text-white text-xs tracking-wider">STANDBY</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-[11px] font-mono-tech font-bold"
            title="Quitter le mode veille (Échap)"
          >
            <X size={13} />
            <span>QUITTER</span>
          </button>
        </div>
      </div>

      {/* Contenu central : Horloge géante + Minuteur Pomodoro + Matrice 24 points */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-2xl mx-auto text-center space-y-6 sm:space-y-7 py-4">
        {/* Date stylisée */}
        <div className="font-mono-tech text-xs sm:text-sm tracking-[0.2em] text-zinc-500 font-semibold uppercase">
          {dayName} · {dateFormatted}
        </div>

        {/* Horloge géante Dot-Matrix Nothing OS */}
        <div className="flex items-baseline justify-center font-dot font-bold tracking-tight text-white select-none">
          <span className="text-6xl sm:text-7xl md:text-8xl leading-none">
            {hoursStr}
          </span>
          <span className="text-5xl sm:text-6xl md:text-7xl leading-none mx-1 sm:mx-2 text-zinc-600 animate-pulse">
            :
          </span>
          <span className="text-6xl sm:text-7xl md:text-8xl leading-none">
            {minutesStr}
          </span>
          <span className="text-xl sm:text-2xl md:text-3xl text-[#FF9028] ml-2 sm:ml-3 font-mono-tech">
            {secondsStr}
          </span>
        </div>

        {/* Minuteur Pomodoro intégré dans le mode Standby */}
        <div className="w-full bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase font-bold text-zinc-400">
              <Timer size={13} className={isPomoRunning ? 'text-[#FF9028] animate-pulse' : 'text-zinc-500'} />
              <span>POMODORO // {isPomoBreak ? 'PAUSE' : 'FOCUS'}</span>
            </div>

            {/* Presets rapides de Pomodoro */}
            <div className="flex items-center gap-1">
              {(Object.keys(POMODORO_PRESETS) as PomodoroMode[]).map((m) => {
                const isSelected = pomoMode === m
                return (
                  <button
                    key={m}
                    onClick={() => selectPomoMode(m)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-mono-tech font-bold uppercase transition-all ${
                      isSelected
                        ? 'bg-[#FF9028] text-black font-extrabold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {m === 'focus25' ? '25m' : m === 'focus50' ? '50m' : m === 'shortBreak' ? '5m' : '15m'}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Décompte Pomodoro et sujet */}
            <div className="flex items-center gap-3 text-left">
              <span className="font-dot text-4xl sm:text-5xl font-bold text-white tracking-wider leading-none">
                {pomoTime}
              </span>
              <div className="min-w-0">
                <span className="block font-mono-tech text-[10px] uppercase tracking-wider text-zinc-400 font-semibold truncate max-w-[180px]">
                  {isPomoBreak ? 'Pause détente' : pomoTask}
                </span>
                <span className="block text-[9px] font-mono-tech text-zinc-600">
                  {isPomoRunning ? 'Session active' : 'En pause'}
                </span>
              </div>
            </div>

            {/* Commandes Pomodoro */}
            <div className="flex items-center gap-2">
              <button
                onClick={resetPomo}
                title="Réinitialiser le Pomodoro"
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={togglePomo}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-mono-tech text-xs font-bold uppercase tracking-wider transition-all ${
                  isPomoRunning
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-[#FF9028] text-black hover:bg-[#ff9e3d]'
                }`}
              >
                {isPomoRunning ? (
                  <>
                    <Pause size={13} />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play size={13} className="fill-current" />
                    <span>DÉMARRER</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enregistrement de session terminée depuis le Standby */}
          {pomoCompleted && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-left animate-slide-up">
              <span className="text-[11px] font-mono-tech text-emerald-400">
                🎉 {pomoCompleted.durationMinutes}m de « {pomoCompleted.title} » bouclées
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={dismissCompletedSession}
                  className="px-2 py-1 text-[10px] font-mono-tech text-zinc-500 hover:text-white"
                >
                  IGNORER
                </button>
                <button
                  onClick={handleSaveToTimdot}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-mono-tech font-bold transition-all"
                >
                  <Sparkles size={11} />
                  <span>ENREGISTRER</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Matrice du cycle de 24 heures : points purs épurés & réduits */}
        <div className="w-full bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-400 mb-3.5 px-1">
            <span className="tracking-wider uppercase">CYCLE DE LA JOURNÉE</span>
            <span className="font-dot text-white font-bold">{stats.totalHours}H / 24H · {dayPercent}%</span>
          </div>

          {/* Points purs sans aucun texte à l'intérieur, taille réduite */}
          <div className="grid grid-cols-12 gap-2 sm:gap-2.5 justify-items-center py-1">
            {slots.map((slot) => {
              const isCurrent = slot.hour === currentHourNum
              let dotBg = 'bg-white/15'

              if (slot.isFilled && slot.matchingEntry) {
                if (slot.isNight) {
                  dotBg = 'bg-zinc-600'
                } else if (slot.matchingEntry.type === 'pro') {
                  dotBg = 'bg-white'
                } else if (slot.matchingEntry.type === 'perso') {
                  dotBg = 'bg-[#F59E0B]'
                } else if (slot.matchingEntry.type === 'entreprises') {
                  dotBg = 'bg-[#3B82F6]'
                }
              }

              return (
                <div key={slot.hour} className="relative flex items-center justify-center p-1" title={`${slot.hour}h00`}>
                  <div
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 ${dotBg} ${
                      isCurrent ? 'ring-2 ring-[#FF9028] ring-offset-2 ring-offset-[#0a0a0a] scale-125' : ''
                    }`}
                  />
                  {isCurrent && (
                    <span className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FF9028] animate-ping opacity-40" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Légende minimaliste épurée */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-white/10 text-[10px] font-mono-tech text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>PRO ({stats.byType.find((t) => t.type === 'pro')?.hours || 0}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>PERSO ({stats.byType.find((t) => t.type === 'perso')?.hours || 0}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span>ENTP ({stats.byType.find((t) => t.type === 'entreprises')?.hours || 0}h)</span>
            </div>
            {stats.sleepHours > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span>NUIT ({stats.sleepHours}h)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
