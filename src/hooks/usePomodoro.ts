import { useState, useEffect, useRef } from 'react'
import type { ActivityType } from '../types'
import confetti from 'canvas-confetti'

export type PomodoroMode = 'focus25' | 'focus50' | 'shortBreak' | 'longBreak'

export const POMODORO_PRESETS: Record<
  PomodoroMode,
  { label: string; minutes: number; isBreak: boolean }
> = {
  focus25: { label: 'Focus 25m', minutes: 25, isBreak: false },
  focus50: { label: 'Deep 50m', minutes: 50, isBreak: false },
  shortBreak: { label: 'Pause 5m', minutes: 5, isBreak: true },
  longBreak: { label: 'Pause 15m', minutes: 15, isBreak: true },
}

export function usePomodoro(
  onAddEntry: (entry: {
    title: string
    type: ActivityType
    startTime: string
    endTime: string
  }) => void
) {
  const [mode, setMode] = useState<PomodoroMode>('focus25')
  const [timeLeft, setTimeLeft] = useState(POMODORO_PRESETS.focus25.minutes * 60)
  const [isRunning, setIsRunning] = useState(false)

  // Tâche associée
  const [selectedType, setSelectedType] = useState<ActivityType>('pro')
  const [taskTitle, setTaskTitle] = useState('Dev / Code')

  // Heure de début
  const sessionStartTimeRef = useRef<Date | null>(null)
  const [completedSession, setCompletedSession] = useState<{
    title: string
    type: ActivityType
    durationMinutes: number
    startTimeStr: string
    endTimeStr: string
  } | null>(null)

  // Bip rétro 8-bit Web Audio
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

  // Changement de mode
  const handleSelectMode = (newMode: PomodoroMode) => {
    setMode(newMode)
    setTimeLeft(POMODORO_PRESETS[newMode].minutes * 60)
    setIsRunning(false)
    sessionStartTimeRef.current = null
  }

  // Démarrer / Pause
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
    setTimeLeft(POMODORO_PRESETS[mode].minutes * 60)
    sessionStartTimeRef.current = null
  }

  // Terminer la session
  const handleFinishSession = () => {
    setIsRunning(false)
    playRetroBeep()
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#181818', '#FF9028', '#FFFFFF'],
    })

    if (!POMODORO_PRESETS[mode].isBreak && sessionStartTimeRef.current) {
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

  // Décompte chaque seconde
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
  }, [isRunning, timeLeft, mode])

  // Formater mm:ss
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Enregistrer dans Timdot
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

  const dismissCompletedSession = () => {
    setCompletedSession(null)
    sessionStartTimeRef.current = null
    handleReset()
  }

  return {
    mode,
    timeLeft,
    timeFormatted,
    isRunning,
    selectedType,
    taskTitle,
    completedSession,
    totalSeconds: POMODORO_PRESETS[mode].minutes * 60,
    isBreak: POMODORO_PRESETS[mode].isBreak,
    currentPreset: POMODORO_PRESETS[mode],
    handleSelectMode,
    togglePlay,
    handleReset,
    handleFinishSession,
    setSelectedType,
    setTaskTitle,
    handleSaveToTimdot,
    dismissCompletedSession,
  }
}
