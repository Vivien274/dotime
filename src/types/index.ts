export type ActivityType = 'pro' | 'perso' | 'entreprises'

export type PreloadedTopic = {
  id: string
  name: string
  type: ActivityType
  icon: string
}

export type TimeEntry = {
  id: string
  title: string // ex: "Réunion", "Modifications de Tablo", "Petit déjeuner"
  type: ActivityType // 'pro' | 'perso' | 'entreprises'
  startTime: string // "10:00"
  endTime: string // "11:00"
  startHour: number // 10.0
  endHour: number // 11.0
  durationHours: number // 1.0
  date: string // "YYYY-MM-DD"
}

export type DaySummaryStats = {
  totalHours: number
  activeHours: number // Hors sommeil
  sleepHours: number // Sommeil
  totalMinutes: number
  activeMinutes: number
  entriesCount: number
  completedHoursCount: number // 0 à 24
  byType: {
    type: ActivityType
    label: string
    shortLabel: string
    hours: number // Heures actives (hors sommeil)
    percentage: number // % du temps actif
    color: string
  }[]
}

export type HourSlot = {
  hour: number // 0 à 23
  label: string // "08:00"
  isFilled: boolean
  isNight: boolean // Activité de nuit / sommeil
  matchingEntry: TimeEntry | null
  isCurrentHour: boolean
}
