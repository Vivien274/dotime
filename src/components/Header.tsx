import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Monitor, Sun, Moon, Share2 } from 'lucide-react'
import { getFormattedDateKey } from '../constants/initialData'

interface HeaderProps {
  selectedDate: string
  onDateChange: (dateStr: string) => void
  totalHours: number
  onResetDay?: () => void
  onOpenStandby?: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  onOpenExport?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  totalHours,
  onOpenStandby,
  theme = 'light',
  onToggleTheme,
  onOpenExport,
}) => {
  // Parser la date sélectionnée
  const dateObj = new Date(selectedDate + 'T12:00:00')
  const todayKey = getFormattedDateKey()
  const isToday = selectedDate === todayKey

  const dayNumber = dateObj.getDate().toString().padStart(2, '0')
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase()
  const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
  const year = dateObj.getFullYear()

  const handlePrevDay = () => {
    const prev = new Date(dateObj)
    prev.setDate(prev.getDate() - 1)
    onDateChange(getFormattedDateKey(prev))
  }

  const handleNextDay = () => {
    const next = new Date(dateObj)
    next.setDate(next.getDate() + 1)
    onDateChange(getFormattedDateKey(next))
  }

  const handleToday = () => {
    onDateChange(todayKey)
  }

  return (
    <header className="w-full pt-4 pb-2 px-1">
      {/* Top bar avec identité Timdot et status */}
      <div className="flex items-center justify-between mb-3 text-xs tracking-widest uppercase font-mono-tech font-bold text-zinc-900/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#181818] animate-pulse-dot" />
          <span className="font-dot text-[11px] tracking-wider text-[#181818]">TIMDOT (24H)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              title="Exporter le bilan du jour"
              className="p-1.5 rounded-full bg-white/25 hover:bg-[#181818] hover:text-white border border-black/10 text-zinc-800 transition-all cursor-pointer"
            >
              <Share2 size={11} />
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Passer au thème clair orange' : 'Passer au thème sombre OLED'}
              className="p-1.5 rounded-full bg-white/25 hover:bg-[#181818] hover:text-white border border-black/10 text-zinc-800 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={11} className="text-[#FF9028]" /> : <Moon size={11} />}
            </button>
          )}

          {onOpenStandby && (
            <button
              onClick={onOpenStandby}
              title="Passer en mode veille plein écran"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/25 hover:bg-[#181818] hover:text-white border border-black/10 text-[10px] transition-all cursor-pointer"
            >
              <Monitor size={10} />
              <span>VEILLE</span>
            </button>
          )}
          {!isToday && (
            <button
              onClick={handleToday}
              className="px-2.5 py-0.5 rounded-full bg-[#181818] text-white text-[10px] tracking-wider hover:bg-black transition-colors"
            >
              AUJOURD'HUI
            </button>
          )}
          <span className="px-2 py-0.5 rounded-full bg-white/25 border border-black/10 text-[10px]">
            {isToday ? 'EN DIRECT' : 'ARCHIVÉ'}
          </span>
        </div>
      </div>

      {/* Date Header avec Grand numéro Dot-Matrix agrandi et aligné en bas avec l'horaire */}
      <div className="flex items-end justify-between border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tech font-bold tracking-widest text-zinc-900/70 uppercase">
            <span>{dayName}</span>
            <span>·</span>
            <span>{monthName} {year}</span>
          </div>
          <div className="flex items-end gap-2.5 mt-1">
            <h1 className="font-dot text-7xl sm:text-8xl font-bold tracking-tight text-[#181818] select-none leading-none">
              {dayNumber}
            </h1>
            <div className="font-mono-tech text-xs tracking-widest uppercase text-zinc-900/70 pb-0.5 flex flex-col justify-end">
              <span className="text-[10px] text-zinc-900/70 font-bold leading-tight">CYCLE DU JOUR</span>
              <div className="font-dot text-sm text-[#181818] font-bold leading-none mt-1">
                {totalHours}H / 24H
              </div>
            </div>
          </div>
        </div>

        {/* Boutons de navigation temporelle */}
        <div className="flex items-center">
          <div className="flex items-center bg-white/25 backdrop-blur-md rounded-full p-1 border border-black/10 shadow-sm">
            <button
              onClick={handlePrevDay}
              title="Jour précédent"
              className="p-1.5 rounded-full hover:bg-white/50 text-[#181818] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              title="Aujourd'hui"
              className="p-1.5 rounded-full hover:bg-white/50 text-[#181818] transition-colors"
            >
              <CalendarIcon size={14} />
            </button>
            <button
              onClick={handleNextDay}
              title="Jour suivant"
              className="p-1.5 rounded-full hover:bg-white/50 text-[#181818] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
