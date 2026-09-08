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
  totalMinutes: number
  entriesCount: number
  completedHoursCount: number // 0 à 24
  byType: {
    type: ActivityType
    label: string
    shortLabel: string
    hours: number
    percentage: number
    color: string
  }[]
}
