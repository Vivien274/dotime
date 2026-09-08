import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { ActivityType, PreloadedTopic, TimeEntry, DaySummaryStats } from '../types'
import {
  PRELOADED_TOPICS,
  ACTIVITY_TYPES_META,
  getFormattedDateKey,
  generateInitialEntries,
  timeStringToHours,
  getSmartRoundedEndTime,
  calculateDurationHours,
  isHourCoveredByEntry,
  isNightActivity,
  getOffsetDateKey,
} from '../constants/initialData'

const STORAGE_KEY_ENTRIES = 'timdot_entries_v4'
const STORAGE_KEY_MIGRATED = 'timdot_migrated_to_convex_v2'

export type HourSlot = {
  hour: number // 0 à 23
  label: string // "08:00"
  isFilled: boolean
  isNight: boolean // Activité de nuit / sommeil
  matchingEntry: TimeEntry | null
  isCurrentHour: boolean
}

export function useTimeTracker() {
  // 1. Date sélectionnée (par défaut aujourd'hui)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getFormattedDateKey()
  })

  // Date suivante pour le calcul précis de la nuit
  const nextDateKey = useMemo(() => getOffsetDateKey(selectedDate, 1), [selectedDate])

  // 2. Requêtes Convex temps réel
  const entriesData = useQuery(api.entries.getByDateAndNext, {
    currentDate: selectedDate,
    nextDate: nextDateKey,
  })
  const convexTopics = useQuery(api.topics.list)

  // 3. Mutations Convex
  const addEntryMutation = useMutation(api.entries.add)
  const removeEntryMutation = useMutation(api.entries.remove)
  const resetDayMutation = useMutation(api.entries.resetDay)
  const importBatchMutation = useMutation(api.entries.importBatch)
  const addTopicMutation = useMutation(api.topics.add)
  const seedTopicsMutation = useMutation(api.topics.seed)

  // Initialiser les sujets si nécessaire
  const hasSeededTopics = useRef(false)
  useEffect(() => {
    if (!hasSeededTopics.current && convexTopics !== undefined && convexTopics.length === 0) {
      hasSeededTopics.current = true
      seedTopicsMutation().catch(console.error)
    }
  }, [convexTopics, seedTopicsMutation])

  // 4. Migration automatique transparente des données localStorage vers Convex
  const hasMigrated = useRef(false)
  useEffect(() => {
    if (hasMigrated.current) return

    const alreadyMigrated = localStorage.getItem(STORAGE_KEY_MIGRATED)
    if (alreadyMigrated === 'true') {
      hasMigrated.current = true
      return
    }

    try {
      const savedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES)
      if (savedEntries) {
        const parsed: Record<string, TimeEntry[]> = JSON.parse(savedEntries)
        const allEntriesToImport = Object.entries(parsed).flatMap(([dateKey, list]) =>
          list.map((e) => ({
            title: e.title,
            type: e.type,
            startTime: e.startTime,
            endTime: e.endTime,
            startHour: e.startHour ?? timeStringToHours(e.startTime),
            endHour: e.endHour ?? timeStringToHours(e.endTime),
            durationHours: e.durationHours ?? calculateDurationHours(e.startTime, e.endTime),
            date: e.date || dateKey,
          }))
        )

        if (allEntriesToImport.length > 0) {
          hasMigrated.current = true
          importBatchMutation({ entries: allEntriesToImport })
            .then(() => {
              localStorage.setItem(STORAGE_KEY_MIGRATED, 'true')
            })
            .catch(console.error)
        } else {
          localStorage.setItem(STORAGE_KEY_MIGRATED, 'true')
        }
      } else {
        // Initialiser avec les 2 entrées de démo initiales sur Convex si aucune donnée
        const initial = generateInitialEntries()
        const initialList = Object.entries(initial).flatMap(([dateKey, list]) =>
          list.map((e) => ({
            title: e.title,
            type: e.type,
            startTime: e.startTime,
            endTime: e.endTime,
            startHour: e.startHour,
            endHour: e.endHour,
            durationHours: e.durationHours,
            date: dateKey,
          }))
        )
        hasMigrated.current = true
        importBatchMutation({ entries: initialList })
          .then(() => {
            localStorage.setItem(STORAGE_KEY_MIGRATED, 'true')
          })
          .catch(console.error)
      }
    } catch (e) {
      console.error('Erreur migration vers Convex:', e)
    }
  }, [importBatchMutation])

  // 5. Sujets : liste unifiée Convex avec fallback
  const topics = useMemo<PreloadedTopic[]>(() => {
    if (convexTopics && convexTopics.length > 0) {
      return convexTopics.map((t) => ({
        id: t._id,
        name: t.name,
        type: t.type,
        icon: t.icon,
      }))
    }
    return PRELOADED_TOPICS
  }, [convexTopics])

  // 6. Entrées du jour sélectionné
  const currentDayEntries = useMemo<TimeEntry[]>(() => {
    if (entriesData?.currentDay) {
      return entriesData.currentDay.map((e) => ({
        id: e._id,
        title: e.title,
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        startHour: e.startHour,
        endHour: e.endHour,
        durationHours: e.durationHours,
        date: e.date,
      }))
    }
    return []
  }, [entriesData])

  // Entrées du lendemain pour le raccordement de la nuit
  const nextDayEntries = useMemo<TimeEntry[]>(() => {
    if (entriesData?.nextDay) {
      return entriesData.nextDay.map((e) => ({
        id: e._id,
        title: e.title,
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        startHour: e.startHour,
        endHour: e.endHour,
        durationHours: e.durationHours,
        date: e.date,
      }))
    }
    return []
  }, [entriesData])

  // Heure de début intelligente suggérée (l'heure de fin du dernier créneau de la journée)
  const suggestedStartTime = useMemo(() => {
    if (currentDayEntries.length > 0) {
      const lastEntry = currentDayEntries[currentDayEntries.length - 1]
      return lastEntry.endTime
    }
    return '08:00'
  }, [currentDayEntries])

  // Heure de fin intelligente suggérée (arrondie à l'heure la plus proche, ex: 10h56 -> 11h00)
  const suggestedEndTime = useMemo(() => {
    const roundedNow = getSmartRoundedEndTime(new Date())
    const startNum = timeStringToHours(suggestedStartTime)
    const roundedNum = timeStringToHours(roundedNow)

    // Si l'heure arrondie actuelle est supérieure à l'heure de début, l'utiliser !
    if (roundedNum > startNum) {
      return roundedNow
    }

    // Sinon ajouter 1h à l'heure de début
    const nextH = (Math.floor(startNum) + 1) % 24
    return `${nextH.toString().padStart(2, '0')}:00`
  }, [suggestedStartTime])

  // Matrice de 24 points (1 point par heure de la journée, de 00h à 23h)
  const currentHourNow = new Date().getHours()
  const isToday = selectedDate === getFormattedDateKey()

  const day24Hours = useMemo<HourSlot[]>(() => {
    return Array.from({ length: 24 }, (_, h) => {
      const label = `${h.toString().padStart(2, '0')}:00`

      // 1. Vérifier si une entrée de ce jour couvre cette heure (00h..07h pour la nuit, pas 23h de ce soir)
      let matching = currentDayEntries.find((e) =>
        isHourCoveredByEntry(h, e.startTime, e.endTime, false)
      ) || null

      // 2. Vérifier si le lendemain a une nuit qui a commencé hier soir à cette heure (ex: 23h hier)
      if (!matching) {
        matching = nextDayEntries.find((e) =>
          isHourCoveredByEntry(h, e.startTime, e.endTime, true)
        ) || null
      }

      const isNight = matching ? isNightActivity(matching.title) : false

      return {
        hour: h,
        label,
        isFilled: matching !== null,
        isNight,
        matchingEntry: matching,
        isCurrentHour: isToday && h === currentHourNow,
      }
    })
  }, [currentDayEntries, nextDayEntries, isToday, currentHourNow])

  // Ajouter une entrée en base de données Convex
  const addEntry = useCallback(
    async (newEntry: {
      title: string
      type: ActivityType
      startTime: string
      endTime: string
    }) => {
      const startH = timeStringToHours(newEntry.startTime)
      const endH = timeStringToHours(newEntry.endTime)
      const duration = calculateDurationHours(newEntry.startTime, newEntry.endTime)

      return await addEntryMutation({
        title: newEntry.title.trim(),
        type: newEntry.type,
        startTime: newEntry.startTime,
        endTime: newEntry.endTime,
        startHour: startH,
        endHour: endH,
        durationHours: duration,
        date: selectedDate,
      })
    },
    [addEntryMutation, selectedDate]
  )

  // Supprimer une entrée en base de données Convex
  const deleteEntry = useCallback(
    async (id: string) => {
      await removeEntryMutation({ id: id as Id<'entries'> })
    },
    [removeEntryMutation]
  )

  // Réinitialiser la journée
  const resetDay = useCallback(
    async (date: string) => {
      await resetDayMutation({ date })
    },
    [resetDayMutation]
  )

  // Ajouter un nouveau sujet préchargé personnalisé en base
  const addTopic = useCallback(
    async (topic: { name: string; type: ActivityType; icon?: string }) => {
      await addTopicMutation({
        name: topic.name.trim(),
        type: topic.type,
        icon: topic.icon || 'Sparkles',
      })
    },
    [addTopicMutation]
  )

  // Statistiques de la journée
  const daySummaryStats = useMemo<DaySummaryStats>(() => {
    let totalMinutes = 0
    const byTypeMins: Record<ActivityType, number> = {
      pro: 0,
      perso: 0,
      entreprises: 0,
    }

    currentDayEntries.forEach((entry) => {
      const duration = calculateDurationHours(entry.startTime, entry.endTime)
      const mins = Math.round(duration * 60)
      totalMinutes += mins
      if (byTypeMins[entry.type] !== undefined) {
        byTypeMins[entry.type] += mins
      }
    })

    const completedHours = day24Hours.filter((s) => s.isFilled).length

    const byType = (['pro', 'perso', 'entreprises'] as ActivityType[]).map((t) => {
      const meta = ACTIVITY_TYPES_META[t]
      const mins = byTypeMins[t]
      return {
        type: t,
        label: meta.label,
        shortLabel: meta.shortLabel,
        hours: Number((mins / 60).toFixed(1)),
        percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
        color: meta.color,
      }
    })

    return {
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      totalMinutes,
      entriesCount: currentDayEntries.length,
      completedHoursCount: completedHours,
      byType,
    }
  }, [currentDayEntries, day24Hours])

  return {
    topics,
    selectedDate,
    setSelectedDate,
    currentDayEntries,
    day24Hours,
    suggestedStartTime,
    suggestedEndTime,
    addEntry,
    deleteEntry,
    resetDay,
    addTopic,
    daySummaryStats,
  }
}
