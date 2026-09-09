import React, { useMemo, useState } from 'react'
import type { TimeEntry, ActivityType, HourSlot } from '../types'
import { isNightActivity } from '../constants/initialData'
import { playMechanicalClick } from '../utils/soundEffects'

/* ==========================================================================
   TYPES & INTERFACES (48 demi-heures / 24 heures)
   ========================================================================== */

export interface HalfHourSlot {
  /** Index de 0 à 47 */
  index: number
  /** Heure parente de 0 à 23 */
  hour: number
  /** false: créneau :00-:30 (Sous-slot A) | true: créneau :30-:00 (Sous-slot B) */
  isSecondHalf: boolean
  /** "HH:mm" (ex: "08:00" ou "08:30") */
  startTime: string
  /** "HH:mm" (ex: "08:30" ou "09:00") */
  endTime: string
  /** Le créneau est-il occupé par au moins une tâche ? */
  isFilled: boolean
  /** Type d'activité dominante */
  type?: ActivityType
  /** Titre de l'activité associée */
  title?: string
  /** Est-ce une activité de nuit ou sommeil ? */
  isNight: boolean
  /** Référence vers l'entrée correspondante */
  matchingEntry: TimeEntry | null
  /** Est-ce le demi-créneau temporel actuel (si aujourd'hui) ? */
  isCurrentSlot: boolean
}

export interface Day24MatrixProps {
  /** Liste des entrées de la journée (prioritaire pour la précision 30m) */
  entries?: TimeEntry[]
  /** Slots horaires 24h (rétro-compatibilité) */
  slots?: HourSlot[]
  /** Date sélectionnée au format YYYY-MM-DD */
  selectedDate?: string
  /** Heure sélectionnée pour filtrage ou mise en avant */
  selectedHour?: number | null
  /** Callback lors du clic sur un sous-slot (vide ou rempli) avec les bornes temporelles */
  onSelectSlot?: (range: { startTime: string; endTime: string }) => void
  /** Callback lors du clic sur un trou vide détecté */
  onSelectHole?: (range: { startTime: string; endTime: string }) => void
  /** Callback lors de la sélection d'une heure */
  onSelectHour?: (hour: number) => void
  /** Identifiant de l'activité actuellement survolée ou sélectionnée dans la timeline */
  highlightedEntryId?: string | null
  /** Callback lors du clic sur une activité existante */
  onSelectEntry?: (entry: TimeEntry) => void
}

/* ==========================================================================
   HELPERS PURS : PROJECTION & CALCUL DES 48 DEMI-HEURES
   ========================================================================== */

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function compute48HalfHourSlots(
  entries: TimeEntry[] = [],
  selectedDate?: string,
  now: Date = new Date()
): HalfHourSlot[] {
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = !selectedDate || selectedDate === todayStr

  const currentMinutesNow = now.getHours() * 60 + now.getMinutes()
  const currentSlotIndexNow = Math.floor(currentMinutesNow / 30)

  return Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const isSecondHalf = i % 2 !== 0

    const slotStartMin = i * 30
    const slotEndMin = (i + 1) * 30

    const startHStr = String(hour).padStart(2, '0')
    const startTime = `${startHStr}:${isSecondHalf ? '30' : '00'}`

    const endH = isSecondHalf ? hour + 1 : hour
    const endHStr = endH === 24 ? '00' : String(endH).padStart(2, '0')
    const endTime = isSecondHalf
      ? endH === 24 ? '00:00' : `${endHStr}:00`
      : `${startHStr}:30`

    let matchingEntry: TimeEntry | null = null

    for (const entry of entries) {
      const eStart = timeToMinutes(entry.startTime)
      let eEnd = timeToMinutes(entry.endTime)

      if (entry.endTime === '00:00' || eEnd === 0) {
        eEnd = 1440
      }

      if (eStart < eEnd) {
        if (eStart < slotEndMin && eEnd > slotStartMin) {
          matchingEntry = entry
          break
        }
      } else {
        if (slotStartMin >= eStart || slotEndMin <= eEnd) {
          matchingEntry = entry
          break
        }
      }
    }

    const isNight = matchingEntry ? isNightActivity(matchingEntry.title) : false

    return {
      index: i,
      hour,
      isSecondHalf,
      startTime,
      endTime,
      isFilled: matchingEntry !== null,
      type: matchingEntry?.type,
      title: matchingEntry?.title,
      isNight,
      matchingEntry,
      isCurrentSlot: isToday && i === currentSlotIndexNow,
    }
  })
}

