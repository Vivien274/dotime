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

/**
 * Gazouillis mignon Pocket Operator / R2-D2 quand Bloub s'exprime
 */
export function playBloubChirp(): void {
  triggerHaptic(10)
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [587.33, 783.99, 987.77] // Ré5, Sol5, Si5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const startT = now + idx * 0.045
      osc.frequency.setValueAtTime(freq, startT)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startT + 0.06)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.setValueAtTime(0.06, startT)
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startT)
      osc.stop(startT + 0.09)
    })
  } catch {
    // Audio indisponible
  }
}

/**
 * Son d'étourdissement / ressort "boing" rétro quand on le spamme de taps
 */
export function playBloubDizzy(): void {
  triggerHaptic(25)
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'

    osc.frequency.setValueAtTime(440, now)
    // Wobble vibrato rapide
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.05
      osc.frequency.setValueAtTime(i % 2 === 0 ? 460 : 380, t)
    }
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.35)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.36)
  } catch {
    // Audio indisponible
  }
}

/**
 * Bruit de rotation mécanique rapide (swipe 360°)
 */
export function playBloubSpin(): void {
  triggerHaptic(15)
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.28)

    gain.gain.setValueAtTime(0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch {
    // Audio indisponible
  }
}

/**
 * Petit ronflement doux synthétique en mode nuit
 */
export function playBloubSnore(): void {
  if (!isSoundEnabled()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, now)
    osc.frequency.linearRampToValueAtTime(125, now + 0.25)
    osc.frequency.linearRampToValueAtTime(80, now + 0.5)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.03, now + 0.25)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.55)
  } catch {
    // Audio indisponible
  }
}
