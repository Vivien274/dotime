import React from 'react'
import type { HourSlot } from '../hooks/useTimeTracker'

interface Day24MatrixProps {
  slots: HourSlot[]
  onSelectHour: (hour: number) => void
  onSelectHole?: (range: { startTime: string; endTime: string }) => void
  selectedHour: number | null
}

export const Day24Matrix: React.FC<Day24MatrixProps> = ({
  slots,
  onSelectHour,
  onSelectHole,
  selectedHour,
}) => {
  const loggedCount = slots.filter((s) => s.isFilled).length

  const handleSlotClick = (slot: HourSlot) => {
    onSelectHour(slot.hour)
    if (!slot.isFilled && onSelectHole) {
      // Trouver la plage vide continue autour de cette heure (trou)
      let startH = slot.hour
      while (startH > 0 && !slots[startH - 1]?.isFilled) {
        startH--
      }
      let endH = slot.hour
      while (endH < 23 && !slots[endH + 1]?.isFilled) {
        endH++
      }

      const startStr = `${startH.toString().padStart(2, '0')}:00`
      const nextH = endH + 1
      const endStr = nextH === 24 ? '00:00' : `${nextH.toString().padStart(2, '0')}:00`

      onSelectHole({ startTime: startStr, endTime: endStr })
    }
  }

  return (
    <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg p-5">
      {/* En-tête minimaliste Timdot */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#181818]" />
          <h2 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80">
            MATRICE 24 HEURES
          </h2>
        </div>
        <span className="font-dot text-xs text-[#181818] font-bold">
          {loggedCount} / 24H
        </span>
      </div>

      {/* Matrice de 24 points purs : 2 rangées de 12 points */}
      <div className="space-y-3 py-2">
        {/* Rangée 1 : 00h à 11h (12 points) */}
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
          {slots.slice(0, 12).map((slot) => {
            const isFilled = slot.isFilled
            const isNight = slot.isNight
            const isActiveDay = isFilled && !isNight
            const isSelected = selectedHour === slot.hour

            return (
              <button
                key={slot.hour}
                type="button"
                onClick={() => handleSlotClick(slot)}
                title={`${slot.label}${
                  slot.matchingEntry
                    ? ` : ${slot.matchingEntry.title} (${isNight ? 'Nuit / Sommeil' : 'Actif'})`
                    : ' (non complété)'
                }`}
                className={`relative aspect-square w-full min-h-[20px] rounded-full p-0 flex items-center justify-center transition-all duration-200 transform active:scale-90 ${
                  isActiveDay
                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] border-2 border-white scale-100'
                    : 'bg-black/15 hover:bg-black/25 border border-black/10'
                } ${
                  isSelected
                    ? 'ring-2 ring-[#181818] ring-offset-2 ring-offset-[#FFA43B]'
                    : ''
                } ${
                  slot.isCurrentHour && !isFilled
                    ? 'ring-1 ring-[#181818]'
                    : ''
                }`}
              >
                {/* Nuit / Sommeil : point blanc plus petit sur fond noir léger */}
                {isFilled && isNight && (
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-xs" />
                )}

                {/* Petit point central si heure actuelle pour repère subtil */}
                {slot.isCurrentHour && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFilled
                        ? isNight
                          ? 'bg-[#181818]'
                          : 'bg-[#181818]'
                        : 'bg-[#181818] animate-ping'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Rangée 2 : 12h à 23h (12 points) */}
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
          {slots.slice(12, 24).map((slot) => {
            const isFilled = slot.isFilled
            const isNight = slot.isNight
            const isActiveDay = isFilled && !isNight
            const isSelected = selectedHour === slot.hour

            return (
              <button
                key={slot.hour}
                type="button"
                onClick={() => handleSlotClick(slot)}
                title={`${slot.label}${
                  slot.matchingEntry
                    ? ` : ${slot.matchingEntry.title} (${isNight ? 'Nuit / Sommeil' : 'Actif'})`
                    : ' (non complété)'
                }`}
                className={`relative aspect-square w-full min-h-[20px] rounded-full p-0 flex items-center justify-center transition-all duration-200 transform active:scale-90 ${
                  isActiveDay
                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] border-2 border-white scale-100'
                    : 'bg-black/15 hover:bg-black/25 border border-black/10'
                } ${
                  isSelected
                    ? 'ring-2 ring-[#181818] ring-offset-2 ring-offset-[#FFA43B]'
                    : ''
                } ${
                  slot.isCurrentHour && !isFilled
                    ? 'ring-1 ring-[#181818]'
                    : ''
                }`}
              >
                {/* Nuit / Sommeil : point blanc plus petit sur fond noir léger */}
                {isFilled && isNight && (
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-xs" />
                )}

                {/* Petit point central si heure actuelle pour repère subtil */}
                {slot.isCurrentHour && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFilled
                        ? isNight
                          ? 'bg-[#181818]'
                          : 'bg-[#181818]'
                        : 'bg-[#181818] animate-ping'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
