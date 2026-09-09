import type { ActivityType, PreloadedTopic, TimeEntry } from '../types'

export const ACTIVITY_TYPES_META: Record<
  ActivityType,
  { label: string; shortLabel: string; color: string; bgClass: string; textClass: string; icon: string }
> = {
  pro: {
    label: 'PRO',
    shortLabel: 'PRO',
    color: '#181818',
    bgClass: 'bg-[#181818]',
    textClass: 'text-white',
    icon: 'Briefcase',
  },
  perso: {
    label: 'PERSO',
    shortLabel: 'PERSO',
    color: '#F59E0B',
    bgClass: 'bg-[#F59E0B]',
    textClass: 'text-black',
    icon: 'Coffee',
  },
  entreprises: {
    label: 'ENTREPRENARIAT',
    shortLabel: 'ENTP',
    color: '#3B82F6',
    bgClass: 'bg-[#3B82F6]',
    textClass: 'text-white',
    icon: 'Code2',
  },
}

/**
 * Détecte si un titre d'activité correspond à la nuit / sommeil
 */
export const isNightActivity = (title?: string): boolean => {
  if (!title) return false
  const t = title.toLowerCase()
  return t.includes('nuit') || t.includes('sommeil') || t.includes('sleep')
}


export const PRELOADED_TOPICS: PreloadedTopic[] = [
  // --- PRO ---
  { id: 'pro_reunion', name: 'Réunion', type: 'pro', icon: 'Video' },
  { id: 'pro_maquette', name: 'Maquette', type: 'pro', icon: 'Palette' },
  { id: 'pro_dev', name: 'Dev / Code', type: 'pro', icon: 'Code2' },
  { id: 'pro_emails', name: 'Emails & Admin', type: 'pro', icon: 'Users' },
  { id: 'pro_call', name: 'Appel client', type: 'pro', icon: 'Phone' },
  { id: 'pro_veille', name: 'Veille', type: 'pro', icon: 'Sparkles' },

  // --- PERSO ---
  { id: 'perso_nuit', name: 'Nuit / Sommeil', type: 'perso', icon: 'Moon' },
  { id: 'perso_dej', name: 'Petit déjeuner', type: 'perso', icon: 'Coffee' },
  { id: 'perso_dejeuner', name: 'Déjeuner', type: 'perso', icon: 'Utensils' },
  { id: 'perso_pause', name: 'Pause café', type: 'perso', icon: 'Coffee' },
  { id: 'perso_sport', name: 'Sport', type: 'perso', icon: 'Dumbbell' },
  { id: 'perso_lecture', name: 'Lecture', type: 'perso', icon: 'BookOpen' },
  { id: 'perso_diner', name: 'Dîner & Soirée', type: 'perso', icon: 'Heart' },


  // --- ENTREPRISES ---
  { id: 'ent_projet', name: 'Gestion de projet', type: 'entreprises', icon: 'Layout' },
  { id: 'ent_facturation', name: 'Facturation & Devis', type: 'entreprises', icon: 'Briefcase' },
  { id: 'ent_prospection', name: 'Prospection', type: 'entreprises', icon: 'Zap' },
  { id: 'ent_banque', name: 'Comptabilité', type: 'entreprises', icon: 'Briefcase' },
]

export const timeStringToHours = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

