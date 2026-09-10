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
  onClick?: () => void
  followCursor?: boolean
  showTooltip?: boolean
  className?: string
}

export const BloubAvatar: React.FC<BloubAvatarProps> = ({
  state = 'idle',
  size = 62,
  theme = 'light',
  statusLabel,
  statusEmoji,
  statusDetail,
  onClick,
  followCursor = true,
  showTooltip = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const engineRef = useRef<BotEngine | null>(null)
  const uid = useId().replace(/:/g, '-')
  const maskId = `bloub-mask-${uid}`

  const isDark = theme === 'dark'
  const ink = isDark ? '#f4f4f5' : '#181818'
  const paper = isDark ? '#0c0c0c' : '#ffffff'

  // État de la frame rendue
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
      const t = setTimeout(() => setShowRecentFeedback(false), 2600)
      return () => clearTimeout(t)
    }
  }, [state])

  // Boucle d'animation à 60 FPS
  useEffect(() => {
    let rafId = 0
    let lastTime = 0
    let clock = 0
    let aiming = false
    let turnSince = 0
    let pointerPos: { x: number; y: number } | null = null

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

      // Suivi du regard
      if (followCursor) {
        const hasBaseFace = STATE_BY_ID.get(currentStateRef.current)?.baseFace ?? false
        if (!hasBaseFace) {
          if (aiming) {
            engineRef.current.setLook(null, clock, TURN_TIME)
            aiming = false
          }
        } else {
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

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bulle d'expression réactive Nothing OS */}
      {showTooltip && statusLabel && (
        <div
          className={`absolute bottom-full mb-1.5 right-0 pointer-events-none transition-all duration-300 z-50 whitespace-nowrap ${
            isBubbleVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-1.5 scale-95'
          }`}
        >
          <div className="px-2.5 py-1 rounded-full bg-[#181818] text-white shadow-xl border border-white/20 text-[10px] font-mono-tech font-bold tracking-wide flex items-center gap-1.5 backdrop-blur-md">
            {statusEmoji && <span className="text-xs">{statusEmoji}</span>}
            <span className="uppercase text-[10px]">{statusLabel}</span>
            {statusDetail && (
              <span className="text-[9px] text-zinc-400 font-normal border-l border-white/20 pl-1.5 hidden sm:inline">
                {statusDetail}
              </span>
            )}
          </div>
          {/* Petite flèche */}
          <div className="w-2 h-2 bg-[#181818] border-r border-b border-white/20 rotate-45 mx-auto -mt-1 mr-4" />
        </div>
      )}

      {/* Tête SVG Bloub */}
      <button
        type="button"
        onClick={onClick}
        title={statusLabel || 'Bloub, avatar réactif'}
        className="relative cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-105 outline-none focus:ring-2 focus:ring-black/20 rounded-full"
        style={{ width: size, height: size }}
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
          role="img"
          aria-label="Bloub avatar animé"
          className="overflow-visible"
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

          {/* Particules derrière le corps (état burst) */}
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
            {/* Fond des yeux percé */}
            <path d={frame.bodyPath} fill={paper} />
            {/* Corps encré avec masque des yeux */}
            <g mask={`url(#${maskId})`}>
              <rect x={-VB} y={-VB} width={VB * 2} height={VB * 2} fill={ink} />
            </g>
          </g>

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
