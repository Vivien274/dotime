import React, { useState, useEffect } from 'react'
import type { ActivityType, PreloadedTopic } from '../types'
import { ACTIVITY_TYPES_META, timeStringToHours } from '../constants/initialData'
import { IconRenderer } from './IconRenderer'
import { X, Plus, Check, Clock, Sparkles } from 'lucide-react'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  topics: PreloadedTopic[]
  suggestedStartTime: string
  suggestedEndTime: string
  onAddEntry: (entry: {
    title: string
    type: ActivityType
    startTime: string
    endTime: string
  }) => void
  onAddTopic: (topic: { name: string; type: ActivityType; icon?: string }) => void
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  topics,
  suggestedStartTime,
  suggestedEndTime,
  onAddEntry,
  onAddTopic,
}) => {
  const [activeType, setActiveType] = useState<ActivityType>('pro')
  const [selectedTopicName, setSelectedTopicName] = useState('Réunion')
  const [customTitle, setCustomTitle] = useState('Réunion')
  const [startTime, setStartTime] = useState(suggestedStartTime)
  const [endTime, setEndTime] = useState(suggestedEndTime)
  const [isAddingNewTopic, setIsAddingNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStartTime(suggestedStartTime)
      setEndTime(suggestedEndTime)
      const firstTopic = topics.find((t) => t.type === activeType)
      if (firstTopic) {
        setSelectedTopicName(firstTopic.name)
        setCustomTitle(firstTopic.name)
      }
    }
  }, [isOpen, suggestedStartTime, suggestedEndTime])

  // Fermeture avec Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentTypeTopics = topics.filter((t) => t.type === activeType)

  const startNum = timeStringToHours(startTime)
  const endNum = timeStringToHours(endTime)
  const duration = endNum >= startNum ? endNum - startNum : 24 - startNum + endNum
  const durationH = Math.floor(duration)
  const durationM = Math.round((duration - durationH) * 60)
  const durationStr =
    durationH > 0
      ? `${durationH}h${durationM > 0 ? ` ${durationM}m` : ''}`
      : `${durationM}m`

  const handleSelectTopic = (topic: PreloadedTopic) => {
    setSelectedTopicName(topic.name)
    setCustomTitle(topic.name)
  }

  const handleSetNow = () => {
    const now = new Date()
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    setEndTime(`${h}:${m}`)
  }

  const handleCreateCustomTopic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicName.trim()) return
    onAddTopic({
      name: newTopicName.trim(),
      type: activeType,
      icon: activeType === 'pro' ? 'Briefcase' : activeType === 'perso' ? 'Coffee' : 'Globe',
    })
    setSelectedTopicName(newTopicName.trim())
    setCustomTitle(newTopicName.trim())
    setNewTopicName('')
    setIsAddingNewTopic(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalTitle = customTitle.trim() || selectedTopicName
    if (!finalTitle) return

    onAddEntry({
      title: finalTitle,
      type: activeType,
      startTime,
      endTime,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-6 text-[#181818]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#181818]" />
            <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900">
              AJOUT RAPIDE D'ACTIVITÉ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-zinc-600 hover:text-black cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Sélecteur de Type */}
          <div>
            <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1.5">
              Catégorie
            </label>
            <div className="inline-flex bg-black/[0.05] p-1 rounded-full border border-black/10 gap-1">
              {(['pro', 'perso', 'entreprises'] as ActivityType[]).map((typeKey) => {
                const meta = ACTIVITY_TYPES_META[typeKey]
                const isSelected = activeType === typeKey

                return (
                  <button
                    type="button"
                    key={typeKey}
                    onClick={() => {
                      setActiveType(typeKey)
                      const firstTopic = topics.find((t) => t.type === typeKey)
                      if (firstTopic) {
                        setSelectedTopicName(firstTopic.name)
                        setCustomTitle(firstTopic.name)
                      }
                    }}
                    className={`py-1.5 px-3.5 rounded-full text-[10px] font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#181818] text-white shadow-sm'
                        : 'text-zinc-700 hover:text-black hover:bg-black/[0.05]'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Sujets rapides */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold">
                Sujets fréquents
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewTopic(!isAddingNewTopic)}
                className="text-[10px] font-mono-tech uppercase text-[#181818] hover:underline font-bold flex items-center gap-0.5"
              >
                <Plus size={10} />
                <span>Nouveau</span>
              </button>
            </div>

            {isAddingNewTopic && (
              <div className="flex gap-2 p-2 mb-2 rounded-2xl bg-white/50 border border-black/10">
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Nouveau sujet..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/80 border border-black/10 text-xs font-sans focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomTopic}
                  className="px-3 py-1.5 rounded-xl bg-[#181818] text-white text-[10px] font-mono-tech uppercase font-bold"
                >
                  Ajouter
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
              {currentTypeTopics.map((topic) => {
                const isSelected = selectedTopicName === topic.name

                return (
                  <button
                    type="button"
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-tech uppercase tracking-wider transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#181818] text-white ring-2 ring-black/20 shadow-sm'
                        : 'bg-black/[0.05] hover:bg-black/[0.09] text-zinc-900 border border-black/10'
                    }`}
                  >
                    <IconRenderer name={topic.icon} size={11} />
                    <span className="font-semibold text-[11px]">{topic.name}</span>
                    {isSelected && <Check size={11} className="text-[#FFA43B] shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Titre personnalisé */}
          <div>
            <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1">
              Intitulé exact
            </label>
            <input
              type="text"
              required
              value={customTitle}
              onChange={(e) => {
                setCustomTitle(e.target.value)
                setSelectedTopicName(e.target.value)
              }}
              placeholder="Ex : Réunion, Dev..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.04] border border-black/15 text-zinc-950 font-semibold text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#181818]"
            />
          </div>

          {/* 4. Créneau Horaire */}
          <div className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/10">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="min-w-0 flex flex-col">
                <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-700 font-bold mb-1.5 truncate">
                  De (Début)
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full min-w-0 max-w-full px-3 py-2.5 rounded-2xl bg-white border border-black/15 text-zinc-950 font-mono-tech font-bold text-sm sm:text-base text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#181818]"
                />
              </div>

              <div className="min-w-0 flex flex-col">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-700 font-bold truncate">
                    À (Fin)
                  </label>
                  <button
                    type="button"
                    onClick={handleSetNow}
                    title="Régler sur l'heure actuelle"
                    className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/10 hover:bg-[#181818] hover:text-white text-zinc-800 text-[8.5px] font-mono-tech font-bold uppercase transition-colors cursor-pointer"
                  >
                    <Clock size={8.5} />
                    <span>Maintenant</span>
                  </button>
                </div>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full min-w-0 max-w-full px-3 py-2.5 rounded-2xl bg-white border border-black/15 text-zinc-950 font-mono-tech font-bold text-sm sm:text-base text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#181818]"
                />
              </div>

            </div>



            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-black/10 text-[10px] font-mono-tech">
              <span className="text-zinc-600 uppercase font-semibold">
                Durée : <strong className="text-[#181818] font-dot text-xs">{durationStr}</strong>
              </span>
            </div>
          </div>

          {/* Bouton d'enregistrement */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-mono-tech text-xs font-bold text-zinc-700 hover:bg-black/10 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#181818] hover:bg-black text-white text-xs font-mono-tech font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={13} className="text-[#FF9028]" />
              <span>ENREGISTRER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
