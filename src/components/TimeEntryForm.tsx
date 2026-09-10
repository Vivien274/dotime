import React, { useState, useEffect } from 'react'
import type { ActivityType, PreloadedTopic } from '../types'
import { ACTIVITY_TYPES_META, timeStringToHours } from '../constants/initialData'
import { IconRenderer } from './IconRenderer'
import { Plus, Check, Sparkles, Clock } from 'lucide-react'

interface TimeEntryFormProps {
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
  initialStartHour?: number | null
  prefilledRange?: { startTime: string; endTime: string } | null
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  topics,
  suggestedStartTime,
  suggestedEndTime,
  onAddEntry,
  onAddTopic,
  initialStartHour,
  prefilledRange,
}) => {
  const [activeType, setActiveType] = useState<ActivityType>('pro')
  const [selectedTopicName, setSelectedTopicName] = useState('Réunion')
  const [customTitle, setCustomTitle] = useState('Réunion')
  const [startTime, setStartTime] = useState(suggestedStartTime)
  const [endTime, setEndTime] = useState(suggestedEndTime)
  const [isAddingNewTopic, setIsAddingNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  // Mettre à jour les suggestions quand la liste des entrées évolue ou lors d'une détection de trou
  useEffect(() => {
    if (prefilledRange) {
      setStartTime(prefilledRange.startTime)
      setEndTime(prefilledRange.endTime)
    } else if (initialStartHour !== null && initialStartHour !== undefined) {
      const startStr = `${initialStartHour.toString().padStart(2, '0')}:00`
      const endH = (initialStartHour + 1) % 24
      const endStr = `${endH.toString().padStart(2, '0')}:00`
      setStartTime(startStr)
      setEndTime(endStr)
    } else {
      setStartTime(suggestedStartTime)
      setEndTime(suggestedEndTime)
    }
  }, [suggestedStartTime, suggestedEndTime, initialStartHour, prefilledRange])

  const handleSetNow = () => {
    const now = new Date()
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    setEndTime(`${h}:${m}`)
  }

  // Filtrer les sujets selon le type sélectionné (Pro, Perso, Entreprises)
  const currentTypeTopics = topics.filter((t) => t.type === activeType)

  // Calcul de la durée en direct
  const startNum = timeStringToHours(startTime)
  const endNum = timeStringToHours(endTime)
  const duration = endNum >= startNum ? endNum - startNum : 24 - startNum + endNum
  const durationH = Math.floor(duration)
  const durationM = Math.round((duration - durationH) * 60)
  const durationStr =
    durationH > 0
      ? `${durationH}h${durationM > 0 ? ` ${durationM}m` : ''}`
      : `${durationM}m`

  const handleQuickDuration = (hoursToAdd: number) => {
    const [h, m] = startTime.split(':').map(Number)
    const newEndHour = Math.min(23, h + Math.floor(hoursToAdd))
    const newEndMin = ((m || 0) + (hoursToAdd % 1) * 60) % 60
    setEndTime(
      `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`
    )
  }

  const isNightTopic =
    selectedTopicName.toLowerCase().includes('nuit') ||
    customTitle.toLowerCase().includes('nuit') ||
    selectedTopicName.toLowerCase().includes('sommeil')

  const handleSelectTopic = (topic: PreloadedTopic) => {
    setSelectedTopicName(topic.name)
    setCustomTitle(topic.name)

    // Détection intelligente de la nuit
    if (topic.id === 'perso_nuit' || topic.name.toLowerCase().includes('nuit')) {
      setStartTime('23:00')
      setEndTime('07:00')
    }
  }

  const handleSetExactSleepDuration = (hours: number) => {
    setStartTime('23:00')
    const totalEndMin = 23 * 60 + Math.round(hours * 60)
    const endMinInDay = totalEndMin % (24 * 60)
    const h = Math.floor(endMinInDay / 60)
    const m = endMinInDay % 60
    setEndTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
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

    let finalEndTime = endTime
    if (startTime === endTime) {
      const [h, m] = startTime.split(':').map(Number)
      const nextMin = (m + 30) % 60
      const nextHour = (h + Math.floor((m + 30) / 60)) % 24
      finalEndTime = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`
      setEndTime(finalEndTime)
    }

    onAddEntry({
      title: finalTitle,
      type: activeType,
      startTime,
      endTime: finalEndTime,
    })

    // Après l'enregistrement, la prochaine heure de début devient la fin précédente
    setStartTime(finalEndTime)
    const [endH] = finalEndTime.split(':').map(Number)
    const nextH = (endH + 1) % 24
    setEndTime(`${nextH.toString().padStart(2, '0')}:00`)
  }


  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5">
      {/* En-tête formulaire avec récapitulatif du flow */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} className="text-[#181818]" />
        <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900/80">
          AJOUTER UNE ACTIVITÉ
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Sélecteur compact des 3 Types : PRO / PERSO / ENTREPRENARIAT */}
        <div>
          <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold mb-1.5">
            Type d'activité
          </label>
          <div className="inline-flex bg-black/10 p-1 rounded-full border border-black/5 gap-1">
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
                  className={`py-1 px-3 rounded-full text-[10px] font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#181818] text-white shadow-md'
                      : 'bg-white/40 hover:bg-white/60 text-zinc-800'
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

        {/* 2. Sujets préchargés du type sélectionné (flex-wrap pour ne rien tronquer) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-800 font-bold">
              Sujets préchargés ({ACTIVITY_TYPES_META[activeType].label}) :
            </label>
            <button
              type="button"
              onClick={() => setIsAddingNewTopic(!isAddingNewTopic)}
              className="text-[10px] font-mono-tech uppercase text-[#181818] hover:underline font-bold flex items-center gap-0.5"
            >
              <Plus size={10} />
              <span>Nouveau sujet</span>
            </button>
          </div>

          {/* Formulaire inline pour ajouter un nouveau sujet à la liste */}
          {isAddingNewTopic && (
            <div className="flex gap-2 p-2 mb-2 rounded-2xl bg-white/50 border border-black/10">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder={`Nouveau sujet pour ${ACTIVITY_TYPES_META[activeType].label}...`}
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

          {/* Pilules des sujets préchargés enveloppées (flex-wrap sans coupure) */}
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {currentTypeTopics.map((topic) => {
              const isSelected = selectedTopicName === topic.name

              return (
                <button
                  type="button"
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-tech uppercase tracking-wider transition-all shadow-sm ${
                    isSelected
                      ? 'bg-[#181818] text-white ring-2 ring-white/60 shadow-md scale-100'
                      : 'bg-white/40 hover:bg-white/60 text-zinc-900 border border-black/10'
                  }`}
                >
                  <IconRenderer name={topic.icon} size={11} />
                  <span className="font-semibold text-[11px] whitespace-normal">{topic.name}</span>
                  {isSelected && <Check size={11} className="text-[#FFA43B] shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>


        {/* 3. Champ Titre modifiable */}
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
            placeholder="Ex : Réunion d'équipe, Dev & Tests..."
            className="w-full px-4 py-2.5 rounded-2xl bg-white/50 border border-black/10 text-zinc-900 placeholder-zinc-500/70 focus:outline-none focus:ring-2 focus:ring-[#181818] text-sm font-sans font-medium"
          />
        </div>

        {/* 4. Plage Horaire (De quand à quand) pré-remplie automatiquement */}
        <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* De */}
            <div className="min-w-0 flex flex-col">
              <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-700 font-bold mb-1 truncate">
                {isNightTopic ? 'Couché (Hier)' : 'De (Début auto)'}
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-28 max-w-full min-w-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/15 border border-black/20 text-zinc-950 dark:text-white font-mono-tech font-bold text-sm text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#181818]"
              />
            </div>

            {/* À */}
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="block text-[10px] font-mono-tech uppercase tracking-wider text-zinc-700 font-bold truncate">
                  {isNightTopic ? 'Réveil (Matin)' : 'À (Fin)'}
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
                className="w-28 max-w-full min-w-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/15 border border-black/20 text-zinc-950 dark:text-white font-mono-tech font-bold text-sm text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[#181818]"
              />
            </div>
          </div>



          {/* Raccourcis de durée adaptés (Sommeil vs Standard) */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-black/10 text-[10px] font-mono-tech">
            <span className="text-zinc-600 uppercase font-semibold">
              Durée :{' '}
              <strong className="text-[#181818] font-dot text-xs">
                {durationStr}
              </strong>
              {isNightTopic && startNum > endNum && (
                <span className="text-zinc-500 text-[9px] font-mono-tech ml-1">
                  ({Math.round((24 - startNum) * 10) / 10}h hier + {Math.round(endNum * 10) / 10}h ce matin)
                </span>
              )}
            </span>

            {isNightTopic ? (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[6, 7, 7.5, 8, 8.5, 9].map((hours) => (
                  <button
                    type="button"
                    key={hours}
                    onClick={() => handleSetExactSleepDuration(hours)}
                    className="px-2 py-0.5 rounded-lg bg-white/70 hover:bg-white border border-black/10 text-[10px] font-mono-tech text-zinc-900 font-bold transition-colors"
                  >
                    {hours === 7.5 ? '7h30' : hours === 8.5 ? '8h30' : `${hours}h`}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[0.5, 1, 1.5, 2].map((dur) => (
                  <button
                    type="button"
                    key={dur}
                    onClick={() => handleQuickDuration(dur)}
                    className="px-2 py-0.5 rounded-lg bg-white/60 hover:bg-white/90 border border-black/10 text-[10px] font-mono-tech text-zinc-800 transition-colors"
                  >
                    +{dur >= 1 ? `${dur}h` : '30m'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* 5. Bouton de validation Timdot */}
        <button
          type="submit"
          disabled={!customTitle.trim()}
          className="w-full py-3.5 px-6 rounded-full bg-[#181818] hover:bg-black text-white font-mono-tech text-xs tracking-wider uppercase font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus size={15} className="text-[#FFA43B]" />
          <span>ENREGISTRER L'ACTIVITÉ</span>
        </button>
      </form>
    </div>
  )
}