export function findContinuousHole(
  slotIndex: number,
  allSlots: HalfHourSlot[]
): { startTime: string; endTime: string } {
  let startIdx = slotIndex
  while (startIdx > 0 && !allSlots[startIdx - 1].isFilled) {
    startIdx--
  }

  let endIdx = slotIndex
  while (endIdx < 47 && !allSlots[endIdx + 1].isFilled) {
    endIdx++
  }

  return {
    startTime: allSlots[startIdx].startTime,
    endTime: allSlots[endIdx].endTime,
  }
}

/* ==========================================================================
   COMPOSANT PRINCIPAL : Day24Matrix (Minimaliste Blanc - Pastilles Coupées)
   ========================================================================== */

export const Day24Matrix: React.FC<Day24MatrixProps> = ({
  entries = [],
  slots,
  selectedDate,
  selectedHour,
  highlightedEntryId,
  onSelectSlot,
  onSelectHole,
  onSelectHour,
  onSelectEntry,
}) => {
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null)

  // Calcul pur des 48 demi-heures
  const halfHourSlots = useMemo(() => {
    if (entries && entries.length > 0) {
      return compute48HalfHourSlots(entries, selectedDate)
    }

    if (slots && slots.length === 24) {
      return Array.from({ length: 48 }, (_, i) => {
        const h = Math.floor(i / 2)
        const isSecond = i % 2 !== 0
        const parentSlot = slots[h]
        const startHStr = String(h).padStart(2, '0')
        const startTime = `${startHStr}:${isSecond ? '30' : '00'}`
        const endH = isSecond ? h + 1 : h
        const endTime = isSecond
          ? endH === 24 ? '00:00' : `${String(endH).padStart(2, '0')}:00`
          : `${startHStr}:30`

        return {
          index: i,
          hour: h,
          isSecondHalf: isSecond,
          startTime,
          endTime,
          isFilled: parentSlot?.isFilled || false,
          type: parentSlot?.matchingEntry?.type,
          title: parentSlot?.matchingEntry?.title,
          isNight: parentSlot?.isNight || false,
          matchingEntry: parentSlot?.matchingEntry || null,
          isCurrentSlot: parentSlot?.isCurrentHour && !isSecond,
        }
      })
    }

    return compute48HalfHourSlots([], selectedDate)
  }, [entries, slots, selectedDate])

  // Total d'heures logguées
  const filledCount = halfHourSlots.filter((s) => s.isFilled).length
  const loggedHours = (filledCount * 0.5).toFixed(1).replace('.0', '')

  const handleSlotInteraction = (slot: HalfHourSlot) => {
    playMechanicalClick()
    setActiveSlotIdx(slot.index)
    if (onSelectHour) {
      onSelectHour(slot.hour)
    }

    if (slot.isFilled && slot.matchingEntry) {
      if (onSelectEntry) {
        onSelectEntry(slot.matchingEntry)
      }
    } else {
      const hole = findContinuousHole(slot.index, halfHourSlots)
      if (onSelectHole) {
        onSelectHole(hole)
      }
      if (onSelectSlot) {
        onSelectSlot(hole)
      }
    }
  }

  // Rendu d'une pastille ronde d'une heure (découpée en 2 demi-lunes blanches)
  const renderHourDot = (hour: number) => {
    const subA = halfHourSlots[hour * 2]
    const subB = halfHourSlots[hour * 2 + 1]
    const isHourSelected = selectedHour === hour || activeSlotIdx === subA.index || activeSlotIdx === subB.index

    // Vérifier si cette pastille correspond à l'activité sélectionnée ou survolée dans la timeline
    const isHighlighted = Boolean(
      highlightedEntryId &&
      ((subA.matchingEntry && subA.matchingEntry.id === highlightedEntryId) ||
       (subB.matchingEntry && subB.matchingEntry.id === highlightedEntryId))
    )

    return (
      <div
        key={hour}
        className={`relative aspect-square w-full rounded-full flex overflow-hidden p-[1px] transition-all duration-300 transform ${
          isHighlighted
            ? 'ring-3 ring-white shadow-[0_0_16px_rgba(255,255,255,1)] scale-110 z-30 animate-pulse'
            : isHourSelected
            ? 'ring-2 ring-[#181818] dark:ring-white ring-offset-2 ring-offset-[#FFA43B] scale-105 z-10'
            : ''
        } bg-black/15 dark:bg-white/10 border border-black/10 dark:border-white/15`}
      >
        {/* Demi-lune gauche : :00 à :30 */}
        <button
          type="button"
          onClick={() => handleSlotInteraction(subA)}
          onTouchEnd={(e) => {
            e.stopPropagation()
            handleSlotInteraction(subA)
          }}
          title={`${subA.startTime} - ${subA.endTime}${
            subA.title ? ` : ${subA.title} (${subA.isNight ? 'Nuit' : subA.type?.toUpperCase() || 'Actif'})` : ' (vide)'
          }`}
          aria-label={`Créneau ${subA.startTime} à ${subA.endTime}`}
          className={`relative w-1/2 h-full rounded-l-full flex items-center justify-center cursor-pointer transition-all active:scale-95 touch-manipulation ${
            subA.isFilled
              ? subA.isNight
                ? 'bg-white/40 shadow-xs'
                : 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
              : 'bg-transparent hover:bg-black/15 dark:hover:bg-white/15'
          }`}
        >
          {/* Nuit : petit point central blanc */}
          {subA.isFilled && subA.isNight && (
            <span className="w-1 h-1 rounded-full bg-white shadow-xs" />
          )}

          {/* Curseur subtil 'Maintenant' */}
          {subA.isCurrentSlot && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                subA.isFilled ? 'bg-[#181818]' : 'bg-[#181818] animate-ping'
              }`}
            />
          )}
        </button>

        {/* Fente séparatrice médiane ultra-fine à opacité douce */}
        <div className="w-[1px] h-full bg-black/[0.08] dark:bg-white/[0.08] shrink-0 pointer-events-none" />

        {/* Demi-lune droite : :30 à :00 */}
        <button
          type="button"
          onClick={() => handleSlotInteraction(subB)}
          onTouchEnd={(e) => {
            e.stopPropagation()
            handleSlotInteraction(subB)
          }}
          title={`${subB.startTime} - ${subB.endTime}${
            subB.title ? ` : ${subB.title} (${subB.isNight ? 'Nuit' : subB.type?.toUpperCase() || 'Actif'})` : ' (vide)'
          }`}
          aria-label={`Créneau ${subB.startTime} à ${subB.endTime}`}
          className={`relative w-1/2 h-full rounded-r-full flex items-center justify-center cursor-pointer transition-all active:scale-95 touch-manipulation ${
            subB.isFilled
              ? subB.isNight
                ? 'bg-white/40 shadow-xs'
                : 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]'
              : 'bg-transparent hover:bg-black/15 dark:hover:bg-white/15'
          }`}
        >
          {/* Nuit : petit point central blanc */}
          {subB.isFilled && subB.isNight && (
            <span className="w-1 h-1 rounded-full bg-white shadow-xs" />
          )}

          {/* Curseur subtil 'Maintenant' */}
          {subB.isCurrentSlot && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                subB.isFilled ? 'bg-[#181818]' : 'bg-[#181818] animate-ping'
              }`}
            />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg p-5 select-none touch-manipulation">
      {/* En-tête minimaliste Timdot */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#181818]" />
          <h2 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80">
            MATRICE 24 HEURES
          </h2>
        </div>
        <span className="font-dot text-xs text-[#181818] font-bold">
          {loggedHours} / 24H
        </span>
      </div>

      {/* Matrice de 24 pastilles rondes découpées en deux : 4 lignes de 7 pastilles */}
      <div className="py-2">
        <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
          {Array.from({ length: 24 }, (_, h) => renderHourDot(h))}
        </div>
      </div>
    </div>
  )
}

export default Day24Matrix
