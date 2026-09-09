import { useState, useEffect, useCallback } from 'react'
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

const STORAGE_KEY = 'timdot_pomodoro_state_v1'

interface CompletedSessionData {
  title: string
  type: ActivityType
  durationMinutes: number
  startTimeStr: string
  endTimeStr: string
}

interface StoredPomodoroState {
  mode: PomodoroMode
  timeLeft: number
  isRunning: boolean
  targetEndTime: number | null
  sessionStartTimestamp: number | null
  selectedType: ActivityType
  taskTitle: string
  completedSession: CompletedSessionData | null
}

const formatClockTime = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

const getInitialState = (): StoredPomodoroState => {
  const defaultMode: PomodoroMode = 'focus25'
  const defaultSeconds = POMODORO_PRESETS[defaultMode].minutes * 60
  const defaults: StoredPomodoroState = {
    mode: defaultMode,
    timeLeft: defaultSeconds,
    isRunning: false,
    targetEndTime: null,
    sessionStartTimestamp: null,
    selectedType: 'pro',
    taskTitle: 'Dev / Code',
    completedSession: null,
  }

  if (typeof window === 'undefined') return defaults

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults

    const parsed = JSON.parse(raw) as Partial<StoredPomodoroState>
    const validModes: PomodoroMode[] = ['focus25', 'focus50', 'shortBreak', 'longBreak']
    const mode = validModes.includes(parsed.mode as PomodoroMode)
      ? (parsed.mode as PomodoroMode)
      : defaultMode
    const presetSeconds = POMODORO_PRESETS[mode].minutes * 60

    let isRunning = Boolean(parsed.isRunning)
    let targetEndTime = typeof parsed.targetEndTime === 'number' ? parsed.targetEndTime : null
    let sessionStartTimestamp =
      typeof parsed.sessionStartTimestamp === 'number' ? parsed.sessionStartTimestamp : null
    let timeLeft = typeof parsed.timeLeft === 'number' ? parsed.timeLeft : presetSeconds
    let completedSession = parsed.completedSession || null

    if (isRunning && targetEndTime) {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000))

      if (remaining > 0) {
        timeLeft = remaining
      } else {
        // La session s'est terminée pendant que l'onglet était fermé ou en cours de rafraîchissement
        timeLeft = 0
        isRunning = false
        targetEndTime = null

        if (!completedSession && !POMODORO_PRESETS[mode].isBreak && sessionStartTimestamp) {
          const start = new Date(sessionStartTimestamp)
          const end = new Date(parsed.targetEndTime || now)
          const durationMins = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
          completedSession = {
            title: parsed.taskTitle?.trim() || 'Session Focus',
            type: parsed.selectedType || 'pro',
            durationMinutes: durationMins,
            startTimeStr: formatClockTime(start),
            endTimeStr: formatClockTime(end),
          }
        }
      }
    }

    return {
      mode,
      timeLeft,
      isRunning,
      targetEndTime,
      sessionStartTimestamp,
      selectedType: parsed.selectedType || 'pro',
      taskTitle: typeof parsed.taskTitle === 'string' ? parsed.taskTitle : 'Dev / Code',
      completedSession,
    }
  } catch (e) {
    console.error('Error reading Pomodoro state from localStorage:', e)
    return defaults
  }
}

