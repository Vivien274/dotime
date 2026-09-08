import { useState } from 'react'
import { useTimeTracker } from './hooks/useTimeTracker'
import { usePomodoro } from './hooks/usePomodoro'
import { Header } from './components/Header'
import { Day24Matrix } from './components/Day24Matrix'
import { TimeEntryForm } from './components/TimeEntryForm'
import { DayEntriesList } from './components/DayEntriesList'
import { WeekView } from './components/WeekView'
import { StandbyMode } from './components/StandbyMode'
import { BottomNav, type NavTab } from './components/BottomNav'
import { PomodoroTimer } from './components/PomodoroTimer'
import type { ActivityType } from './types'
import confetti from 'canvas-confetti'
import { Clock, Calendar } from 'lucide-react'

export function App() {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [navTab, setNavTab] = useState<NavTab>('tracker')
  const [currentView, setCurrentView] = useState<'day' | 'week'>('day')
  const [isStandbyOpen, setIsStandbyOpen] = useState(false)

  const {
    topics,
    selectedDate,
    setSelectedDate,
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

  const handleAddEntry = (entryData: {
    title: string
    type: ActivityType
    startTime: string
    endTime: string
  }) => {
    addEntry(entryData)
    setSelectedHour(null)
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#181818', '#FFA43B', '#FFFFFF'],
    })
  }

  // Hook unifié du Pomodoro partagé entre la vue Pomodoro et le mode Standby
  const pomodoro = usePomodoro((entry) => {
    handleAddEntry(entry)
    setNavTab('tracker')
    setCurrentView('day')
  })

  return (
    <div
      className="min-h-screen w-full text-zinc-900 bg-dot-pattern relative flex flex-col items-center justify-start py-4 px-3 sm:px-4 pb-24"
      style={{
        background: 'linear-gradient(180deg, #FFA43B 0%, #FF9028 45%, #FF8412 100%)',
        backgroundColor: '#FF9028',
      }}
    >
      {/* Conteneur Mobile First épuré Nothing OS */}
      <main className="w-full max-w-md mx-auto flex flex-col space-y-4">
        {/* Header avec Grand numéro Dot-Matrix et bouton Standby */}
        <Header
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          totalHours={daySummaryStats.totalHours}
          onOpenStandby={() => setIsStandbyOpen(true)}
        />

        {/* 1. Onglet TRACKER (Jour & Semaine) */}
        {navTab === 'tracker' && (
          <>
            {/* Commutateur de vue Nothing OS : JOUR / SEMAINE */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-sm">
                <button
                  onClick={() => setCurrentView('day')}
                  className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 ${
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
                  className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider transition-all duration-200 ${
                    currentView === 'week'
                      ? 'bg-[#181818] text-white shadow-md'
                      : 'text-zinc-800 hover:text-black'
                  }`}
                >
                  <Calendar size={12} />
                  <span>SEMAINE</span>
                </button>
              </div>
            </div>

            {/* Affichage conditionnel selon la sous-vue */}
            {currentView === 'day' ? (
              <>
                {/* Grille de 24 points purs représentant les 24 heures de la journée */}
                <Day24Matrix
                  slots={day24Hours}
                  onSelectHour={handleSelectHour}
                  selectedHour={selectedHour}
                />

                {/* Formulaire de saisie standard */}
                <TimeEntryForm
                  topics={topics}
                  suggestedStartTime={suggestedStartTime}
                  suggestedEndTime={suggestedEndTime}
                  onAddEntry={handleAddEntry}
                  onAddTopic={addTopic}
                  initialStartHour={selectedHour}
                />

                {/* Déroulé chronologique des activités & Répartition du temps avec Édition */}
                <DayEntriesList
                  entries={currentDayEntries}
                  onDeleteEntry={deleteEntry}
                  onUpdateEntry={updateEntry}
                  stats={daySummaryStats}
                />
              </>
            ) : (
              /* Vue Semaine : Rétrospective sur 7 jours avec mini-matrices */
              <WeekView
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

      {/* Barre de navigation flottante Nothing OS en bas */}
      <BottomNav
        activeTab={navTab}
        onTabChange={setNavTab}
        onOpenStandby={() => setIsStandbyOpen(true)}
      />

      {/* Mode Écran de veille / Standby Nothing OS */}
      <StandbyMode
        isOpen={isStandbyOpen}
        onClose={() => setIsStandbyOpen(false)}
        slots={day24Hours}
        stats={daySummaryStats}
        selectedDate={selectedDate}
        pomodoro={pomodoro}
      />
    </div>
  )
}

export default App
