import { useState, useEffect } from 'react'
import { useTimeTracker } from './hooks/useTimeTracker'
import { usePomodoro, POMODORO_PRESETS } from './hooks/usePomodoro'
import { useBloubState } from './hooks/useBloubState'
import { Header } from './components/Header'
import { Day24Matrix } from './components/Day24Matrix'
import { TimeEntryForm } from './components/TimeEntryForm'
import { DayEntriesList } from './components/DayEntriesList'
import { WeekView } from './components/WeekView'
import { MonthHeatmapView } from './components/MonthHeatmapView'
import { ExportSummaryModal } from './components/ExportSummaryModal'
import { QuickAddModal } from './components/QuickAddModal'
import { StandbyMode } from './components/StandbyMode'
import { BottomNav, type NavTab } from './components/BottomNav'
import { PomodoroTimer } from './components/PomodoroTimer'
import { BackgroundBlobs } from './components/BackgroundBlobs'
import type { ActivityType } from './types'
import confetti from 'canvas-confetti'
import { Clock, Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { getFormattedDateKey } from './constants/initialData'

export function App() {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [prefilledRange, setPrefilledRange] = useState<{ startTime: string; endTime: string } | null>(null)
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null)
  const [navTab, setNavTab] = useState<NavTab>('tracker')
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('day')
  const [isStandbyOpen, setIsStandbyOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Thème Sombre OLED (Glyph Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('timdot_theme') as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('timdot_theme', theme)
    } catch {
      // ignore
    }
    if (theme === 'dark') {
      document.body.classList.add('theme-dark')
    } else {
      document.body.classList.remove('theme-dark')
    }
  }, [theme])

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const {
    topics,
    selectedDate,
    setSelectedDate,
    refreshToToday,
    currentDayEntries,
    day24Hours,
    suggestedStartTime,
    suggestedEndTime,
    addEntry,
    updateEntry,
    deleteEntry,
    addTopic,
    daySummaryStats,
  } = useTimeTracker()

  const handleSelectHour = (hour: number) => {
    setSelectedHour((prev) => (prev === hour ? null : hour))
  }

  const handleSelectHole = (range: { startTime: string; endTime: string }) => {
    setPrefilledRange(range)
  }

  // Hook unifié du Pomodoro partagé entre la vue Pomodoro et le mode Standby
  const pomodoro = usePomodoro((entry) => {
    handleAddEntry(entry)
    setNavTab('tracker')
    setCurrentView('day')
  })

  // Humeur intelligente et dynamique de Bloub réagissant au fil de la journée
  const isPomodoroBreak = POMODORO_PRESETS[pomodoro.mode]?.isBreak ?? false
  const bloub = useBloubState({
    entries: currentDayEntries,
    totalHours: daySummaryStats.totalHours,
    selectedDate,
    isPomodoroActive: pomodoro.isRunning,
    isPomodoroBreak,
  })

  const handleAddEntry = (entryData: {
    title: string
    type: ActivityType
    startTime: string
    endTime: string
  }) => {
    addEntry(entryData)
    setSelectedHour(null)
    setPrefilledRange(null)
    bloub.triggerCelebration(entryData.title)
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#181818', '#FFA43B', '#FFFFFF'],
    })
  }

  const handlePrevDate = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    if (currentView === 'month') {
      d.setMonth(d.getMonth() - 1)
    } else if (currentView === 'week') {
      d.setDate(d.getDate() - 7)
    } else {
      d.setDate(d.getDate() - 1)
    }
    setSelectedDate(getFormattedDateKey(d))
  }

  const handleNextDate = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    if (currentView === 'month') {
      d.setMonth(d.getMonth() + 1)
    } else if (currentView === 'week') {
      d.setDate(d.getDate() + 7)
    } else {
      d.setDate(d.getDate() + 1)
    }
    setSelectedDate(getFormattedDateKey(d))
  }

  const handleTodayDate = () => {
    setSelectedDate(getFormattedDateKey())
  }

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col items-center justify-start py-4 px-3 sm:px-4 pb-24 overflow-x-hidden ${
        theme === 'dark' ? 'bg-dot-pattern-dark text-white' : 'bg-dot-pattern text-zinc-900'
      }`}
      style={{
        background:
          theme === 'dark'
            ? 'linear-gradient(180deg, #141414 0%, #0c0c0c 50%, #060606 100%)'
            : 'linear-gradient(180deg, #FFA43B 0%, #FF9028 45%, #FF8412 100%)',
        backgroundColor: theme === 'dark' ? '#0c0c0c' : '#FF9028',
      }}
    >
      {/* Blobs colorés et animés dans les tonalités du fond */}
      <BackgroundBlobs theme={theme} />

      {/* Conteneur Mobile First épuré */}
      <main className="w-full max-w-md mx-auto flex flex-col space-y-4 relative z-10">
        {/* Header avec Grand numéro Dot-Matrix, Avatar Bloub réactif, boutons Veille, Thème et Refresh */}
        <Header
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          totalHours={daySummaryStats.totalHours}
          onOpenStandby={() => setIsStandbyOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onRefresh={refreshToToday}
          bloubMood={bloub.currentMood}
          onBloubClick={bloub.handleBotClick}
        />


        {/* 1. Onglet SUIVI (Jour / Semaine / Mois) */}
        {navTab === 'tracker' && (
          <>
            {/* Ligne : Onglets JOUR / SEMAINE / MOIS (gauche) + Sélecteur de date (droite) */}
            <div className="flex items-center justify-between gap-2 w-full">
              {/* Onglets alignés à gauche */}
              <div className="inline-flex p-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-sm">
                <button
                  onClick={() => setCurrentView('day')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 ${
                    currentView === 'day'
                      ? 'bg-[#181818] text-white shadow-md'
                      : 'text-zinc-800 hover:text-black'
                  }`}
                >
                  <Clock size={12} />
                  <span>JOUR</span>
                </button>
                <button
                  onClick={() => setCurrentView('week')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 ${
                    currentView === 'week'
                      ? 'bg-[#181818] text-white shadow-md'
                      : 'text-zinc-800 hover:text-black'
                  }`}
                >
                  <CalendarIcon size={12} />
                  <span>SEMAINE</span>
                </button>
                <button
                  onClick={() => setCurrentView('month')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 ${
                    currentView === 'month'
                      ? 'bg-[#181818] text-white shadow-md'
                      : 'text-zinc-800 hover:text-black'
                  }`}
                >
                  <LayoutGrid size={12} />
                  <span>MOIS</span>
                </button>
              </div>

              {/* Sélecteur de date aligné à droite sur la même ligne */}
              <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full p-1 border border-white/30 shadow-sm shrink-0">
                <button
                  onClick={handlePrevDate}
                  title="Période précédente"
                  className="p-1.5 rounded-full hover:bg-white/50 text-[#181818] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={handleTodayDate}
                  title="Aujourd'hui"
                  className="p-1.5 rounded-full hover:bg-white/50 text-[#181818] transition-colors cursor-pointer"
                >
                  <CalendarIcon size={13} />
                </button>
                <button
                  onClick={handleNextDate}
                  title="Période suivante"
                  className="p-1.5 rounded-full hover:bg-white/50 text-[#181818] transition-colors cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Affichage conditionnel selon la sous-vue */}
            {currentView === 'day' && (
              <>
                {/* Matrice 24 heures avec sous-créneaux de 30 minutes */}
                <Day24Matrix
                  slots={day24Hours}
                  entries={currentDayEntries}
                  selectedDate={selectedDate}
                  highlightedEntryId={highlightedEntryId}
                  onSelectHour={handleSelectHour}
                  onSelectHole={handleSelectHole}
                  onSelectSlot={handleSelectHole}
                  onSelectEntry={(entry) => {
                    setHighlightedEntryId(entry.id)
                    setTimeout(() => {
                      setHighlightedEntryId((curr) => (curr === entry.id ? null : curr))
                    }, 3000)
                  }}
                  selectedHour={selectedHour}
                />

                {/* Formulaire de saisie standard avec bouton Maintenant & Détection de trou */}
                <TimeEntryForm
                  topics={topics}
                  suggestedStartTime={suggestedStartTime}
                  suggestedEndTime={suggestedEndTime}
                  onAddEntry={handleAddEntry}
                  onAddTopic={addTopic}
                  initialStartHour={selectedHour}
                  prefilledRange={prefilledRange}
                />

                {/* Déroulé chronologique des activités & Répartition du temps avec Édition */}
                <DayEntriesList
                  entries={currentDayEntries}
                  onDeleteEntry={deleteEntry}
                  onUpdateEntry={updateEntry}
                  onSelectHole={handleSelectHole}
                  highlightedEntryId={highlightedEntryId}
                  onHoverEntry={(id) => setHighlightedEntryId(id)}
                  stats={daySummaryStats}
                />
              </>
            )}

            {currentView === 'week' && (
              /* Vue Semaine : Rétrospective sur 7 jours avec comparatif N vs N-1 */
              <WeekView
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onSwitchToDayView={() => setCurrentView('day')}
              />
            )}

            {currentView === 'month' && (
              /* Vue Mois : Heatmap façon GitHub */
              <MonthHeatmapView
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onSwitchToDayView={() => setCurrentView('day')}
              />
            )}
          </>
        )}

        {/* 2. Onglet POMODORO */}
        {navTab === 'pomodoro' && (
          <PomodoroTimer
            topics={topics}
            pomodoro={pomodoro}
          />
        )}
      </main>

      {/* Barre de navigation flottante en bas */}
      <BottomNav
        activeTab={navTab}
        onTabChange={setNavTab}
        onOpenStandby={() => setIsStandbyOpen(true)}
      />

      {/* Mode Écran de veille / Standby */}
      <StandbyMode
        isOpen={isStandbyOpen}
        onClose={() => setIsStandbyOpen(false)}
        slots={day24Hours}
        stats={daySummaryStats}
        selectedDate={selectedDate}
        pomodoro={pomodoro}
      />

      {/* Modal d'export du bilan (Texte / Markdown) */}
      <ExportSummaryModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        selectedDate={selectedDate}
        entries={currentDayEntries}
        stats={daySummaryStats}
      />

      {/* Notch d'accès rapide incurvé (épouse le bord droit) */}
      <button
        onClick={() => setIsQuickAddOpen(true)}
        title="Ajouter rapidement une activité"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[34px] h-[130px] cursor-pointer select-none drop-shadow-[-6px_6px_16px_rgba(0,0,0,0.35)]"
      >
        <svg
          viewBox="0 0 34 130"
          className="w-full h-full overflow-visible"
        >
          {/* Forme pleine noire épousant le bord droit */}
          <path
            d="M 34 0 C 34 22, 3 24, 3 44 L 3 86 C 3 106, 34 108, 34 130 L 34 0 Z"
            fill="#000000"
          />
        </svg>

        {/* Contenu centré sur la zone saillante */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pl-1.5 text-white pointer-events-none">
          <Plus size={15} className="text-white" />
          <span className="font-mono-tech text-[8px] font-bold uppercase [writing-mode:vertical-rl] tracking-widest text-zinc-300 mt-1">
            AJOUT
          </span>
        </div>
      </button>

      {/* Modal d'ajout rapide (ouvert via le notch) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        topics={topics}
        suggestedStartTime={suggestedStartTime}
        suggestedEndTime={suggestedEndTime}
        onAddEntry={handleAddEntry}
        onAddTopic={addTopic}
      />
    </div>
  )
}

export default App
