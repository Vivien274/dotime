import React, { useState, useMemo } from 'react'
import type { DaySummaryStats, ActivityType, TimeEntry } from '../types'
import {
  ACTIVITY_TYPES_META,
  calculateEntryOverlapMinutes,
  isNightActivity,
} from '../constants/initialData'
import { PieChart, Clock, Moon, Briefcase } from 'lucide-react'

interface ModernTimeDonutProps {
  stats: DaySummaryStats
  entries?: TimeEntry[]
}

type TimeRangeFilter = 'all' | 'work'

export const ModernTimeDonut: React.FC<ModernTimeDonutProps> = ({ stats, entries = [] }) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all')
  const [hoveredType, setHoveredType] = useState<ActivityType | null>(null)

  const radius = 54
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  // Calcul spécifique pour la plage de travail 9h - 18h (9 heures au total)
  const workStats = useMemo(() => {
    const byTypeMins: Record<ActivityType, number> = {
      pro: 0,
      perso: 0,
      entreprises: 0,
    }
    let activeMinutes = 0

    entries.forEach((entry) => {
      // Exclure le sommeil de la répartition
      if (isNightActivity(entry.title)) return

      const overlapMins = calculateEntryOverlapMinutes(entry.startTime, entry.endTime, 9, 18)
      if (overlapMins > 0) {
        activeMinutes += overlapMins
        if (byTypeMins[entry.type] !== undefined) {
          byTypeMins[entry.type] += overlapMins
        }
      }
    })

    const byType = (['pro', 'perso', 'entreprises'] as ActivityType[]).map((t) => {
      const meta = ACTIVITY_TYPES_META[t]
      const mins = byTypeMins[t]
      return {
        type: t,
        label: meta.label,
        shortLabel: meta.shortLabel,
        hours: Number((mins / 60).toFixed(1)),
        percentage: activeMinutes > 0 ? Math.round((mins / activeMinutes) * 100) : 0,
        color: meta.color,
      }
    })

    const activeHours = Number((activeMinutes / 60).toFixed(1))
    const windowHours = 9
    const remainingHours = Number(Math.max(0, windowHours - activeHours).toFixed(1))
    const percentOfWindow = Math.min(100, Math.round((activeHours / windowHours) * 100))

    return {
      activeHours,
      activeMinutes,
      byType,
      windowHours,
      remainingHours,
      percentOfWindow,
    }
  }, [entries])

  // Données actives selon la plage horaire sélectionnée
  const isWorkRange = timeRange === 'work'
  const currentByType = isWorkRange ? workStats.byType : stats.byType
  const currentActiveHours = isWorkRange ? workStats.activeHours : stats.activeHours
  const windowHours = isWorkRange ? 9 : 24
  const remainingHours = isWorkRange
    ? workStats.remainingHours
    : Number(Math.max(0, 24 - stats.totalHours).toFixed(1))
  const completionPercent = isWorkRange
    ? workStats.percentOfWindow
    : Math.min(100, Math.round((stats.totalHours / 24) * 100))

  // Préparation des segments d'arc pour le SVG Donut
  const activeItems = currentByType.filter((item) => item.hours > 0)
  const hasMultipleActive = activeItems.length > 1
  const gap = hasMultipleActive ? 4 : 0

  let accumulatedLength = 0
  const segments = currentByType.map((item) => {
    const segmentLength = (item.percentage / 100) * circumference
    const dashLength = item.percentage > 0 ? Math.max(0, segmentLength - gap) : 0
    const offset = -accumulatedLength
    if (item.percentage > 0) {
      accumulatedLength += segmentLength
    }

    return {
      ...item,
      dashLength,
      offset,
      isHovered: hoveredType === item.type,
    }
  })

  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5">
      {/* En-tête avec titre & sélecteur de plage "Toute la journée" / "9h - 18h" */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <PieChart size={15} className="text-[#181818]" />
          <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80">
            RÉPARTITION DU TEMPS
          </h3>
        </div>

        {/* Boutons de bascule de plage Nothing OS */}
        <div className="flex items-center p-0.5 rounded-full bg-black/10 border border-black/5">
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono-tech font-bold transition-all duration-200 ${
              timeRange === 'all'
                ? 'bg-[#181818] text-white shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            Toute la journée
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('work')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono-tech font-bold transition-all duration-200 ${
              timeRange === 'work'
                ? 'bg-[#181818] text-white shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            9h - 18h
          </button>
        </div>
      </div>

      {/* Disposition : Camembert Donut + Répartition détaillée */}
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 py-1">
        {/* Donut Chart SVG Ultra-Moderne Nothing OS */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            width="148"
            height="148"
            viewBox="0 0 148 148"
            className="transform -rotate-90 drop-shadow-sm transition-transform"
          >
            {/* Piste de fond / Anneau discret */}
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="transparent"
              stroke="rgba(0, 0, 0, 0.08)"
              strokeWidth={strokeWidth}
            />

            {/* Segments du Donut proportionnels (excluant le sommeil) */}
            {currentActiveHours > 0 ? (
              segments.map((seg) => {
                if (seg.percentage <= 0) return null

                return (
                  <circle
                    key={seg.type}
                    cx="74"
                    cy="74"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={seg.isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap={hasMultipleActive ? 'round' : 'butt'}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredType(seg.type)}
                    onMouseLeave={() => setHoveredType(null)}
                  />
                )
              })
            ) : (
              // Anneau d'attente quand rien n'est saisi sur cette plage
              <circle
                cx="74"
                cy="74"
                r={radius}
                fill="transparent"
                stroke="rgba(0, 0, 0, 0.15)"
                strokeWidth={strokeWidth}
                strokeDasharray="6 6"
              />
            )}
          </svg>

          {/* Centre du Donut : Heures actives et taux de remplissage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-dot text-2xl font-bold text-[#181818] leading-none">
              {currentActiveHours}H
            </span>
            <span className="font-mono-tech text-[9px] tracking-widest text-zinc-700 uppercase font-bold mt-0.5">
              {isWorkRange ? `${completionPercent}% 9H-18H` : `${completionPercent}% JOUR`}
            </span>
          </div>
        </div>

        {/* Colonne des 3 catégories avec barres ultra-précises et largeur fixe */}
        <div className="flex-1 w-full space-y-2.5">
          {currentByType.map((item) => {
            const isHovered = hoveredType === item.type

            return (
              <div
                key={item.type}
                onMouseEnter={() => setHoveredType(item.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={`p-2.5 rounded-2xl transition-all duration-200 border ${
                  isHovered
                    ? 'bg-white/70 border-black/15 shadow-sm scale-[1.01]'
                    : 'bg-white/35 hover:bg-white/55 border-black/5'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-tech mb-1.5">
                  {/* Badge de catégorie à largeur fixe */}
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-[#181818] tracking-wider text-xs">
                      {item.shortLabel || item.label}
                    </span>
                  </div>

                  {/* Valeurs : heures et pourcentage */}
                  <div className="flex items-center gap-2">
                    <span className="font-dot text-xs text-[#181818] font-bold">
                      {item.hours}h
                    </span>
                    <span className="min-w-[2.75rem] text-center px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold text-zinc-900">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Micro-barre proportionnelle */}
                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden p-0.2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            )
          })}

          {/* Footer : info sommeil (si applicable) + reste à compléter sur deux lignes distinctes */}
          <div className="pt-2 border-t border-black/10 space-y-1.5 text-[10px] font-mono-tech text-zinc-700">
            {!isWorkRange && stats.sleepHours > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-800">
                  <Moon size={11} className="text-zinc-600 shrink-0" />
                  <span>Sommeil</span>
                  <span className="text-zinc-500 font-normal text-[9px]">(exclu)</span>
                </span>
                <span className="font-bold text-[#181818] font-dot text-xs">
                  {stats.sleepHours}h
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-600 uppercase tracking-wider text-[9px]">
                {isWorkRange ? <Briefcase size={10} className="shrink-0" /> : <Clock size={10} className="shrink-0" />}
                <span>{isWorkRange ? 'Reste 9h - 18h' : 'Temps restant'}</span>
              </span>
              <span className="font-bold text-[#181818] font-dot text-xs">
                {remainingHours}h / {windowHours}h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