export const hoursToTimeString = (hoursFloat: number): string => {
  const h = Math.floor(hoursFloat)
  const m = Math.round((hoursFloat - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Calcule avec précision la durée en heures d'une plage horaire (en gérant les nuits traversant minuit)
 */
export const calculateDurationHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMin = (startH || 0) * 60 + (startM || 0)
  let endMin = (endH || 0) * 60 + (endM || 0)

  // Si l'heure de fin est 00:00 et le début n'est pas 00:00, cela représente minuit (24h)
  if (endTime === '00:00' && startTime !== '00:00') {
    endMin = 24 * 60
  }

  if (endMin < startMin) {
    // Traverse minuit (ex: 23:00 -> 07:00 = 8h)
    const diff = 24 * 60 - startMin + endMin
    return Number((diff / 60).toFixed(2))
  } else if (endMin === startMin) {
    return 0.25
  } else {
    return Number(((endMin - startMin) / 60).toFixed(2))
  }
}

/**
 * Calcule le nombre de minutes de chevauchement entre une activité et une plage horaire donnée (ex: 9h - 18h)
 */
export const calculateEntryOverlapMinutes = (
  startTime: string,
  endTime: string,
  windowStartHour: number,
  windowEndHour: number
): number => {
  if (!startTime || !endTime) return 0
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMin = (startH || 0) * 60 + (startM || 0)
  let endMin = (endH || 0) * 60 + (endM || 0)

  if (endTime === '00:00' && startTime !== '00:00') {
    endMin = 24 * 60
  }

  const winStart = windowStartHour * 60
  const winEnd = windowEndHour * 60

  if (endMin < startMin) {
    // Traversée de minuit (ex: 23:00 -> 07:00)
    // Portion 1 : fin de journée d'hier (startMin -> 24h)
    const p1 = Math.max(0, Math.min(24 * 60, winEnd) - Math.max(startMin, winStart))
    // Portion 2 : matinée d'aujourd'hui (00h -> endMin)
    const p2 = Math.max(0, Math.min(endMin, winEnd) - Math.max(0, winStart))
    return p1 + p2
  } else {
    return Math.max(0, Math.min(endMin, winEnd) - Math.max(startMin, winStart))
  }
}

/**
 * Détermine avec précision si l'heure h (0 à 23) est couverte par une activité
 * (Gère les chevauchements partiels, les fins de journée à 00:00 et les nuits traversant minuit)
 */
export const isHourCoveredByEntry = (
  hour: number,
  startTime: string,
  endTime: string,
  entryIsFromNextDay: boolean = false
): boolean => {
  if (!startTime || !endTime) return false
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMin = (startH || 0) * 60 + (startM || 0)
  let endMin = (endH || 0) * 60 + (endM || 0)

  if (endTime === '00:00' && startTime !== '00:00') {
    endMin = 24 * 60
  }

  const slotStart = hour * 60
  const slotEnd = (hour + 1) * 60

  if (endMin < startMin) {
    // Traversée de minuit (ex: couché 23h hier -> réveil 7h ce matin)
    if (entryIsFromNextDay) {
      // L'entrée a été enregistrée sur le jour suivant : la portion couché (ex: 23h-00h) appartient à CE soir
      return slotEnd > startMin
    } else {
      // L'entrée est enregistrée sur ce jour : la portion de sommeil (00h-07h) appartient à CE matin
      // L'heure 23h a eu lieu HIER soir, elle ne doit pas être allumée pour ce soir !
      return slotStart < endMin
    }
  } else if (endMin === startMin) {
    return !entryIsFromNextDay && hour === startH
  } else {
    // Plage normale en journée
    return !entryIsFromNextDay && startMin < slotEnd && endMin > slotStart
  }
}

/**
 * Arrondit l'heure actuelle de fin :
 * ex: 10h56 -> 11h00
 * ex: 10h12 -> 10h15 ou 10h00
 */
export const getSmartRoundedEndTime = (date: Date = new Date()): string => {
  const h = date.getHours()
  const m = date.getMinutes()

  if (m >= 45) {
    const nextH = (h + 1) % 24
    return `${nextH.toString().padStart(2, '0')}:00`
  } else if (m >= 20) {
    return `${h.toString().padStart(2, '0')}:30`
  } else {
    return `${h.toString().padStart(2, '0')}:00`
  }
}

export const getFormattedDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getOffsetDateKey = (dateKey: string, offsetDays: number): string => {
  const d = new Date(dateKey + 'T12:00:00')
  d.setDate(d.getDate() + offsetDays)
  return getFormattedDateKey(d)
}

/**
 * Retourne les 7 dates de la semaine (du lundi au dimanche) contenant la date donnée
 */
export const getWeekDaysForDate = (dateKey: string): string[] => {
  const d = new Date(dateKey + 'T12:00:00')
  const dayOfWeek = d.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)

  const week: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    week.push(getFormattedDateKey(day))
  }
  return week
}

export const generateInitialEntries = (): Record<string, TimeEntry[]> => {
  const today = getFormattedDateKey()
  const entries: Record<string, TimeEntry[]> = {}

  entries[today] = [
    {
      id: 'entry_1',
      title: 'Petit déjeuner',
      type: 'perso',
      startTime: '08:00',
      endTime: '09:00',
      startHour: 8,
      endHour: 9,
      durationHours: 1,
      date: today,
    },
    {
      id: 'entry_2',
      title: 'Modifications de Tablo',
      type: 'entreprises',
      startTime: '09:00',
      endTime: '10:00',
      startHour: 9,
      endHour: 10,
      durationHours: 1,
      date: today,
    },
  ]

  return entries
}
