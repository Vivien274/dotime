import React, { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { ActivityType } from '../types'
import {
  getWeekDaysForDate,
  getOffsetDateKey,
  getFormattedDateKey,
  calculateDurationHours,
  isNightActivity,
  isHourCoveredByEntry,
  ACTIVITY_TYPES_META,
} from '../constants/initialData'
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

interface WeekViewProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  onSwitchToDayView: () => void
}

export const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  onSelectDate,
  onSwitchToDayView,
}) => {
  // Liste des 7 jours de la semaine (du Lundi au Dimanche)
  const weekDates = useMemo(() => getWeekDaysForDate(selectedDate), [selectedDate])

  // Requête Convex temps réel pour les 7 jours de la semaine courante
  const weekData = useQuery(api.entries.getByDateList, { dates: weekDates })

  // Semaine précédente (N-1) pour le comparatif
  const prevWeekDates = useMemo(() => {
    return weekDates.map((d) => getOffsetDateKey(d, -7))
  }, [weekDates])

  const prevWeekData = useQuery(api.entries.getByDateList, { dates: prevWeekDates })

  const todayKey = getFormattedDateKey()

  // Navigation par semaine (-7j ou +7j)
  const handlePrevWeek = () => {
    onSelectDate(getOffsetDateKey(weekDates[0], -7))
  }

  const handleNextWeek = () => {
    onSelectDate(getOffsetDateKey(weekDates[0], 7))
  }

  const handleCurrentWeek = () => {
    onSelectDate(todayKey)
  }

  // Calcul des statistiques par jour et pour l'ensemble de la semaine
  const { daysStats, weekTotalActiveHours, weekByType } = useMemo(() => {
    let weekTotalActiveMins = 0
    const weekCategoryMins: Record<ActivityType, number> = { pro: 0, perso: 0, entreprises: 0 }

    const days = weekDates.map((dateKey) => {
      const dayEntries = weekData?.[dateKey] || []
      let totalMins = 0
      let activeMins = 0
      let sleepMins = 0
      const byTypeMins: Record<ActivityType, number> = { pro: 0, perso: 0, entreprises: 0 }

      dayEntries.forEach((e) => {
        const dur = calculateDurationHours(e.startTime, e.endTime)
        const m = Math.round(dur * 60)
        totalMins += m

        if (isNightActivity(e.title)) {
          sleepMins += m
        } else {
          activeMins += m
          const entryType = e.type as ActivityType
          if (byTypeMins[entryType] !== undefined) {
            byTypeMins[entryType] += m
          }
        }
      })

      weekTotalActiveMins += activeMins
      weekCategoryMins.pro += byTypeMins.pro
      weekCategoryMins.perso += byTypeMins.perso
      weekCategoryMins.entreprises += byTypeMins.entreprises

      // Mini matrice de 24 points (0h à 23h)
      const dots = Array.from({ length: 24 }, (_, h) => {
        const matching = dayEntries.find((e) =>
          isHourCoveredByEntry(h, e.startTime, e.endTime, false)
        )
        if (!matching) return { hour: h, isFilled: false, color: null, isNight: false }

        const isNight = isNightActivity(matching.title)
        let color = '#181818'
        if (matching.type === 'perso') color = '#F59E0B'
        if (matching.type === 'entreprises') color = '#3B82F6'

        return {
          hour: h,
          isFilled: true,
          color,
          isNight,
        }
      })

      const d = new Date(dateKey + 'T12:00:00')
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()
      const dateNum = d.getDate().toString().padStart(2, '0')
      const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()

      return {
        dateKey,
        dayLabel,
        dateNum,
        monthLabel,
        totalHours: Number((totalMins / 60).toFixed(1)),
        activeHours: Number((activeMins / 60).toFixed(1)),
        sleepHours: Number((sleepMins / 60).toFixed(1)),
        entriesCount: dayEntries.length,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDate,
        dots,
      }
    })

    const byType = (['pro', 'perso', 'entreprises'] as ActivityType[]).map((t) => {
      const meta = ACTIVITY_TYPES_META[t]
      const mins = weekCategoryMins[t]
      return {
        type: t,
        label: meta.shortLabel || meta.label,
        hours: Number((mins / 60).toFixed(1)),
        percentage: weekTotalActiveMins > 0 ? Math.round((mins / weekTotalActiveMins) * 100) : 0,
        color: meta.color,
      }
    })

    return {
      daysStats: days,
      weekTotalActiveHours: Number((weekTotalActiveMins / 60).toFixed(1)),
      weekByType: byType,
    }
  }, [weekDates, weekData, todayKey, selectedDate])

  // Calcul des heures actives de la semaine précédente (N-1)
  const prevWeekActiveHours = useMemo(() => {
    if (!prevWeekData) return null
    let totalMins = 0
    prevWeekDates.forEach((dateKey) => {
      const entries = prevWeekData[dateKey] || []
      entries.forEach((e) => {
        if (!isNightActivity(e.title)) {
          const dur = calculateDurationHours(e.startTime, e.endTime)
          totalMins += Math.round(dur * 60)
        }
      })
    })
    return Number((totalMins / 60).toFixed(1))
  }, [prevWeekData, prevWeekDates])

  const diffHours = prevWeekActiveHours !== null ? Number((weekTotalActiveHours - prevWeekActiveHours).toFixed(1)) : null
  const diffPercent =
    prevWeekActiveHours && prevWeekActiveHours > 0
      ? Math.round(((weekTotalActiveHours - prevWeekActiveHours) / prevWeekActiveHours) * 100)
      : null

  const mondayDate = new Date(weekDates[0] + 'T12:00:00')
  const sundayDate = new Date(weekDates[6] + 'T12:00:00')
  const weekRangeLabel = `${mondayDate.getDate()} ${mondayDate.toLocaleDateString('fr-FR', { month: 'short' })} — ${sundayDate.getDate()} ${sundayDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barre de navigation de la semaine */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[#181818]" />
          <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-zinc-900">
            {weekRangeLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white/40 rounded-full p-0.5 border border-black/10">
          <button
            onClick={handlePrevWeek}
            title="Semaine précédente"
            className="p-1.5 rounded-full hover:bg-white/60 text-[#181818] transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={handleCurrentWeek}
            title="Cette semaine"
            className="px-2 py-0.5 rounded-full hover:bg-white/60 text-[10px] font-mono-tech font-bold text-[#181818] transition-colors"
          >
            AUJOURD'HUI
          </button>
          <button
            onClick={handleNextWeek}
            title="Semaine suivante"
            className="p-1.5 rounded-full hover:bg-white/60 text-[#181818] transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Synthèse globale de la semaine */}
      <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-800">
              BILAN ACTIF DE LA SEMAINE
            </span>
            {diffHours !== null && prevWeekActiveHours !== null && prevWeekActiveHours > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono-tech font-bold mt-0.5 ${
                diffHours >= 0 ? 'text-emerald-700' : 'text-zinc-600'
              }`}>
                {diffHours >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>
                  {diffHours >= 0 ? `+${diffHours}h` : `${diffHours}h`} ({diffHours >= 0 ? `+${diffPercent}%` : `${diffPercent}%`}) vs sem. préc.
                </span>
              </span>
            )}
          </div>
          <span className="font-dot text-lg font-bold text-[#181818]">
            {weekTotalActiveHours}H ACTIF
          </span>
        </div>

        {/* Barre segmentée PRO / PERSO / ENTP */}
        <div className="w-full h-3 rounded-full bg-black/10 overflow-hidden flex p-0.5 gap-0.5 mb-3">
          {weekByType.map((cat) => {
            if (cat.percentage <= 0) return null
            return (
              <div
                key={cat.type}
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                className="h-full rounded-full transition-all duration-500"
                title={`${cat.label}: ${cat.hours}h (${cat.percentage}%)`}
              />
            )
          })}
        </div>

        {/* Badges récapitulatifs */}
        <div className="grid grid-cols-3 gap-2">
          {weekByType.map((cat) => (
            <div
              key={cat.type}
              className="p-2 rounded-xl bg-white/40 border border-black/5 flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-1 text-[10px] font-mono-tech font-bold text-zinc-700 uppercase">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.label}</span>
              </div>
              <div className="font-dot text-xs font-bold text-[#181818] mt-0.5">
                {cat.hours}h <span className="font-normal text-[10px] opacity-70">({cat.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cartes des 7 jours de la semaine avec mini-matrices */}
      <div className="space-y-2.5">
        {daysStats.map((day) => {
          return (
            <div
              key={day.dateKey}
              onClick={() => {
                onSelectDate(day.dateKey)
                onSwitchToDayView()
              }}
              className={`group p-3.5 rounded-2xl transition-all cursor-pointer border ${
                day.isToday
                  ? 'bg-white/60 border-[#181818]/30 shadow-md ring-1 ring-[#181818]/20'
                  : 'bg-white/35 hover:bg-white/55 border-black/5 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {/* Jour & Date */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 text-center">
                    <span className="block font-mono-tech text-[10px] font-bold text-zinc-600 uppercase">
                      {day.dayLabel}
                    </span>
                    <span className="block font-dot text-base font-bold text-[#181818] leading-none">
                      {day.dateNum}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {day.isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[#181818] text-white text-[9px] font-mono-tech font-bold uppercase">
                        Aujourd'hui
                      </span>
                    )}
                    <span className="font-mono-tech text-xs text-zinc-700">
                      {day.activeHours}h actif {day.sleepHours > 0 && `· ${day.sleepHours}h nuit`}
                    </span>
                  </div>
                </div>

                {/* Accès à la journée */}
                <div className="flex items-center gap-1 text-xs font-mono-tech text-zinc-600 group-hover:text-black transition-colors">
                  <span className="font-dot text-xs font-bold text-[#181818]">
                    {day.totalHours}H
                  </span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Mini-matrice horizontale des 24 heures (0h à 23h) */}
              <div className="pt-1.5 border-t border-black/5 flex items-center justify-between gap-1 px-1">
                {day.dots.map((dot) => {
                  let bg = 'bg-black/10'
                  if (dot.isFilled) {
                    if (dot.isNight) {
                      bg = 'bg-zinc-800'
                    } else if (dot.color) {
                      bg = ''
                    }
                  }

                  return (
                    <div
                      key={dot.hour}
                      title={`${dot.hour}h : ${dot.isFilled ? (dot.isNight ? 'Sommeil' : 'Activité') : 'Vide'}`}
                      style={{ backgroundColor: dot.color && !dot.isNight ? dot.color : undefined }}
                      className={`h-2.5 flex-1 rounded-full transition-all ${
                        dot.color && !dot.isNight ? '' : bg
                      } ${dot.isNight ? 'opacity-40 scale-75' : ''}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
