import React, { useState, useEffect, useRef } from 'react'
import type { ActivityType, PreloadedTopic } from '../types'
import { ACTIVITY_TYPES_META } from '../constants/initialData'
import confetti from 'canvas-confetti'
import { Play, Pause, RotateCcw, Check, Sparkles, Coffee, Flame, CheckCircle2 } from 'lucide-react'

interface PomodoroTimerProps {
  topics: PreloadedTopic[]
  onAddEntry: (entry: {
    title: string
    type: ActivityType
    startTime: string
    endTime: string
  }) => void
}

type PomodoroMode = 'focus25' | 'focus50' | 'shortBreak' | 'longBreak'

const PRESETS: Record<
  PomodoroMode,
  { label: string; minutes: number; isBreak: boolean; icon: any }
> = {
  focus25: { label: 'Focus 25m', minutes: 25, isBreak: false, icon: Flame },
  focus50: { label: 'Deep 50m', minutes: 50, isBreak: false, icon: Flame },
  shortBreak: { label: 'Pause 5m', minutes: 5, isBreak: true, icon: Coffee },
  longBreak: { label: 'Pause 15m', minutes: 15, isBreak: true, icon: Coffee },
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ topics, onAddEntry }) => {
  const [mode, setMode] = useState<PomodoroMode>('focus25')
  const [timeLeft, setTimeLeft] = useState(PRESETS.focus25.minutes * 60)
  const [isRunning, setIsRunning] = useState(false)

  // Activité en cours
  const [selectedType, setSelectedType] = useState<ActivityType>('pro')
  const [taskTitle, setTaskTitle] = useState('Dev / Code')

  // Date/Heure de début pour l'enregistrement
  const sessionStartTimeRef = useRef<Date | null>(null)
  const [completedSession, setCompletedSession] = useState<{
    title: string
    type: ActivityType
    durationMinutes: number
    startTimeStr: string
    endTimeStr: string
  } | null>(null)

  // Bip rétro 8-bit avec Web Audio API
  const playRetroBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const audioCtx = new AudioContextClass()
      const now = audioCtx.currentTime

      const osc1 = audioCtx.createOscillator()
      const gain1 = audioCtx.createGain()
      osc1.type = 'square'
      osc1.frequency.setValueAtTime(880, now)
      gain1.gain.setValueAtTime(0.12, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc1.connect(gain1)
      gain1.connect(audioCtx.destination)
      osc1.start(now)
      osc1.stop(now + 0.15)

      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(1320, now + 0.18)
      gain2.gain.setValueAtTime(0.12, now + 0.18)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.start(now + 0.18)
      osc2.stop(now + 0.4)
    } catch (e) {
      console.log('Audio error:', e)
    }
  }

  // Changer de mode
  const handleSelectMode = (newMode: PomodoroMode) => {
    setMode(newMode)
    setTimeLeft(PRESETS[newMode].minutes * 60)
    setIsRunning(false)
    sessionStartTimeRef.current = null
  }

  // Démarrer / Mettre en pause
  const togglePlay = () => {
    if (!isRunning) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date()
      }
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  // Réinitialiser
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(PRESETS[mode].minutes * 60)
    sessionStartTimeRef.current = null
  }

  // Fin de session
  const handleFinishSession = () => {
    setIsRunning(false)
    playRetroBeep()
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#181818', '#FF9028', '#FFFFFF'],
    })

    if (!PRESETS[mode].isBreak && sessionStartTimeRef.current) {
      const end = new Date()
      const start = sessionStartTimeRef.current

      const formatTime = (d: Date) =>
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

      const durationMins = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 60000)
      )

      setCompletedSession({
        title: taskTitle.trim() || 'Session Focus',
        type: selectedType,
        durationMinutes: durationMins,
        startTimeStr: formatTime(start),
        endTimeStr: formatTime(end),
      })
    }
  }

  // Décompte de la seconde
  useEffect(() => {
    let interval: any = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            handleFinishSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Formater mm:ss
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Anneau de 36 points Nothing OS
  const totalSeconds = PRESETS[mode].minutes * 60
  const progressPercent = (totalSeconds - timeLeft) / totalSeconds
  const DOTS_COUNT = 36
  const activeDotsCount = Math.round((1 - progressPercent) * DOTS_COUNT)

  const radius = 105
  const center = 130
  const dots = Array.from({ length: DOTS_COUNT }, (_, i) => {
    const angle = (i / DOTS_COUNT) * 2 * Math.PI - Math.PI / 2
    const x = center + radius * Math.cos(angle)
    const y = center + radius * Math.sin(angle)
    const isActive = i < activeDotsCount
    return { id: i, x, y, isActive }
  })

  // Enregistrer le créneau dans Timdot
  const handleSaveToTimdot = () => {
    if (!completedSession) return

    onAddEntry({
      title: completedSession.title,
      type: completedSession.type,
      startTime: completedSession.startTimeStr,
      endTime: completedSession.endTimeStr,
    })

    setCompletedSession(null)
    sessionStartTimeRef.current = null
    handleReset()
  }

  // Filtrer les sujets correspondant au type choisi
  const filteredTopics = topics.filter((t) => t.type === selectedType)

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Carte principale Pomodoro */}
      <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5 text-center">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9028] animate-pulse" />
            <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900">
              FOCUS // POMODORO
            </h3>
          </div>
          <span className="text-[10px] font-mono-tech font-bold px-2.5 py-0.5 rounded-full bg-black/10 text-zinc-900">
            {PRESETS[mode].label}
          </span>
        </div>

        {/* Sélecteur de presets de durée */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-black/10 border border-black/5 mb-6">
          {(Object.keys(PRESETS) as PomodoroMode[]).map((key) => {
            const p = PRESETS[key]
            const isSelected = mode === key
            return (
              <button
                key={key}
                onClick={() => handleSelectMode(key)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-mono-tech font-bold uppercase transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#181818] text-white shadow-sm scale-102'
                    : 'text-zinc-700 hover:text-black hover:bg-white/20'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Anneau circulaire de points Nothing OS + Grand chrono */}
        <div className="relative w-[260px] h-[260px] mx-auto flex items-center justify-center">
          <svg width="260" height="260" viewBox="0 0 260 260" className="drop-shadow-sm">
            {dots.map((dot) => (
              <circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={dot.isActive ? 4.5 : 3}
                fill={dot.isActive ? (PRESETS[mode].isBreak ? '#3B82F6' : '#FF9028') : 'rgba(0, 0, 0, 0.12)'}
                className="transition-all duration-300"
              />
            ))}
          </svg>

          {/* Affichage central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="font-dot text-5xl sm:text-6xl font-bold text-[#181818] tracking-tight leading-none">
              {timeFormatted}
            </span>
            <span className="font-mono-tech text-[10px] tracking-widest uppercase font-bold text-zinc-700 mt-2">
              {PRESETS[mode].isBreak ? 'PAUSE BIEN MÉRITÉE' : taskTitle}
            </span>
          </div>
        </div>

        {/* Commandes Play / Pause / Reset */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={handleReset}
            title="Réinitialiser"
            className="p-3 rounded-full bg-white/30 hover:bg-white/50 border border-black/10 text-zinc-700 hover:text-black transition-all active:scale-95"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-mono-tech text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
              isRunning
                ? 'bg-white/70 text-[#181818] border border-black/15 hover:bg-white'
                : 'bg-[#181818] text-white hover:bg-black'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={16} />
                <span>METTRE EN PAUSE</span>
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                <span>{timeLeft < totalSeconds ? 'REPRENDRE' : 'DÉMARRER'}</span>
              </>
            )}
          </button>

          {isRunning && (
            <button
              onClick={handleFinishSession}
              title="Terminer maintenant"
              className="p-3 rounded-full bg-white/30 hover:bg-white/50 border border-black/10 text-emerald-700 hover:text-emerald-900 transition-all active:scale-95"
            >
              <Check size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Sélection de la tâche en cours (seulement en mode Focus) */}
      {!PRESETS[mode].isBreak && (
        <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-zinc-900">
              TÂCHE DU BLOC FOCUS
            </span>
            <span className="text-[10px] font-mono-tech font-bold text-zinc-700">
              Sera enregistrée sur Timdot
            </span>
          </div>

          {/* Choix de la catégorie PRO / PERSO / ENTP */}
          <div className="inline-flex bg-black/10 p-1 rounded-full border border-black/5 gap-1">
            {(['pro', 'perso', 'entreprises'] as ActivityType[]).map((t) => {
              const meta = ACTIVITY_TYPES_META[t]
              const isSelected = selectedType === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(t)
                    const firstTopic = topics.find((top) => top.type === t)
                    if (firstTopic) setTaskTitle(firstTopic.name)
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 ${
                    isSelected
                      ? `${meta.bgClass} ${meta.textClass} shadow-sm`
                      : 'text-zinc-700 hover:text-black'
                  }`}
                >
                  {meta.shortLabel || meta.label}
                </button>
              )
            })}
          </div>

          {/* Saisie ou choix parmi les sujets préchargés */}
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Sur quoi travaillez-vous ?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 border border-black/10 text-[#181818] font-semibold text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#181818]"
          />

          {/* Raccourcis de sujets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {filteredTopics.slice(0, 5).map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setTaskTitle(topic.name)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech font-semibold transition-all ${
                  taskTitle === topic.name
                    ? 'bg-[#181818] text-white'
                    : 'bg-white/40 hover:bg-white/70 text-zinc-800'
                }`}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Bandeau de validation et d'enregistrement automatique dans Timdot */}
      {completedSession && (
        <div className="rounded-3xl bg-emerald-500/20 backdrop-blur-2xl border border-emerald-500/30 shadow-2xl p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-2 text-emerald-950 font-bold">
            <CheckCircle2 size={18} className="text-emerald-700" />
            <span className="font-mono-tech text-xs uppercase tracking-wider">
              SESSION POMODORO TERMINÉE !
            </span>
          </div>

          <p className="text-xs font-mono-tech text-zinc-800 mb-4">
            Bravo ! Vous avez réalisé <strong className="font-dot text-sm">{completedSession.durationMinutes} minutes</strong> de{' '}
            <strong>« {completedSession.title} »</strong> ({completedSession.startTimeStr} - {completedSession.endTimeStr}).
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompletedSession(null)}
              className="px-3 py-2 rounded-xl text-xs font-mono-tech font-bold text-zinc-700 hover:bg-black/10 transition-colors"
            >
              IGNORER
            </button>
            <button
              onClick={handleSaveToTimdot}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#181818] hover:bg-black text-white text-xs font-mono-tech font-bold shadow-lg transition-all active:scale-95"
            >
              <Sparkles size={14} className="text-[#FF9028]" />
              <span>ENREGISTRER SUR TIMDOT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
