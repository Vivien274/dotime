import React from 'react'
import type { ActivityType, PreloadedTopic } from '../types'
import { ACTIVITY_TYPES_META } from '../constants/initialData'
import { usePomodoro, POMODORO_PRESETS, type PomodoroMode } from '../hooks/usePomodoro'
import { Play, Pause, RotateCcw, Check, Sparkles, CheckCircle2, Bell } from 'lucide-react'

interface PomodoroTimerProps {
  topics: PreloadedTopic[]
  pomodoro: ReturnType<typeof usePomodoro>
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ topics, pomodoro }) => {
  const {
    mode,
    timeLeft,
    timeFormatted,
    isRunning,
    selectedType,
    taskTitle,
    completedSession,
    totalSeconds,
    isBreak,
    handleSelectMode,
    togglePlay,
    handleReset,
    handleFinishSession,
    setSelectedType,
    setTaskTitle,
    handleSaveToTimdot,
    dismissCompletedSession,
    dailyCycles,
    notificationPermission,
    requestNotificationPermission,
  } = pomodoro

  // Anneau de 36 points Nothing OS
  const progressPercent = (totalSeconds - timeLeft) / Math.max(1, totalSeconds)
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
          <div className="flex items-center gap-1.5">
            {notificationPermission === 'default' && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                title="Activer les alertes de fin de minuteur"
                className="flex items-center gap-1 text-[10px] font-mono-tech font-bold px-2 py-0.5 rounded-full bg-white/40 hover:bg-white text-zinc-800 transition-colors"
              >
                <Bell size={10} />
                <span>Notifs</span>
              </button>
            )}
            <span className="text-[10px] font-mono-tech font-bold px-2 py-0.5 rounded-full bg-black/10 text-zinc-900 flex items-center gap-1">
              <span>🍅</span>
              <span>{dailyCycles} cycle{dailyCycles > 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {/* Sélecteur de presets de durée */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-black/10 border border-black/5 mb-6">
          {(Object.keys(POMODORO_PRESETS) as PomodoroMode[]).map((key) => {
            const p = POMODORO_PRESETS[key]
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
                fill={dot.isActive ? (isBreak ? '#3B82F6' : '#FF9028') : 'rgba(0, 0, 0, 0.12)'}
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
              {isBreak ? 'PAUSE BIEN MÉRITÉE' : taskTitle}
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
      {!isBreak && (
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
              onClick={dismissCompletedSession}
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