export function usePomodoro(
  onAddEntry: (entry: {
    title: string
    type: ActivityType
    startTime: string
    endTime: string
  }) => void
) {
  const [initial] = useState(getInitialState)

  const [mode, setMode] = useState<PomodoroMode>(initial.mode)
  const [timeLeft, setTimeLeft] = useState<number>(initial.timeLeft)
  const [isRunning, setIsRunning] = useState<boolean>(initial.isRunning)
  const [targetEndTime, setTargetEndTime] = useState<number | null>(initial.targetEndTime)
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState<number | null>(
    initial.sessionStartTimestamp
  )

  // Tâche associée
  const [selectedType, setSelectedType] = useState<ActivityType>(initial.selectedType)
  const [taskTitle, setTaskTitle] = useState<string>(initial.taskTitle)

  const [completedSession, setCompletedSession] = useState<CompletedSessionData | null>(
    initial.completedSession
  )

  // Compteur de cycles du jour
  const getTodayCyclesKey = () => `timdot_pomodoro_cycles_${new Date().toISOString().split('T')[0]}`
  const [dailyCycles, setDailyCycles] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(getTodayCyclesKey()) || 0)
    } catch {
      return 0
    }
  })

  // Permission de notifications
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission()
        setNotificationPermission(res)
        return res
      } catch {
        return 'denied'
      }
    }
    return 'denied'
  }

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

  // Terminer la session
  const handleFinishSession = useCallback(() => {
    setIsRunning(false)
    setTargetEndTime(null)
    playRetroBeep()
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#181818', '#FF9028', '#FFFFFF'],
      })
    } catch {
      // ignore
    }

    const isBreakSession = POMODORO_PRESETS[mode].isBreak

    // Déclencher une notification Web/PWA
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notifTitle = isBreakSession ? 'Timdot — Pause terminée !' : 'Timdot — Bloc focus terminé !'
        const notifBody = isBreakSession
          ? 'La pause est finie. Prêt pour une nouvelle session ?'
          : `Bravo ! Votre session « ${taskTitle.trim() || 'Focus'} » est bouclée.`
        new Notification(notifTitle, {
          body: notifBody,
          icon: '/favicon.ico',
        })
      } catch (e) {
        console.log('Notification error:', e)
      }
    }

    if (!isBreakSession) {
      // Incrémenter le compteur de cycles du jour
      setDailyCycles((prev) => {
        const next = prev + 1
        try {
          const key = `timdot_pomodoro_cycles_${new Date().toISOString().split('T')[0]}`
          localStorage.setItem(key, String(next))
        } catch {
          // ignore
        }
        return next
      })

      if (sessionStartTimestamp) {
        const end = new Date()
        const start = new Date(sessionStartTimestamp)
        const durationMins = Math.max(
          1,
          Math.round((end.getTime() - start.getTime()) / 60000)
        )

        setCompletedSession({
          title: taskTitle.trim() || 'Session Focus',
          type: selectedType,
          durationMinutes: durationMins,
          startTimeStr: formatClockTime(start),
          endTimeStr: formatClockTime(end),
        })
      }
    }
  }, [mode, sessionStartTimestamp, taskTitle, selectedType])

  // Changement de mode
  const handleSelectMode = (newMode: PomodoroMode) => {
    setMode(newMode)
    setTimeLeft(POMODORO_PRESETS[newMode].minutes * 60)
    setIsRunning(false)
    setTargetEndTime(null)
    setSessionStartTimestamp(null)
  }

  // Démarrer / Pause
  const togglePlay = () => {
    if (!isRunning) {
      const now = Date.now()
      const effectiveTimeLeft = timeLeft > 0 ? timeLeft : POMODORO_PRESETS[mode].minutes * 60
      const newTargetEndTime = now + effectiveTimeLeft * 1000

      if (!sessionStartTimestamp) {
        setSessionStartTimestamp(now)
      }
      setTargetEndTime(newTargetEndTime)
      setTimeLeft(effectiveTimeLeft)
      setIsRunning(true)
    } else {
      // Mise en pause : figer le temps restant
      const now = Date.now()
      if (targetEndTime) {
        const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000))
        setTimeLeft(remaining)
      }
      setTargetEndTime(null)
      setIsRunning(false)
    }
  }

  // Réinitialiser
  const handleReset = () => {
    setIsRunning(false)
    setTargetEndTime(null)
    setSessionStartTimestamp(null)
    setTimeLeft(POMODORO_PRESETS[mode].minutes * 60)
  }

  // Décompte précis basé sur l'horloge système (résistant au refresh et mise en veille)
  useEffect(() => {
    let interval: any = null

    if (isRunning && targetEndTime) {
      const tick = () => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000))
        if (remaining <= 0) {
          setTimeLeft(0)
          handleFinishSession()
        } else {
          setTimeLeft(remaining)
        }
      }

      tick()
      interval = setInterval(tick, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, targetEndTime, handleFinishSession])

  // Sauvegarde persistante dans localStorage
  useEffect(() => {
    try {
      const stateToSave: StoredPomodoroState = {
        mode,
        timeLeft,
        isRunning,
        targetEndTime,
        sessionStartTimestamp,
        selectedType,
        taskTitle,
        completedSession,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (e) {
      console.error('Error saving Pomodoro state to localStorage:', e)
    }
  }, [
    mode,
    timeLeft,
    isRunning,
    targetEndTime,
    sessionStartTimestamp,
    selectedType,
    taskTitle,
    completedSession,
  ])

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
    setSessionStartTimestamp(null)
    handleReset()
  }

  const dismissCompletedSession = () => {
    setCompletedSession(null)
    setSessionStartTimestamp(null)
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
    dailyCycles,
    notificationPermission,
    requestNotificationPermission,
  }
}
