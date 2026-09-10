import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { TimeEntry } from '../types'
import type { StateId } from '../bot/states'
import { getFormattedDateKey, isNightActivity } from '../constants/initialData'
import {
  playMechanicalClick,
  playSuccessChime,
  playBloubChirp,
  playBloubDizzy,
  playBloubSpin,
} from '../utils/soundEffects'
import confetti from 'canvas-confetti'

interface UseBloubStateProps {
  entries: TimeEntry[]
  totalHours: number
  selectedDate: string
  isPomodoroActive?: boolean
  isPomodoroBreak?: boolean
}

export interface BloubMood {
  state: StateId
  label: string
  emoji: string
  detail?: string
  energyPercent: number
  isDizzy?: boolean
  isSleeping?: boolean
  isFocusing?: boolean
  isCosmic?: boolean
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const WITTY_PUNCHLINES = [
  { label: 'Je garde un œil sur ton temps...', emoji: '👀', detail: 'Rien ne m’échappe !' },
  { label: 'Tu gères la fougère 🌱', emoji: '✨', detail: 'Continue comme ça' },
  { label: 'Chaque minute compte !', emoji: '⏱️', detail: 'Le temps, c’est de l’art' },
  { label: 'Productivité 100% pur beurre', emoji: '🧈', detail: 'Tout en fluidité' },
  { label: 'T’as prévu quoi de beau après ?', emoji: '🤔', detail: 'La journée avance vite' },
  { label: 'Allez, encore un petit créneau !', emoji: '⚡', detail: 'L’objectif approche' },
  { label: 'Je cligne des yeux mais je vois tout', emoji: '😉', detail: 'Mode observateur' },
  { label: 'Tu veux une médaille ? 🥇', emoji: '🏆', detail: 'Bien méritée !' },
  { label: 'Toujours là pour toi !', emoji: '🤍', detail: 'Ton compagnon Nothing OS' },
  { label: 'Un esprit sain dans 24h bien calées', emoji: '🧘', detail: 'Équilibre parfait' },
]

export function useBloubState({
  entries,
  totalHours,
  selectedDate,
  isPomodoroActive = false,
  isPomodoroBreak = false,
}: UseBloubStateProps) {
  // Dérogation manuelle temporaire (clic sur Bloub ou ajout d'activité)
  const [override, setOverride] = useState<{
    state: StateId
    label: string
    emoji: string
    detail?: string
    isDizzy?: boolean
    isSleeping?: boolean
    isFocusing?: boolean
    isCosmic?: boolean
    energyPercent?: number
    expiresAt: number
  } | null>(null)

  // Indice de réplique au clic
  const [clickCount, setClickCount] = useState(0)

  // Historique des timestamps de taps récents pour détecter le spam (Easter Egg tournis)
  const tapHistoryRef = useRef<number[]>([])

  // Rafraîchir toutes les 30s pour mettre à jour l'humeur en fonction de l'heure courante
  const [nowMinute, setNowMinute] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date()
      setNowMinute(d.getHours() * 60 + d.getMinutes())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Nettoyage de l'override quand il expire
  useEffect(() => {
    if (!override) return
    const remaining = override.expiresAt - Date.now()
    if (remaining <= 0) {
      setOverride(null)
      return
    }
    const timer = setTimeout(() => setOverride(null), remaining)
    return () => clearTimeout(timer)
  }, [override])

  // Jauge d'énergie de 0 à 100% basée sur l'avancement (objectif 8h par jour)
  const energyPercent = useMemo(() => {
    return Math.min(100, Math.max(10, Math.round((totalHours / 8) * 100)))
  }, [totalHours])

  // Célébration lors de l'enregistrement d'une activité
  const triggerCelebration = useCallback((title?: string) => {
    playSuccessChime()
    setOverride({
      state: 'burst',
      label: title ? `Enregistré : ${title} !` : 'Activité enregistrée !',
      emoji: '✨',
      detail: 'Bien joué, créneau validé !',
      isCosmic: true,
      expiresAt: Date.now() + 3200,
    })
  }, [])

  // Clic sur Bloub : avec détection de spam (Easter egg tournis 😵)
  const handleBotClick = useCallback(() => {
    const now = Date.now()
    tapHistoryRef.current = [...tapHistoryRef.current.filter((t) => now - t < 1500), now]

    // 1. Détection de spam rapide (4 taps ou plus en moins de 1.5s)
    if (tapHistoryRef.current.length >= 4) {
      playBloubDizzy()
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.25 },
        colors: ['#181818', '#FFA43B', '#FFFFFF'],
      })
      setOverride({
        state: 'swirl',
        label: 'Arrête de me poke, j’ai le tournis ! 😵',
        emoji: '🌀',
        detail: 'Surcharge sensorielle...',
        isDizzy: true,
        expiresAt: now + 3800,
      })
      tapHistoryRef.current = []
      return
    }

