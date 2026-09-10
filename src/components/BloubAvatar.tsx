import React, { useRef, useEffect, useState, useId } from 'react'
import { BotEngine, type BotFrame } from '../bot/engine'
import { RAYON, DEMI_VIEWBOX } from '../bot/repere'
import { NOTIF_BLUE } from '../bot/decor'
import { mixHex } from '../bot/skins'
import { STATE_BY_ID, type StateId } from '../bot/states'
import { lookTarget, TURN_TIME } from '../bot/gaze'
import { clamp, easings } from '../bot/math'

interface BloubAvatarProps {
  state?: StateId
  size?: number
  theme?: 'light' | 'dark'
  statusLabel?: string
  statusEmoji?: string
  statusDetail?: string
  energyPercent?: number
  isDizzy?: boolean
  isSleeping?: boolean
  isFocusing?: boolean
  isCosmic?: boolean
  onClick?: () => void
  onSwipe?: (direction: 'left' | 'right') => void
  followCursor?: boolean
  showTooltip?: boolean
  tooltipPlacement?: 'right' | 'center'
  className?: string
}

export const BloubAvatar: React.FC<BloubAvatarProps> = ({
  state = 'idle',
  size = 218,
  theme = 'light',
  statusLabel,
  statusEmoji,
  statusDetail,
  energyPercent = 50,
  isDizzy = false,
  isSleeping = false,
  isFocusing = false,
  onClick,
  onSwipe,
  followCursor = false,
  showTooltip = true,
  tooltipPlacement = 'right',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const engineRef = useRef<BotEngine | null>(null)
  const touchStartRef = useRef<number | null>(null)
  const uid = useId().replace(/:/g, '-')
  const maskId = `bloub-mask-${uid}`

  const isDark = theme === 'dark'
  const ink = isDark ? '#f4f4f5' : '#181818'
  const paper = isDark ? '#0c0c0c' : '#ffffff'

  // État de la frame rendue (toujours cercle)
  const [frame, setFrame] = useState<BotFrame>(() => {
    const eng = new BotEngine(RAYON, state)
    engineRef.current = eng
    return eng.sample(0)
  })

  // Affichage du popover d'humeur
  const [isHovered, setIsHovered] = useState(false)
  const [showRecentFeedback, setShowRecentFeedback] = useState(false)

  // Tracker d'état courant
  const currentStateRef = useRef<StateId>(state)

  useEffect(() => {
    if (!engineRef.current) return
    if (currentStateRef.current !== state) {
      currentStateRef.current = state
      engineRef.current.setState(state, performance.now() / 1000)
      setShowRecentFeedback(true)
      const t = setTimeout(() => setShowRecentFeedback(false), 3200)
      return () => clearTimeout(t)
    }
  }, [state])

  // Boucle d'animation à 60 FPS avec regard autonome
  useEffect(() => {
    let rafId = 0
    let lastTime = 0
    let clock = 0
    let aiming = false
    let turnSince = 0
    let pointerPos: { x: number; y: number } | null = null
    let nextGazeShift = 0

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      pointerPos = { x: e.clientX, y: e.clientY }
    }

    const onPointerLeave = () => {
      pointerPos = null
    }

    if (followCursor) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerleave', onPointerLeave)
    }

    const loop = (ms: number) => {
      rafId = requestAnimationFrame(loop)
      if (!engineRef.current) return

      const dt = lastTime ? Math.min((ms - lastTime) / 1000, 0.064) : 0
      lastTime = ms
      clock += dt

      // Gestion du regard (autonome tactile ou suivi du pointeur)
      const hasBaseFace = STATE_BY_ID.get(currentStateRef.current)?.baseFace ?? false

      if (!hasBaseFace) {
        if (aiming) {
          engineRef.current.setLook(null, clock, TURN_TIME)
          aiming = false
        }
      } else if (followCursor) {
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect && rect.width > 0 && rect.height > 0) {
          if (!aiming) turnSince = clock
          const halfW = Math.max(1, window.innerWidth / 2)
          const halfH = Math.max(1, window.innerHeight / 2)
          engineRef.current.setLook(
            lookTarget({
              nx: pointerPos ? clamp((pointerPos.x - (rect.left + rect.width / 2)) / halfW, -1, 1) : 0,
              ny: pointerPos ? clamp((pointerPos.y - (rect.top + rect.height / 2)) / halfH, -1, 1) : 0,
              tour: easings.easeOutQuint(clamp((clock - turnSince) / TURN_TIME)),
              pointer: pointerPos !== null,
            }),
            clock
          )
          aiming = true
        }
      } else {
        // Mode autonome tactile : balayage vivant et naturel du regard toutes les 3.5 à 6s
        if (clock >= nextGazeShift) {
          const shiftInterval = 3.5 + Math.random() * 2.5
          nextGazeShift = clock + shiftInterval

          const targets = [
            { yaw: -20, pitch: -8 },   // Regarde la timeline et les activités
            { yaw: -28, pitch: 4 },    // Regarde le numéro du jour à gauche
            { yaw: -6, pitch: -3 },    // Regarde vers l'utilisateur (droit devant)
            { yaw: -15, pitch: -16 },  // Regarde les cartes du bas
            { yaw: -10, pitch: 8 },    // Regard pensif
            { yaw: -24, pitch: -12 },  // Regarde les onglets Jour / Semaine / Mois
          ]
          const chosen = targets[Math.floor(Math.random() * targets.length)]
          engineRef.current.setLook(
            {
              yaw: chosen.yaw,
              pitch: chosen.pitch,
              mix: 1,
              spin: 0,
              wander: 1, // Conserve la micro-dérive vivante
            },
            clock,
            0.65
          )
          aiming = true
        }
      }

      setFrame(engineRef.current.sample(clock))
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      if (followCursor) {
        window.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerleave', onPointerLeave)
      }
    }
  }, [followCursor])

  const R = RAYON
  const VB = DEMI_VIEWBOX

  const isBubbleVisible = isHovered || showRecentFeedback

  // Détection du swipe tactile horizontal
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current
      touchStartRef.current = null
      if (Math.abs(deltaX) > 40) {
        setShowRecentFeedback(true)
        if (onSwipe) {
          onSwipe(deltaX > 0 ? 'right' : 'left')
        }
      }
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bulle d'expression réactive Nothing OS avec jauge d'énergie (sous Bloub pour ne jamais déborder de l'écran) */}
      {showTooltip && statusLabel && (
        <div
          className={`absolute top-full mt-2 pointer-events-none transition-all duration-300 z-50 w-max max-w-[260px] sm:max-w-xs ${
            tooltipPlacement === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-1 sm:right-3'
          } ${
            isBubbleVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-95'
          }`}
        >
          {/* Petite flèche pointant vers le haut vers Bloub */}
          <div
            className={`absolute -top-1.5 w-3 h-3 bg-[#181818] border-l border-t border-white/20 rotate-45 z-10 ${
              tooltipPlacement === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-12 sm:right-16'
            }`}
          />

          <div className="relative px-3.5 py-2.5 rounded-2xl bg-[#181818] text-white shadow-2xl border border-white/20 text-xs font-mono-tech font-bold tracking-wide backdrop-blur-xl flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              {statusEmoji && <span className="text-sm shrink-0">{statusEmoji}</span>}
              <span className="uppercase text-[11px] leading-tight font-extrabold text-white break-words">
                {statusLabel}
              </span>
            </div>

            {statusDetail && (
              <div className="text-[10px] text-zinc-400 font-normal leading-tight break-words">
                {statusDetail}
              </div>
            )}

            {/* Mini jauge d'énergie Nothing OS à points */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[9px] text-zinc-400 font-mono-tech">
              <span className="uppercase tracking-widest text-[8px] font-bold">VITALITÉ</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      (energyPercent / 100) * 6 > i ? 'bg-[#FFA43B]' : 'bg-white/15'
                    }`}
                  />
                ))}
                <span className="text-[#FFA43B] font-bold ml-1">{energyPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tête SVG Bloub tactile */}
      <button
        type="button"
        onClick={() => {
          setShowRecentFeedback(true)
          if (onClick) onClick()
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        title={statusLabel || 'Bloub, compagnon réactif'}
        className="relative cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-[1.02] outline-none rounded-full"
        style={{ width: size, height: size }}
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
          role="img"
          aria-label="Bloub avatar animé"
          className="overflow-visible w-full h-full"
        >
          <defs>
            {/* Masque pour percer les yeux dans la silhouette du corps */}
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x={-VB}
              y={-VB}
              width={VB * 2}
              height={VB * 2}
            >
              <path d={frame.bodyPath} fill="#fff" />
              {frame.eyes.map((eye, i) => (
                <path
                  key={i}
                  d={eye.d}
                  transform={eye.matrix}
                  opacity={eye.alpha}
                  fill="#000"
                />
              ))}
              {frame.notch && (
                <circle
                  cx={frame.notch.x}
                  cy={frame.notch.y}
                  r={frame.notch.r}
                  fill="#000"
                />
              )}
            </mask>

            {/* Dégradés des arcs */}
            {frame.arcs.map((arc) => (
              <linearGradient
                key={arc.id}
                id={`${uid}-${arc.id}`}
                gradientUnits="userSpaceOnUse"
                x1={arc.grad.x1}
                y1={arc.grad.y1}
                x2={arc.grad.x2}
                y2={arc.grad.y2}
              >
                {arc.grad.stops.map((c, i) => (
                  <stop
                    key={i}
                    offset={i / (arc.grad.stops.length - 1)}
                    stopColor={c}
                  />
                ))}
              </linearGradient>
            ))}
          </defs>

          {/* Moitié arrière des orbites */}
          <g fill="none" strokeLinecap="round">
            {frame.arcs.map((arc) => (
              <path
                key={`b${arc.id}`}
                d={arc.back}
                stroke={`url(#${uid}-${arc.id})`}
                strokeWidth={arc.width}
                opacity={arc.opacity}
              />
            ))}
          </g>

          {/* Particules derrière le corps */}
          {frame.dotsBehind && (
            <g>
              {frame.dots.map((dot, i) => {
                const fill = dot.color ?? (dot.depth === undefined ? ink : mixHex(paper, ink, dot.depth))
                return dot.d ? (
                  <path
                    key={`pb${i}`}
                    d={dot.d}
                    fill={fill}
                    opacity={dot.opacity}
                    transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${R})`}
                  />
                ) : (
                  <circle
                    key={`pb${i}`}
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.r}
                    fill={fill}
                    opacity={dot.opacity}
                  />
                )
              })}
            </g>
          )}

          {/* Corps et yeux */}
          <g opacity={frame.bodyAlpha}>
            {/* Fond blanc percé des yeux */}
            <path d={frame.bodyPath} fill={paper} />
            {/* Corps encré avec masque des yeux */}
            <g mask={`url(#${maskId})`}>
              <rect x={-VB} y={-VB} width={VB * 2} height={VB * 2} fill={ink} />
            </g>
          </g>

          {/* Accessoire 1 : Zzz flottants en mode nuit */}
          {(isSleeping || state === 'sleep') && (
            <g style={{ pointerEvents: 'none' }}>
              <text
                x="65"
                y="-60"
                fill={ink}
                fontSize="22"
                fontFamily="Space Mono, monospace"
                fontWeight="bold"
                opacity="0.9"
              >
                Z
              </text>
              <text
                x="88"
                y="-85"
                fill={ink}
                fontSize="17"
                fontFamily="Space Mono, monospace"
                fontWeight="bold"
                opacity="0.65"
              >
                z
              </text>
              <text
                x="105"
                y="-105"
                fill={ink}
                fontSize="13"
                fontFamily="Space Mono, monospace"
                fontWeight="bold"
                opacity="0.4"
              >
                z
              </text>
            </g>
          )}

          {/* Accessoire 2 : LED rouge Glyph clignotante en mode Focus / Pomodoro */}
          {(isFocusing || state === 'thinking') && (
            <g style={{ pointerEvents: 'none' }}>
              <circle cx="85" cy="-80" r="10" fill="#d71921" opacity="0.3" className="animate-ping" />
              <circle cx="85" cy="-80" r="5" fill="#d71921" />
              <text
                x="68"
                y="-62"
                fill="#d71921"
                fontSize="9"
                fontFamily="Space Mono, monospace"
                fontWeight="bold"
                letterSpacing="1"
              >
                ● REC
              </text>
            </g>
          )}

          {/* Accessoire 3 : Étoiles d'étourdissement en cas de spam de taps */}
          {isDizzy && (
            <g style={{ pointerEvents: 'none' }}>
              <text x="-40" y="-85" fontSize="20">
                💫
              </text>
              <text x="25" y="-95" fontSize="20">
                🌀
              </text>
            </g>
          )}

          {/* Particules devant le corps */}
          {!frame.dotsBehind && (
            <g>
              {frame.dots.map((dot, i) => {
                const fill = dot.color ?? (dot.depth === undefined ? ink : mixHex(paper, ink, dot.depth))
                return dot.d ? (
                  <path
                    key={`pf${i}`}
                    d={dot.d}
                    fill={fill}
                    opacity={dot.opacity}
                    transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${R})`}
                  />
                ) : (
                  <circle
                    key={`pf${i}`}
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.r}
                    fill={fill}
                    opacity={dot.opacity}
                  />
                )
              })}
            </g>
          )}

          {/* Notification blue dot */}
          {frame.notif && (
            <circle
              cx={frame.notif.x}
              cy={frame.notif.y}
              r={frame.notif.r}
              fill={NOTIF_BLUE}
            />
          )}

          {/* Moitié avant des orbites */}
          <g fill="none" strokeLinecap="round">
            {frame.arcs.map((arc) => (
              <path
                key={`f${arc.id}`}
                d={arc.front}
                stroke={`url(#${uid}-${arc.id})`}
                strokeWidth={arc.width}
                opacity={arc.opacity}
              />
            ))}
          </g>
        </svg>
      </button>
    </div>
  )
}
