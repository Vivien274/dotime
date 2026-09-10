import React, { useState, useEffect } from 'react'
import type { ActivityType, TimeEntry } from '../types'
import {
  ACTIVITY_TYPES_META,
  calculateDurationHours,
  timeStringToHours,
} from '../constants/initialData'
import { Edit3, X, Check, Clock } from 'lucide-react'

interface EditActivityModalProps {
  entry: TimeEntry | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (
    id: string,
    updated: {
      title: string
      type: ActivityType
      startTime: string
      endTime: string
    }
  ) => Promise<void> | void
}

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  entry,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ActivityType>('pro')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setType(entry.type)
      setStartTime(entry.startTime)
      setEndTime(entry.endTime)
    }
  }, [entry])

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !entry) return null

  const durationHours = calculateDurationHours(startTime, endTime)
  const totalMins = Math.round(durationHours * 60)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const durationLabel = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`

  const handleApplyDuration = (addMinutes: number) => {
    const startNum = timeStringToHours(startTime)
    const endMinutes = Math.round(startNum * 60) + addMinutes
    const endH = Math.floor(endMinutes / 60) % 24
    const endM = endMinutes % 60
    setEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !entry) return

    setIsSubmitting(true)
    try {
      await onUpdate(entry.id, {
        title: title.trim(),
        type,
        startTime,
        endTime,
      })
      onClose()
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/50 shadow-2xl p-6 text-[#181818]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 size={16} className="text-[#181818]" />
            <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900">
              MODIFIER L'ACTIVITÉ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-zinc-600 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélecteur de type */}
          <div>
            <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1.5">
              Catégorie
            </label>
            <div className="inline-flex bg-black/10 p-1 rounded-full border border-black/5 gap-1">
              {(['pro', 'perso', 'entreprises'] as ActivityType[]).map((t) => {
                const meta = ACTIVITY_TYPES_META[t]
                const isSelected = type === t

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                      isSelected
                        ? `${meta.bgClass} ${meta.textClass} shadow-sm`
                        : 'text-zinc-700 hover:text-black'
                    }`}
                  >
                    <span>{meta.shortLabel || meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Titre de l'activité */}
          <div>
            <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1.5">
              Titre de l'activité
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Réunion, Code, Pause..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 border border-black/10 text-[#181818] font-semibold text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#181818]"
            />
          </div>

          {/* Horaires début / fin */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="min-w-0 flex flex-col">
              <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1.5 truncate">
                Heure début
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-28 max-w-full min-w-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/15 border border-black/20 text-zinc-950 dark:text-white font-mono-tech font-bold text-sm text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#181818]"
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1.5 truncate">
                Heure fin
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-28 max-w-full min-w-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/15 border border-black/20 text-zinc-950 dark:text-white font-mono-tech font-bold text-sm text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#181818]"
              />
            </div>
          </div>



          {/* Raccourcis durée rapide */}
          <div className="flex items-center justify-between pt-1 text-[10px] font-mono-tech">
            <span className="flex items-center gap-1 text-zinc-700 font-medium">
              <Clock size={11} />
              <span>Durée : <strong className="font-dot text-[#181818] text-xs">{durationLabel}</strong></span>
            </span>
            <div className="flex items-center gap-1">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleApplyDuration(mins)}
                  className="px-2 py-0.5 rounded-md bg-black/10 hover:bg-black/20 text-[#181818] font-mono-tech font-bold text-[9px] transition-colors"
                >
                  +{mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-black/10 text-xs font-mono-tech font-bold text-zinc-800 hover:bg-black/10 transition-colors"
            >
              ANNULER
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#181818] hover:bg-black text-white text-xs font-mono-tech font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isSubmitting ? 'ENREGISTREMENT...' : 'ENREGISTRER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
