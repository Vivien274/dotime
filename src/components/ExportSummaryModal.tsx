import React, { useState } from 'react'
import type { TimeEntry, DaySummaryStats } from '../types'
import { ACTIVITY_TYPES_META } from '../constants/initialData'
import { X, Copy, Check, FileText, Download } from 'lucide-react'

interface ExportSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  entries: TimeEntry[]
  stats: DaySummaryStats
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  entries,
  stats,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const dateObj = new Date(selectedDate + 'T12:00:00')
  const dateStr = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  // Génération du texte Markdown
  const lines: string[] = []
  lines.push(`📋 TIMDOT — Bilan du ${capitalizedDate}`)
  lines.push(`Total actif : ${stats.activeHours}h (${stats.totalHours}h au total sur 24h)`)
  lines.push('')
  lines.push('--- ACTIVITÉS ---')

  if (entries.length === 0) {
    lines.push('Aucune activité enregistrée.')
  } else {
    entries.forEach((e) => {
      const typeLabel = ACTIVITY_TYPES_META[e.type]?.label || e.type.toUpperCase()
      const totalMins = Math.round(e.durationHours * 60)
      const h = Math.floor(totalMins / 60)
      const m = totalMins % 60
      const durStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
      lines.push(`• ${e.startTime} - ${e.endTime} : ${e.title} [${typeLabel}] (${durStr})`)
    })
  }

  lines.push('')
  lines.push('--- RÉPARTITION DU TEMPS ---')
  stats.byType.forEach((t) => {
    lines.push(`• ${t.label} : ${t.hours}h (${t.percentage}%)`)
  })
  if (stats.sleepHours > 0) {
    lines.push(`• Sommeil : ${stats.sleepHours}h`)
  }

  const generatedText = lines.join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = generatedText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timdot-bilan-${selectedDate}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl bg-white/50 backdrop-blur-2xl border border-white/60 shadow-2xl p-6 text-[#181818]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête modal */}
        <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#181818]" />
            <h3 className="font-mono-tech text-xs tracking-wider uppercase font-bold text-zinc-900">
              EXPORTER LE BILAN (TEXTE / FACTURATION)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-zinc-600 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aperçu du texte généré */}
        <div className="mb-4">
          <textarea
            readOnly
            value={generatedText}
            rows={10}
            className="w-full p-3 rounded-2xl bg-black/5 border border-black/10 font-mono-tech text-xs text-zinc-800 focus:outline-none resize-none leading-relaxed select-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-zinc-800 border border-black/10 text-xs font-mono-tech font-bold transition-all shadow-sm active:scale-95"
          >
            <Download size={14} />
            <span>Télécharger .txt</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono-tech text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#181818] text-white hover:bg-black'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>COPIÉ DANS LE PRESSE-PAPIER !</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>COPIER LE BILAN</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
