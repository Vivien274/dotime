import React, { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  getFormattedDateKey,
  calculateDurationHours,
  isNightActivity,
} from '../constants/initialData'
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react'

interface MonthHeatmapViewProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  onSwitchToDayView: () => void
}

export const MonthHeatmapView: React.FC<MonthHeatmapViewProps> = ({
  selectedDate,
  onSelectDate,
  onSwitchToDayView,
}) => {
  const [currentDateObj, setCurrentDateObj] = useState(() => new Date(selectedDate + 'T12:00:00'))

  const year = currentDateObj.getFullYear()
  const month = currentDateObj.getMonth() // 0-indexed

  // Obtenir le nombre de jours dans le mois
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  // Décalage pour commencer le Lundi (Lundi = 0, Dimanche = 6)
  const startDayOffset = (firstDayOfWeek + 6) % 7

  // Liste des clés de dates du mois
  const monthDates = useMemo(() => {
    const dates: string[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day, 12, 0, 0)
      dates.push(getFormattedDateKey(d))
    }
    return dates
  }, [year, month, daysInMonth])

  // Requête Convex pour toutes les dates du mois
  const monthData = useQuery(api.entries.getByDateList, { dates: monthDates })

  const todayKey = getFormattedDateKey()

  const handlePrevMonth = () => {
    setCurrentDateObj(new Date(year, month - 1, 1, 12, 0, 0))
  }

  const handleNextMonth = () => {
    setCurrentDateObj(new Date(year, month + 1, 1, 12, 0, 0))
  }

  const handleCurrentMonth = () => {
    setCurrentDateObj(new Date())
  }

  // Calcul des statistiques par jour et bilan mensuel
  const { dayStatsMap, monthTotalActiveHours } = useMemo(() => {
    let totalMins = 0
    const map: Record<string, { activeHours: number; entriesCount: number }> = {}

    monthDates.forEach((dateKey) => {
      const entries = monthData?.[dateKey] || []
      let dayActiveMins = 0

      entries.forEach((e) => {
        if (!isNightActivity(e.title)) {
          const dur = calculateDurationHours(e.startTime, e.endTime)
          const m = Math.round(dur * 60)
          dayActiveMins += m
        }
      })

      totalMins += dayActiveMins
      map[dateKey] = {
        activeHours: Number((dayActiveMins / 60).toFixed(1)),
        entriesCount: entries.length,
      }
    })

    return {
      dayStatsMap: map,
      monthTotalActiveHours: Number((totalMins / 60).toFixed(1)),
    }
  }, [monthDates, monthData])

  const monthLabel = currentDateObj.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase()

  const activeDaysCount = Object.values(dayStatsMap).filter((d) => d.activeHours > 0).length
  const avgHoursPerActiveDay =
    activeDaysCount > 0 ? Number((monthTotalActiveHours / activeDaysCount).toFixed(1)) : 0

  const weekDayLabels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barre de navigation du mois */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[#181818]" />
          <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-zinc-900">
            {monthLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white/40 rounded-full p-0.5 border border-black/10">
          <button
            onClick={handlePrevMonth}
            title="Mois précédent"
            className="p-1.5 rounded-full hover:bg-white/60 text-[#181818] transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={handleCurrentMonth}
            title="Ce mois-ci"
            className="px-2 py-0.5 rounded-full hover:bg-white/60 text-[10px] font-mono-tech font-bold text-[#181818] transition-colors"
          >
            AUJOURD'HUI
          </button>
          <button
            onClick={handleNextMonth}
            title="Mois suivant"
            className="p-1.5 rounded-full hover:bg-white/60 text-[#181818] transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Synthèse du mois */}
      <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#181818]" />
            <span className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-800">
              HEATMAP & BILAN MENSUEL
            </span>
          </div>
          <span className="font-dot text-lg font-bold text-[#181818]">
            {monthTotalActiveHours}H AU TOTAL
          </span>
        </div>

        {/* Moyenne & Jours actifs */}
        <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-700 pt-1 pb-3 border-b border-black/10">
          <span>Jours actifs : <strong className="font-dot text-sm text-[#181818]">{activeDaysCount} / {daysInMonth}</strong></span>
          <span>Moyenne active : <strong className="font-dot text-sm text-[#181818]">{avgHoursPerActiveDay}h / j</strong></span>
        </div>

        {/* Grille Heatmap Nothing OS en points */}
        <div className="pt-4">
          {/* En-têtes des jours de semaine */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDayLabels.map((lbl) => (
              <span key={lbl} className="font-mono-tech text-[9px] font-bold text-zinc-600 tracking-wider">
                {lbl}
              </span>
            ))}
          </div>

          {/* Grille des cellules du mois */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Espaces vides avant le 1er du mois */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}

            {/* Jours du mois */}
            {monthDates.map((dateKey, idx) => {
              const dayNum = idx + 1
              const stat = dayStatsMap[dateKey] || { activeHours: 0, entriesCount: 0 }
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate

              // 4 niveaux d'intensité
              let intensityClass = 'bg-black/10 hover:bg-black/20 text-zinc-700'
              if (stat.activeHours > 0 && stat.activeHours <= 3) {
                intensityClass = 'bg-white/50 hover:bg-white/70 text-zinc-900 border border-black/10'
              } else if (stat.activeHours > 3 && stat.activeHours <= 6) {
                intensityClass = 'bg-white/85 hover:bg-white text-[#181818] font-bold shadow-xs'
              } else if (stat.activeHours > 6) {
                intensityClass = 'bg-white text-[#181818] font-bold shadow-md ring-1 ring-black/20'
              }

              return (
                <button
                  key={dateKey}
                  onClick={() => {
                    onSelectDate(dateKey)
                    onSwitchToDayView()
                  }}
                  title={`${dayNum} ${monthLabel} : ${stat.activeHours}h actives (${stat.entriesCount} activités)`}
                  className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-between transition-all duration-200 transform active:scale-95 cursor-pointer ${intensityClass} ${
                    isSelected ? 'ring-2 ring-[#181818] ring-offset-2 ring-offset-[#FFA43B]' : ''
                  } ${isToday ? 'border-2 border-[#181818]' : ''}`}
                >
                  <span className="text-[10px] font-mono-tech font-bold leading-none">
                    {dayNum}
                  </span>
                  <span className="font-dot text-[10px] leading-none">
                    {stat.activeHours > 0 ? `${stat.activeHours}h` : '·'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Légende d'intensité Nothing OS */}
          <div className="flex items-center justify-between text-[9px] font-mono-tech text-zinc-600 mt-4 pt-3 border-t border-black/10 px-1">
            <span className="uppercase tracking-wider">Intensité active :</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">0h</span>
              <span className="w-3 h-3 rounded-md bg-black/10 border border-black/5" />
              <span className="w-3 h-3 rounded-md bg-white/50 border border-black/10" />
              <span className="w-3 h-3 rounded-md bg-white/85 shadow-xs" />
              <span className="w-3 h-3 rounded-md bg-white shadow-md ring-1 ring-black/20" />
              <span className="text-zinc-900 font-bold">+6h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
