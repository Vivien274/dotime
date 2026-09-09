/**
 * Synthétiseur audio Web Audio API rétro-tech & gestion haptique
 * Inspiré de Teenage Engineering / Nothing OS
 * Zéro fichier MP3 externe nécessaire.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

const SOUND_STORAGE_KEY = 'timdot_sound_enabled'

export function isSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY)
    return val === null ? true : val === 'true'
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    // ignore
  }
}

/**
 * Vibration haptique subtile pour smartphone (10-15ms)
 */
export function triggerHaptic(duration = 12): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration)
    } catch {
      // ignore
    }
  }
}

/**
 * Clic mécanique feutré rétro-tech (type molette / bouton Teenage Engineering)
 */
export function playMechanicalClick(): void {
  triggerHaptic(8)
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Oscillateur principal pour le claquement sec
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.016)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2200, now)
    filter.Q.setValueAtTime(2.5, now)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.02)
  } catch {
    // Audio indisponible ou bloqué
  }
}

/**
 * Clic plus doux type bascule ou sélection de slot
 */
export function playSoftTick(): void {
  triggerHaptic(6)
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.012)

    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.016)
  } catch {
    // Audio indisponible
  }
}

/**
 * Carillon mélodique harmonieux à deux notes lors d'une validation ou d'un ajout
 */
export function playSuccessChime(): void {
  triggerHaptic(20)
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Note 1 (Mi5 - 659Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0.06, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.18)

    // Note 2 (La5 - 880Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, now + 0.07)
    gain2.gain.setValueAtTime(0.001, now)
    gain2.gain.setValueAtTime(0.08, now + 0.07)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.07)
    osc2.stop(now + 0.32)
  } catch {
    // Audio indisponible
  }
}
