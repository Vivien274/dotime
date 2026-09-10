import { useState, useEffect, useMemo, useCallback } from 'react'
import type { TimeEntry } from '../types'
import type { StateId } from '../bot/states'
import { getFormattedDateKey, isNightActivity } from '../constants/initialData'
import { playMechanicalClick, playSuccessChime } from '../utils/soundEffects'

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
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

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
    expiresAt: number
  } | null>(null)

  // Indice de cycle au clic
  const [clickCount, setClickCount] = useState(0)

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

  // Célébration lors de l'enregistrement d'une activité
  const triggerCelebration = useCallback((title?: string) => {
    playSuccessChime()
    setOverride({
      state: 'burst',
      label: title ? `Enregistré : ${title} !` : 'Activité enregistrée !',
      emoji: '✨',
      detail: 'Bien joué, créneau validé !',
      expiresAt: Date.now() + 3200,
    })
  }, [])

  // Clic sur Bloub : cycle amusant d'expressions
  const handleBotClick = useCallback(() => {
    playMechanicalClick()
    const REACTION_STATES: Array<{ state: StateId; label: string; emoji: string; detail: string }> = [
      { state: 'wink', label: 'Clin d’œil !', emoji: '😉', detail: 'Tout roule ?' },
      { state: 'play', label: 'En mode turbo !', emoji: '🚀', detail: 'Prêt pour l’action' },
      { state: 'swirl', label: 'Tourbillon !', emoji: '🌀', detail: 'Hop là !' },
      { state: 'wide', label: 'Coucou toi !', emoji: '👀', detail: 'Je surveille ton temps' },
      { state: 'comet', label: 'À la vitesse lumière', emoji: '💫', detail: 'Productivité max !' },
      { state: 'hexagon', label: 'Glyph Matrix', emoji: '💎', detail: 'Nothing aesthetic' },
    ]

    const nextIndex = clickCount % REACTION_STATES.length
    setClickCount((prev) => prev + 1)
    const reaction = REACTION_STATES[nextIndex]

    setOverride({
      ...reaction,
      expiresAt: Date.now() + 3000,
    })
  }, [clickCount])

  // Calcul de l'état contextuel du jour
  const contextualMood = useMemo<BloubMood>(() => {
    // 1. Pomodoro actif
    if (isPomodoroActive) {
      if (isPomodoroBreak) {
        return {
          state: 'play',
          label: 'Pause Pomodoro',
          emoji: '☕',
          detail: 'Détends-toi quelques minutes',
        }
      }
      return {
        state: 'thinking',
        label: 'Focus Pomodoro',
        emoji: '🧠',
        detail: 'Session de concentration en cours',
      }
    }

    const todayKey = getFormattedDateKey()
    const isToday = selectedDate === todayKey

    // 2. Si on consulte une autre journée
    if (!isToday) {
      if (totalHours >= 7) {
        return {
          state: 'wink',
          label: `${totalHours}h validées`,
          emoji: '⭐',
          detail: 'Superbe journée accomplie',
        }
      }
      return {
        state: 'idle',
        label: `${totalHours}h au total`,
        emoji: '📅',
        detail: `Consultation du ${selectedDate}`,
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
      if (isNightActivity(currentEntry.title) || currentEntry.type === 'perso' && /sommeil|nuit|dodo/i.test(currentEntry.title)) {
        return {
          state: 'sleep',
          label: 'Repos / Sommeil',
          emoji: '🌙',
          detail: currentEntry.title,
        }
      }

      if (currentEntry.type === 'pro' || currentEntry.type === 'entreprises') {
        return {
          state: 'thinking',
          label: `En focus : ${currentEntry.title}`,
          emoji: '💼',
          detail: `${currentEntry.startTime} - ${currentEntry.endTime}`,
        }
      }

      if (/lecture|cours|etude|livre|formation|apprendre/i.test(currentEntry.title)) {
        return {
          state: 'wide',
          label: `Apprentissage : ${currentEntry.title}`,
          emoji: '📖',
          detail: `${currentEntry.startTime} - ${currentEntry.endTime}`,
        }
      }

      return {
        state: 'play',
        label: currentEntry.title,
        emoji: '🎯',
        detail: `${currentEntry.startTime} - ${currentEntry.endTime}`,
      }
    }

    // Pas d'activité en cours actuellement
    if (isNightTime) {
      return {
        state: 'sleep',
        label: 'Mode nuit',
        emoji: '🌙',
        detail: 'C’est l’heure de recharger les batteries',
      }
    }

    // En journée : vérifier s'il y a un trou depuis la dernière activité
    if (entries.length > 0) {
      // Trouver la dernière activité terminée
      const sortedByEnd = [...entries].sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime))
      const lastEndMin = timeToMinutes(sortedByEnd[0].endTime)

      if (nowMinute > lastEndMin + 120 && nowMinute <= 21 * 60) {
        // Plus de 2 heures d'écart en pleine journée
        return {
          state: 'alert',
          label: 'Un trou dans ton suivi ?',
          emoji: '👀',
          detail: `Dernière fin à ${sortedByEnd[0].endTime}`,
        }
      }

      if (nowMinute >= lastEndMin && nowMinute < lastEndMin + 20) {
        return {
          state: 'wink',
          label: 'Bien joué pour la session !',
          emoji: '👏',
          detail: 'Prêt pour la suite ?',
        }
      }
    } else if (nowMinute >= 9 * 60 && nowMinute <= 19 * 60) {
      // Journée entamée mais aucune saisie
      return {
        state: 'wide',
        label: 'Journée à remplir !',
        emoji: '☀️',
        detail: 'Ajoute ta première activité',
      }
    }

    // Journée bien fournie
    if (totalHours >= 8) {
      return {
        state: 'orbit',
        label: `${totalHours}h au compteur !`,
        emoji: '⚡',
        detail: 'Excellente journée productive',
      }
    }

    // Défaut paisible
    return {
      state: 'idle',
      label: `${totalHours}h aujourd’hui`,
      emoji: '✨',
      detail: 'TIMDOT actif',
    }
  }, [entries, totalHours, selectedDate, isPomodoroActive, isPomodoroBreak, nowMinute])

  const currentMood = override ?? contextualMood

  return {
    currentMood,
    triggerCelebration,
    handleBotClick,
  }
}