    // 2. Clic normal : son mignon gazouillis et réplique amusante
    playBloubChirp()
    const nextIndex = clickCount % WITTY_PUNCHLINES.length
    setClickCount((prev) => prev + 1)
    const punchline = WITTY_PUNCHLINES[nextIndex]

    const EXPRESSION_STATES: StateId[] = ['wink', 'wide', 'play', 'alert']
    const expression = EXPRESSION_STATES[clickCount % EXPRESSION_STATES.length]

    setOverride({
      state: expression,
      label: punchline.label,
      emoji: punchline.emoji,
      detail: punchline.detail,
      expiresAt: now + 3000,
    })
  }, [clickCount])

  // Swipe tactile horizontal sur Bloub (Easter egg rotation à 360°)
  const handleBotSwipe = useCallback((_direction: 'left' | 'right') => {
    playBloubSpin()
    setOverride({
      state: 'play',
      label: 'Wouhou ! Tourbillon 360° 🌀',
      emoji: '🌪️',
      detail: 'Sensations fortes !',
      isCosmic: true,
      expiresAt: Date.now() + 2500,
    })
  }, [])

  // Quand l'utilisateur sélectionne un trou temporel sur la matrice
  const handleSelectHole = useCallback((range?: { startTime: string; endTime: string }) => {
    playMechanicalClick()
    setOverride({
      state: 'wide',
      label: range ? `Qu’est-ce qu’on note de ${range.startTime} à ${range.endTime} ?` : 'Qu’est-ce qu’on note là ?',
      emoji: '👀',
      detail: 'Je t’écoute !',
      expiresAt: Date.now() + 3000,
    })
  }, [])

  // Calcul de l'état contextuel du jour
  const contextualMood = useMemo<BloubMood>(() => {
    // 1. Pomodoro actif
    if (isPomodoroActive) {
      if (isPomodoroBreak) {
        return {
          state: 'play',
          label: 'Pause Pomodoro ☕',
          emoji: '☕',
          detail: 'Café, étirements ou verre d’eau !',
          energyPercent,
        }
      }
      return {
        state: 'thinking',
        label: 'Chut ! Cerveau en ébullition 🧠',
        emoji: '🧠',
        detail: 'Session de focus Pomodoro en cours',
        isFocusing: true,
        energyPercent,
      }
    }

    const todayKey = getFormattedDateKey()
    const isToday = selectedDate === todayKey

    // 2. Si on consulte une autre journée
    if (!isToday) {
      if (totalHours >= 7) {
        return {
          state: 'wink',
          label: `${totalHours}h validées !`,
          emoji: '⭐',
          detail: 'Masterclass de productivité',
          isCosmic: true,
          energyPercent,
        }
      }
      return {
        state: 'idle',
        label: `${totalHours}h au total`,
        emoji: '📅',
        detail: `Consultation du ${selectedDate}`,
        energyPercent,
      }
    }

    // 3. Aujourd'hui : Nuit tardive (23h00 -> 07h00)
    const currentHour = Math.floor(nowMinute / 60)
    const isNightTime = currentHour >= 23 || currentHour < 7

    // Trouver si une activité correspond exactement à la minute courante
    const currentEntry = entries.find((e) => {
      const s = timeToMinutes(e.startTime)
      let end = timeToMinutes(e.endTime)
      if (end < s) end += 1440 // Traverse minuit

      let nowVal = nowMinute
      if (end > 1440 && nowVal < s) nowVal += 1440
      return nowVal >= s && nowVal <= end
    })

    if (currentEntry) {
      if (
        isNightActivity(currentEntry.title) ||
        (currentEntry.type === 'perso' && /sommeil|nuit|dodo/i.test(currentEntry.title))
      ) {
        return {
          state: 'sleep',
          label: 'Zzz... Va dormir, ton écran te grille les yeux 😴',
          emoji: '🌙',
          detail: currentEntry.title,
          isSleeping: true,
          energyPercent,
        }
      }

      if (currentEntry.type === 'pro' || currentEntry.type === 'entreprises') {
        return {
          state: 'thinking',
          label: `En plein focus : ${currentEntry.title}`,
          emoji: '💼',
          detail: `${currentEntry.startTime} - ${currentEntry.endTime}`,
          isFocusing: true,
          energyPercent,
        }
      }

      if (/lecture|cours|etude|livre|formation|apprendre/i.test(currentEntry.title)) {
        return {
          state: 'wide',
          label: `Apprentissage : ${currentEntry.title}`,
          emoji: '📖',
          detail: `${currentEntry.startTime} - ${currentEntry.endTime}`,
          energyPercent,
        }
      }

      return {
        state: 'play',
        label: `En cours : ${currentEntry.title}`,
        emoji: '🎯',
        detail: `${currentEntry.startTime} - ${currentEntry.endTime}`,
        energyPercent,
      }
    }

    // Pas d'activité en cours actuellement
    if (isNightTime) {
      return {
        state: 'sleep',
        label: 'Zzz... Va dormir, tes yeux piquent 😴',
        emoji: '🌙',
        detail: 'C’est l’heure de recharger les batteries',
        isSleeping: true,
        energyPercent: 15,
      }
    }

    // Le matin sans activité (7h - 9h30)
    if (nowMinute >= 7 * 60 && nowMinute <= 9 * 60 + 30 && entries.length === 0) {
      return {
        state: 'wide',
        label: 'Bien dormi ? C’est l’heure de briller ☀️',
        emoji: '☀️',
        detail: 'Prêt pour ton premier créneau ?',
        energyPercent: 40,
      }
    }

    // En journée : vérifier s'il y a un trou depuis la dernière activité
    if (entries.length > 0) {
      const sortedByEnd = [...entries].sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime))
      const lastEndMin = timeToMinutes(sortedByEnd[0].endTime)

      if (nowMinute > lastEndMin + 120 && nowMinute <= 21 * 60) {
        // Plus de 2 heures d'écart en pleine journée
        return {
          state: 'alert',
          label: 'Dis donc, ça fait 2h que tu glandes ? 👀',
          emoji: '👀',
          detail: `Dernière activité finie à ${sortedByEnd[0].endTime}`,
          energyPercent: Math.max(20, energyPercent - 20),
        }
      }

      if (nowMinute >= lastEndMin && nowMinute < lastEndMin + 20) {
        return {
          state: 'wink',
          label: 'Session terminée, t’assures ! 👏',
          emoji: '👏',
          detail: 'Prêt pour la suite ?',
          energyPercent,
        }
      }
    } else if (nowMinute >= 9 * 60 && nowMinute <= 19 * 60) {
      // Journée bien entamée mais aucune saisie
      return {
        state: 'alert',
        label: 'Où t’étais passé ? Viens noter ta journée !',
        emoji: '👀',
        detail: 'La matrice attend tes créneaux',
        energyPercent: 25,
      }
    }

    // Journée bien fournie (> 7h-8h)
    if (totalHours >= 7) {
      return {
        state: 'orbit',
        label: 'T’es une machine aujourd’hui ! 🔥',
        emoji: '⚡',
        detail: `${totalHours}h au compteur, respect !`,
        isCosmic: true,
        energyPercent: 100,
      }
    }

    // Défaut paisible
    return {
      state: 'idle',
      label: `${totalHours}h aujourd’hui · Je veille sur toi`,
      emoji: '✨',
      detail: 'TIMDOT actif',
      energyPercent,
    }
  }, [entries, totalHours, selectedDate, isPomodoroActive, isPomodoroBreak, nowMinute, energyPercent])

  const currentMood: BloubMood = {
    ...(override ?? contextualMood),
    energyPercent: override?.energyPercent ?? contextualMood.energyPercent,
    isDizzy: override?.isDizzy ?? contextualMood.isDizzy,
    isSleeping: override?.isSleeping ?? contextualMood.isSleeping,
    isFocusing: override?.isFocusing ?? contextualMood.isFocusing,
    isCosmic: override?.isCosmic ?? contextualMood.isCosmic,
  }

  return {
    currentMood,
    triggerCelebration,
    handleBotClick,
    handleBotSwipe,
    handleSelectHole,
  }
}
