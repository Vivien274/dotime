import React, { useState, useMemo, useEffect } from 'react'
import type { TimeEntry, DaySummaryStats, ActivityType } from '../types'
import { ACTIVITY_TYPES_META, isNightActivity } from '../constants/initialData'
import { ModernTimeDonut } from './ModernTimeDonut'
import { EditActivityModal } from './EditActivityModal'
import { Clock, Trash2, CalendarCheck, Edit3, Plus, Moon } from 'lucide-react'
import { playMechanicalClick, playSoftTick } from '../utils/soundEffects'

interface DayEntriesListProps {
  entries: TimeEntry[]
  onDeleteEntry: (id: string) => void
  onUpdateEntry?: (
    id: string,
    updated: {
      title: string
      type: ActivityType
      startTime: string
      endTime: string
    }
  ) => Promise<void> | void
  onSelectHole?: (range: { startTime: string; endTime: string }) => void
  highlightedEntryId?: string | null
  onHoverEntry?: (id: string | null) => void
  stats: DaySummaryStats
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function formatMinutesDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
  }
  return `${mins}m`
}

function getEntryEffectiveMinutes(entry: TimeEntry): { startMin: number; endMin: number } {
  const s = timeToMinutes(entry.startTime)
  let e = timeToMinutes(entry.endTime)
  if (entry.endTime === '00:00' && entry.startTime !== '00:00') {
    e = 1440
  }

  // Si l'activité traverse minuit (ex: 23:00 -> 07:00), elle correspond au sommeil de la nuit passée
  // qui s'est achevé ce matin. Dans le cycle de la journée, elle se positionne au tout début (startMin négatif).
  if (e < s) {
    return {
      startMin: s - 1440,
      endMin: e,
    }
  }

  return {
    startMin: s,
    endMin: e,
  }
}

