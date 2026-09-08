import React, { useState } from 'react'
import type { DaySummaryStats, ActivityType } from '../types'
import { PieChart, Clock } from 'lucide-react'

interface ModernTimeDonutProps {
  stats: DaySummaryStats
}

export const ModernTimeDonut: React.FC<ModernTimeDonutProps> = ({ stats }) => {
  const [hoveredType, setHoveredType] = useState<ActivityType | null>(null)

  const radius = 54
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  // Filtrer les éléments ayant du temps loggé
  const activeItems = stats.byType.filter((item) => item.hours > 0)
  const hasMultipleActive = activeItems.length > 1
  const gap = hasMultipleActive ? 4 : 0

  let accumulatedLength = 0
  const segments = stats.byType.map((item) => {
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

  const dayCompletionPercent = Math.min(100, Math.round((stats.totalHours / 24) * 100))
  const remainingHours = Number(Math.max(0, 24 - stats.totalHours).toFixed(1))

  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart size={15} className="text-[#181818]" />
          <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80">
            RÉPARTITION DU TEMPS
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/10 text-[11px] font-mono-tech font-bold text-[#181818]">
          <Clock size={11} />
          <span>{stats.totalHours}H / 24H</span>
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
            {/* Piste de fond / Anneau 24H discret */}
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="transparent"
              stroke="rgba(0, 0, 0, 0.08)"
              strokeWidth={strokeWidth}
            />

            {/* Segments du Donut proportionnels */}
            {stats.totalHours > 0 ? (
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
              // Anneau d'attente quand rien n'est encore saisi
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

          {/* Centre du Donut : Total d'heures et progression */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-dot text-2xl font-bold text-[#181818] leading-none">
              {stats.totalHours}H
            </span>
            <span className="font-mono-tech text-[9px] tracking-widest text-zinc-700 uppercase font-bold mt-0.5">
              {dayCompletionPercent}% JOUR
            </span>
          </div>
        </div>

        {/* Colonne des 3 catégories avec barres ultra-précises et largeur fixe */}
        <div className="flex-1 w-full space-y-2.5">
          {stats.byType.map((item) => {
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

          {/* Reste à compléter dans le cycle de 24H */}
          <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono-tech text-zinc-700">
            <span className="uppercase tracking-wider">Temps restant</span>
            <span className="font-bold text-[#181818] font-dot">{remainingHours}h / 24h</span>
          </div>
        </div>
      </div>
    </div>
  )
}
