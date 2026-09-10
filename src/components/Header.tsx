import { useState } from 'react'
import { Monitor, Sun, Moon, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { getFormattedDateKey } from '../constants/initialData'
import { isSoundEnabled, setSoundEnabled, playMechanicalClick } from '../utils/soundEffects'
import { BloubAvatar } from './BloubAvatar'
import type { BloubMood } from '../hooks/useBloubState'

const SoundToggleButton: React.FC = () => {
  const [enabled, setEnabled] = useState(() => isSoundEnabled())

  const handleToggle = () => {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
    if (next) {
      playMechanicalClick()
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? 'Couper les sons mécaniques' : 'Activer les sons mécaniques'}
      className="p-1.5 rounded-full bg-white/25 hover:bg-[#181818] hover:text-white border border-black/10 text-zinc-800 transition-all cursor-pointer"
    >
      {enabled ? <Volume2 size={11} /> : <VolumeX size={11} className="text-zinc-500" />}
    </button>
  )
}

interface HeaderProps {
  selectedDate: string
  onDateChange?: (dateStr: string) => void
  totalHours: number
  onResetDay?: () => void
  onOpenStandby?: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  onOpenExport?: () => void
  bloubMood?: BloubMood
  onBloubClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  totalHours,
  onOpenStandby,
  theme = 'light',
  onToggleTheme,
  bloubMood,
  onBloubClick,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Parser la date sélectionnée
  const dateObj = new Date(selectedDate + 'T12:00:00')
  const todayKey = getFormattedDateKey()
  const isToday = selectedDate === todayKey

  const dayNumber = dateObj.getDate().toString().padStart(2, '0')
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase()
  const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
  const year = dateObj.getFullYear()

  const handleRefresh = () => {
    playMechanicalClick()
    setIsRefreshing(true)
    // Véritable rafraîchissement complet du navigateur ("F5")
    window.location.reload()
  }

  const handleToday = () => {
    if (onDateChange) {
      onDateChange(todayKey)
    }
  }

  return (
    <header className="w-full pt-4 pb-2 px-1">
      {/* Top bar avec identité Timdot et actions */}
      <div className="flex items-center justify-between mb-3 text-xs tracking-widest uppercase font-mono-tech font-bold text-zinc-900/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#181818] animate-pulse-dot" />
          <span className="font-dot text-[11px] tracking-wider text-[#181818]">TIMDOT (24H)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Bouton Actualiser / F5 */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Recharger la page (F5)"
            className="p-1.5 rounded-full bg-white/25 hover:bg-[#181818] hover:text-white border border-black/10 text-zinc-800 transition-all cursor-pointer"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Passer au thème clair orange' : 'Passer au thème sombre OLED'}
              className="p-1.5 rounded-full bg-white/25 hover:bg-[#181818] hover:text-white border border-black/10 text-zinc-800 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={11} className="text-[#FF9028]" /> : <Moon size={11} />}
            </button>
          )}

          {/* Bouton activation / coupure son rétro */}
          <SoundToggleButton />

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
        </div>
      </div>


      {/* Date Header avec Grand numéro Dot-Matrix à gauche et Bloub agrandi à droite */}
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
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

        {/* Droite : Bloub géant réactif Nothing OS (3x agrandi, tactile/autonome) */}
        <div className="shrink-0 flex items-center justify-center">
          <BloubAvatar
            state={bloubMood?.state ?? 'idle'}
            theme={theme}
            size={168}
            statusLabel={bloubMood?.label}
            statusEmoji={bloubMood?.emoji}
            statusDetail={bloubMood?.detail}
            onClick={onBloubClick}
            followCursor={false}
          />
        </div>
      </div>
    </header>
  )
}