export const DayEntriesList: React.FC<DayEntriesListProps> = ({
  entries,
  onDeleteEntry,
  onUpdateEntry,
  onSelectHole,
  highlightedEntryId,
  onHoverEntry,
  stats,
}) => {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  // Faire défiler automatiquement la timeline vers l'activité ciblée depuis la matrice
  useEffect(() => {
    if (highlightedEntryId) {
      const el = document.getElementById(`timeline-entry-${highlightedEntryId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [highlightedEntryId])

  // Trier les entrées en ordre antéchronologique (le plus récent en haut, la nuit passée tout en bas)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aTimes = getEntryEffectiveMinutes(a)
      const bTimes = getEntryEffectiveMinutes(b)
      return bTimes.startMin - aTimes.startMin // Descendant : plus récent en haut
    })
  }, [entries])

  // Détecter les trous temporels réels entre les entrées
  const timelineItems = useMemo(() => {
    const items: Array<
      | { kind: 'entry'; entry: TimeEntry }
      | { kind: 'gap'; startTime: string; endTime: string; durationMinutes: number }
    > = []

    for (let i = 0; i < sortedEntries.length; i++) {
      const current = sortedEntries[i]
      items.push({ kind: 'entry', entry: current })

      // Vérifier s'il y a un trou avec l'entrée précédente dans la journée (qui a eu lieu plus tôt)
      if (i < sortedEntries.length - 1) {
        const earlierEntry = sortedEntries[i + 1]
        const currentTimes = getEntryEffectiveMinutes(current)
        const earlierTimes = getEntryEffectiveMinutes(earlierEntry)

        if (currentTimes.startMin > earlierTimes.endMin + 5) {
          // Trou supérieur à 5 minutes
          items.push({
            kind: 'gap',
            startTime: earlierEntry.endTime,
            endTime: current.startTime,
            durationMinutes: currentTimes.startMin - earlierTimes.endMin,
          })
        }
      }
    }

    return items
  }, [sortedEntries])


  return (
    <div className="space-y-4">
      {/* Conteneur principal façon carte glassmorphism Nothing OS */}
      <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg p-5 select-none">
        {/* En-tête de la chronologie */}
        <div className="flex items-center justify-between mb-5 w-full">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-[#181818] shrink-0" />
            <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80">
              TIMELINE · RÉCENT EN HAUT
            </h3>
          </div>
          <span className="font-mono-tech text-[11px] font-bold text-zinc-900/70">
            {entries.length} {entries.length <= 1 ? 'activité' : 'activités'}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="py-10 text-center text-zinc-700 font-mono-tech text-xs">
            Aucune activité enregistrée pour cette journée. Cliquez sur une pastille ou un sujet pour commencer votre suivi.
          </div>
        ) : (
          /* Axe vertical de la timeline avec centrage absolu des nœuds */
          <div className="relative py-1">
            {/* Colonne vertébrale continue (axe vertical parfaitement centré à 14px) */}
            <div className="absolute left-[14px] top-3 bottom-3 w-0.5 -translate-x-1/2 border-l-2 border-dashed border-black/20 dark:border-white/20 pointer-events-none" />

            <div className="space-y-3.5">
              {timelineItems.map((item, idx) => {
                if (item.kind === 'gap') {
                  return (
                    /* Créneau libre disponible entre 2 activités */
                    <div key={`gap-${idx}`} className="relative flex items-center pl-9 my-2">
                      {/* Nœud vide parfaitement centré sur l'axe à 14px */}
                      <div className="absolute left-[14px] -translate-x-1/2 w-2 h-2 rounded-full bg-white border border-black/40 shadow-xs z-10" />

                      {/* Bouton de remplissage du trou */}
                      <button
                        type="button"
                        onClick={() => {
                          playMechanicalClick()
                          onSelectHole?.({
                            startTime: item.startTime,
                            endTime: item.endTime,
                          })
                        }}
                        title="Cliquer pour remplir ce créneau libre"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono-tech font-bold text-zinc-800 bg-white/40 hover:bg-white/80 border border-black/10 hover:border-black/30 shadow-xs transition-all cursor-pointer active:scale-95 touch-manipulation"
                      >
                        <Plus size={11} className="text-[#181818]" />
                        <span>
                          {item.startTime} → {item.endTime}
                        </span>
                        <span className="text-zinc-600 font-normal">
                          ({formatMinutesDuration(item.durationMinutes)} libre)
                        </span>
                      </button>
                    </div>
                  )
                }

                const entry = item.entry
                const totalMins = Math.round(entry.durationHours * 60)
                const durationLabel = formatMinutesDuration(totalMins)
                const typeMeta = ACTIVITY_TYPES_META[entry.type] || ACTIVITY_TYPES_META.pro
                const badgeText =
                  typeMeta.shortLabel || (entry.type === 'entreprises' ? 'ENTP' : typeMeta.label)
                const isNight = isNightActivity(entry.title)
                const isHighlighted = highlightedEntryId === entry.id

                return (
                  <div
                    key={entry.id}
                    id={`timeline-entry-${entry.id}`}
                    onMouseEnter={() => onHoverEntry?.(entry.id)}
                    onMouseLeave={() => onHoverEntry?.(null)}
                    className="relative group/item pl-9 transition-all duration-300"
                  >
                    {/* Nœud d'ancrage parfaitement centré sur l'axe à 14px */}
                    <div
                      className={`absolute left-[14px] -translate-x-1/2 top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-300 ${
                        isHighlighted
                          ? 'scale-150 ring-3 ring-white shadow-[0_0_14px_#ffffff]'
                          : 'group-hover/item:scale-125'
                      } ${
                        isNight
                          ? 'bg-zinc-700 ring-1 ring-zinc-400'
                          : entry.type === 'pro'
                          ? 'bg-[#181818]'
                          : entry.type === 'perso'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#3B82F6]'
                      }`}
                    />

                    {/* Carte d'activité cliquable */}
                    <div
                      onClick={() => {
                        playSoftTick()
                        if (onUpdateEntry) setEditingEntry(entry)
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                        isHighlighted
                          ? 'bg-white/95 ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.7)] scale-[1.02] border-white z-20'
                          : 'bg-white/40 hover:bg-white/70 border border-black/5 shadow-xs group-hover/item:shadow-md'
                      }`}
                      title="Cliquer pour modifier cette activité"
                    >
                      {/* Corps principal : Horaires, Badge, Titre */}
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Ligne 1 : Heures et Catégorie */}
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono-tech">
                          <span className="flex items-center gap-1 font-bold text-zinc-900">
                            <Clock size={11} className="text-zinc-700" />
                            {entry.startTime} → {entry.endTime}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-xs ${typeMeta.bgClass} ${typeMeta.textClass}`}
                          >
                            {badgeText}
                          </span>

                          {isNight && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] bg-zinc-800 text-zinc-200 font-bold">
                              <Moon size={9} />
                              <span>SOMMEIL</span>
                            </span>
                          )}
                        </div>

                        {/* Ligne 2 : Titre de l'activité */}
                        <h4 className="font-bold text-sm text-[#181818] truncate group-hover/item:text-black">
                          {entry.title}
                        </h4>
                      </div>

                      {/* Actions & Durée */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/5"
                      >
                        {/* Badge durée */}
                        <span className="font-dot text-xs px-2.5 py-1 rounded-full bg-black/10 text-[#181818] font-bold">
                          {durationLabel}
                        </span>

                        {/* Boutons modifier & supprimer */}
                        <div className="flex items-center gap-1">
                          {onUpdateEntry && (
                            <button
                              type="button"
                              onClick={() => {
                                playSoftTick()
                                setEditingEntry(entry)
                              }}
                              title="Modifier cette activité"
                              className="p-1.5 rounded-full hover:bg-black/10 text-zinc-600 hover:text-black transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              playMechanicalClick()
                              onDeleteEntry(entry.id)
                            }}
                            title="Supprimer cette activité"
                            className="p-1.5 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Camembert / Donut ultra-moderne Timdot pour la RÉPARTITION DU TEMPS */}
      <ModernTimeDonut stats={stats} entries={entries} />

      {/* Modal d'édition d'activité */}
      {onUpdateEntry && (
        <EditActivityModal
          entry={editingEntry}
          isOpen={editingEntry !== null}
          onClose={() => setEditingEntry(null)}
          onUpdate={onUpdateEntry}
        />
      )}
    </div>
  )
}

export default DayEntriesList
