import { useState } from 'react'
import { useTimeTracker } from './hooks/useTimeTracker'
import { Header } from './components/Header'
import { Day24Matrix } from './components/Day24Matrix'
import { TimeEntryForm } from './components/TimeEntryForm'
import { DayEntriesList } from './components/DayEntriesList'
import type { ActivityType } from './types'
import confetti from 'canvas-confetti'

export function App() {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  const {
    topics,
    selectedDate,
    setSelectedDate,
    currentDayEntries,
    day24Hours,
    suggestedStartTime,
    suggestedEndTime,
    addEntry,
    deleteEntry,
    resetDay,
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

  return (
    <div
      className="min-h-screen w-full text-zinc-900 bg-dot-pattern relative flex flex-col items-center justify-start py-4 px-3 sm:px-4"
      style={{
        background: 'linear-gradient(180deg, #FFA43B 0%, #FF9028 45%, #FF8412 100%)',
        backgroundColor: '#FF9028',
      }}
    >
      {/* Conteneur Mobile First épuré Nothing OS */}
      <main className="w-full max-w-md mx-auto flex flex-col space-y-4 pb-12">
        {/* Header avec Grand numéro Dot-Matrix et total d'heures */}
        <Header
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          totalHours={daySummaryStats.totalHours}
          onResetDay={() => {
            if (confirm('Effacer toutes les activités de cette journée ?')) {
              resetDay(selectedDate)
            }
          }}
        />

        {/* 1. Grille de 24 points purs représentant les 24 heures de la journée */}
        <Day24Matrix
          slots={day24Hours}
          onSelectHour={handleSelectHour}
          selectedHour={selectedHour}
        />

        {/* 2. Composant de saisie : PRO / PERSO / ENTREPRISES avec sujets préchargés & heure fin arrondie */}
        <TimeEntryForm
          topics={topics}
          suggestedStartTime={suggestedStartTime}
          suggestedEndTime={suggestedEndTime}
          onAddEntry={handleAddEntry}
          onAddTopic={addTopic}
          initialStartHour={selectedHour}
        />


        {/* 3. Déroulé chronologique des activités & Répartition du temps */}
        <DayEntriesList
          entries={currentDayEntries}
          onDeleteEntry={deleteEntry}
          stats={daySummaryStats}
        />
      </main>
    </div>
  )
}

export default App
