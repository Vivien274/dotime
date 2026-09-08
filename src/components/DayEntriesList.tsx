import React from 'react'
import type { TimeEntry, DaySummaryStats } from '../types'
import { ACTIVITY_TYPES_META } from '../constants/initialData'
import { ModernTimeDonut } from './ModernTimeDonut'
import { Clock, Trash2, CalendarCheck } from 'lucide-react'

interface DayEntriesListProps {
  entries: TimeEntry[]
  onDeleteEntry: (id: string) => void
  stats: DaySummaryStats
}

export const DayEntriesList: React.FC<DayEntriesListProps> = ({
  entries,
  onDeleteEntry,
  stats,
}) => {
  return (
    <div className="space-y-4">
      {/* Liste des créneaux chronologiques */}
      <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg p-5">
        <div className="flex items-center gap-2 mb-3.5 w-full">
          <CalendarCheck size={15} className="text-[#181818] shrink-0" />
          <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80 w-full">
            ACTIVITÉS DE LA JOURNÉE
          </h3>
        </div>

        {entries.length === 0 ? (
          <div className="py-8 text-center text-zinc-700 font-mono-tech text-xs">
            Aucune activité enregistrée pour cette journée. Cliquez sur un sujet ci-dessus pour commencer votre suivi.
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => {
              const totalMins = Math.round(entry.durationHours * 60)
              const hours = Math.floor(totalMins / 60)
              const mins = totalMins % 60
              const durationLabel =
                hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`
              const typeMeta = ACTIVITY_TYPES_META[entry.type] || ACTIVITY_TYPES_META.pro
              const badgeText = typeMeta.shortLabel || (entry.type === 'entreprises' ? 'ENTP' : typeMeta.label)

              const [startH, startM] = (entry.startTime || '00:00').split(':').map(Number)
              const [endH, endM] = (entry.endTime || '00:00').split(':').map(Number)
              const isOvernight = (startH * 60 + startM) > (endH * 60 + endM) && entry.endTime !== '00:00'

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border border-black/5 shadow-sm transition-all"
                >
                  {/* Badge type à largeur fixe et titre */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={`w-[3.75rem] text-center shrink-0 py-1 rounded-xl text-[10px] font-mono-tech font-bold uppercase tracking-wider shadow-sm ${typeMeta.bgClass} ${typeMeta.textClass}`}
                    >
                      {badgeText}
                    </span>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#181818] truncate">
                        {entry.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] font-mono-tech text-zinc-700">
                        <span className="flex items-center gap-1 font-semibold text-zinc-900">
                          <Clock size={10} />
                          {entry.startTime}{isOvernight ? ' (hier)' : ''} - {entry.endTime}
                        </span>
                        <span>·</span>
                        <span>{durationLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions et suppression */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-dot text-xs px-2.5 py-1 rounded-full bg-black/10 text-[#181818] font-bold">
                      {durationLabel}
                    </span>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      title="Supprimer cette activité"
                      className="p-1.5 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Camembert / Donut ultra-moderne Nothing OS pour la RÉPARTITION DU TEMPS */}
      <ModernTimeDonut stats={stats} entries={entries} />
    </div>
  )
}
