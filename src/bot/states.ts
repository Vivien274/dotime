import {
  COMET_RIBBONS,
  NOTIF_ANGLE,
  NOTIF_DIST,
  NOTIF_MARGIN,
  NOTIF_POP,
  NOTIF_R,
  RINGS,
  SWOOSH,
  particles,
  type ArcSpec,
  type DotRender
} from './decor'
import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE, type HeadGaze } from './face'
import { TAU, clamp, easings } from './math'
import {
  circle,
  type Silhouette
} from './shape'

export interface EyeCfg {
  /** largeur locale (axe court de la gelule), en unites de rayon de boule */
  w: number
  /** hauteur locale (axe long) */
  h: number
  /** 1 = ouvert, 0 = ferme */
  open: number
  /**
   * Inclinaison propre de la gelule, en degres, positif = le haut part a
   * droite. Appliquee APRES le repere tangent de la sphere. Sans elle, les deux
   * yeux penchent forcement du meme cote (le roulis de tete) et la colere comme
   * la tristesse, qui demandent des inclinaisons en miroir, sont hors de portee.
   */
  tilt?: number
}

export interface Pose {
  /** silhouette du corps, en unites de rayon de boule */
  sil: Silhouette
  /** decalage global du corps ET des yeux */
  offX: number
  offY: number
  gaze: HeadGaze
  /** demi-ecart des yeux sur la sphere, en degres */
  split: number
  /** [oeil interieur, oeil exterieur] */
  eyes: [EyeCfg, EyeCfg]
  /** opacite des yeux : sert aux etats sans visage */
  eyeAlpha: number
  bodyAlpha: number
  dots: DotRender[]
  arcs: ArcSpec[]
  notif: { x: number; y: number; r: number; notch: number } | null
  /** true = le decor passe derriere le corps (particules de l'eclatement) */
  dotsBehind: boolean
}

const pair = (w: number, h: number): [EyeCfg, EyeCfg] => [
  { w, h, open: 1 },
  { w, h, open: 1 }
]

function base(over: Partial<Pose> = {}): Pose {
  return {
    sil: circle(1),
    offX: 0,
    offY: 0,
    gaze: { ...REST_GAZE },
    split: EYE_SPLIT,
    eyes: pair(EYE_W, EYE_H),
    eyeAlpha: 1,
    bodyAlpha: 1,
    dots: [],
    arcs: [],
    notif: null,
    dotsBehind: false,
    ...over
  }
}

/* ------------------------------------------------------------------ etats */

export type StateId =
  | 'idle'
  | 'thinking'
  | 'wink'
  | 'wide'
  | 'alert'
  | 'notify'
  | 'exclaim'
  | 'sleep'
  | 'egg'
  | 'hexagon'
  | 'play'
  | 'orbit'
  | 'burst'
  | 'comet'
  /** transition d'interface, pas une animation du catalogue : hors `SEQUENCE` */
  | 'swirl'

export interface StateDef {
  id: StateId
  /** duree de maintien quand la sequence complete est jouee */
  duration: number
  /**
   * duree en dessous de laquelle l'animation est coupee avant d'aboutir : le
   * "!" ne revient pas, le corps reste eclate. Elle se lit dans les constantes
   * de `pose` ci-dessous, elle ne se choisit pas. Absente = l'etat ignore le
   * temps ou boucle, n'importe quelle duree lui va (voir `MIN_BLOCK`).
   */
  minDuration?: number
  /** duree du morph d'entree */
  morph: number
  /** true = l'entree est masquee par un clignement, comme dans la video */
  blinkIn: boolean
  /**
   * true = le corps est la silhouette "au repos", donc remplacable par la forme
   * choisie dans le personnalisateur. Les etats qui dessinent leur propre forme
   * (le "!", les points, l'oeuf, le triangle...) valent false : c'est cette forme
   * la qui EST l'animation.
   */
  baseBody: boolean
  /**
   * true = l'etat porte le visage "au repos", donc remplacable par l'expression
   * choisie. Seul `idle` : les autres etats a visage ont une expression relevee
   * sur la video, c'est precisement ce qu'on reproduit.
   */
  baseFace: boolean
  pose(local: number): Pose
}

export const STATES: StateDef[] = [
  {
    id: 'idle',
    duration: 2.4,
    morph: 0.45,
    blinkIn: false,
    baseFace: true,
    baseBody: true,
    pose: () => base()
  },

  {
    id: 'thinking',
    duration: 2.6,
    morph: 0.4,
    baseFace: true,
    baseBody: true,
    blinkIn: true,
    pose: (t) => {
      const p = Math.sin(t * (TAU / 2.6))
      return base({
        sil: circle(1),
        gaze: { yaw: 24 + p * 4, pitch: 18 + p * 3, roll: 6 },
        split: 16,
        eyes: pair(0.24, 0.36)
      })
    }
  },

  {
    id: 'wink',
    duration: 1.6,
    morph: 0.3,
    blinkIn: false,
    baseFace: false,
    baseBody: true,
    pose: (t) => {
      // Clin d'œil dynamique : clin d'œil marqué sur les premières secondes, puis réouverture naturelle
      const reopen = easings.easeOutCubic(clamp((t - 1.0) / 0.35))
      const eyeClosedW = 0.447
      const eyeClosedH = 0.089
      const rightW = eyeClosedW + (EYE_W - eyeClosedW) * reopen
      const rightH = eyeClosedH + (EYE_H - eyeClosedH) * reopen
      const leftW = 0.236 + (EYE_W - 0.236) * reopen
      const leftH = 0.464 + (EYE_H - 0.464) * reopen

      return base({
        gaze: {
          yaw: -5.37 * (1 - reopen) + REST_GAZE.yaw * reopen,
          pitch: 4.55 * (1 - reopen) + REST_GAZE.pitch * reopen,
          roll: 6.7 * (1 - reopen)
        },
        split: 16.25 + (EYE_SPLIT - 16.25) * reopen,
        eyes: [
          { w: leftW, h: leftH, open: 1 },
          { w: rightW, h: rightH, open: 1 }
        ]
      })
    }
  },

  {
    id: 'wide',
    duration: 1.8,
    morph: 0.55,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: () =>
      base({
        gaze: { yaw: 6.92, pitch: -21.96, roll: 11.6 },
        split: 18.43,
        eyes: pair(0.356, 0.875)
      })
  },

  {
    id: 'alert',
    duration: 2.4,
    minDuration: 2,
    morph: 0.45,
    baseFace: true,
    baseBody: true,
    blinkIn: false,
    pose: (t) => {
      const buzz = Math.sin(t * 5 * TAU) * 0.03 * Math.max(0, 1 - t / 1.6)
      return base({
        sil: circle(1, { cx: buzz }),
        gaze: { yaw: 0, pitch: 8, roll: 0 },
        split: 22,
        eyes: pair(0.38, 0.44)
      })
    }
  },

  {
    id: 'notify',
    duration: 2.2,
    morph: 0.5,
    blinkIn: true,
    baseFace: false,
    baseBody: true,
    pose: (t) => {
      // Pop du point bleu : pic a +14 % vers 0.3 s puis stabilisation.
      const p = clamp(t / 0.45)
      const pop = 1 + (NOTIF_POP - 1) * Math.sin(p * Math.PI) * (1 - p * 0.35)
      const r = NOTIF_R * (p < 1 ? pop : 1)
      const a = (NOTIF_ANGLE * Math.PI) / 180
      return base({
        // le regard part a l'oppose de la pastille
        gaze: { yaw: -21.94, pitch: -5.82, roll: -12.2 },
        split: 18.89,
        eyes: pair(0.505, 0.498),
        notif: {
          x: Math.cos(a) * NOTIF_DIST,
          y: Math.sin(a) * NOTIF_DIST,
          r,
          notch: r + NOTIF_MARGIN
        }
      })
    }
  },

  {
    id: 'exclaim',
    duration: 2,
    morph: 0.45,
    baseFace: true,
    baseBody: true,
    blinkIn: false,
    pose: () =>
      base({
        sil: circle(1),
        gaze: { yaw: 0, pitch: 14, roll: 0 },
        split: 20,
        eyes: pair(0.36, 0.46)
      })
  },

  {
    id: 'sleep',
    duration: 2.4,
    morph: 0.5,
    baseFace: false,
    baseBody: true,
    blinkIn: false,
    pose: (t) =>
      base({
        sil: circle(1, { cy: 0.04 + Math.sin(t * (TAU / 2.4)) * 0.05 }),
        gaze: { yaw: 0, pitch: -16, roll: 0 },
        split: 16,
        eyes: [
          { w: 0.36, h: 0.06, open: 0.1 },
          { w: 0.36, h: 0.06, open: 0.1 }
        ]
      })
  },

  {
    id: 'egg',
    duration: 1.8,
    morph: 0.4,
    baseFace: true,
    baseBody: true,
    blinkIn: true,
    pose: () =>
      base({
        sil: circle(1),
        gaze: { yaw: 19.97, pitch: 26.01, roll: -17.1 },
        split: 14,
        eyes: pair(0.2, 0.38)
      })
  },

  {
    id: 'hexagon',
    duration: 1.6,
    morph: 0.4,
    baseFace: true,
    baseBody: true,
    blinkIn: true,
    pose: () =>
      base({
        sil: circle(1),
        gaze: { yaw: 23.11, pitch: 24.42, roll: -13.3 },
        split: 15,
        eyes: pair(0.22, 0.4)
      })
  },

  {
    id: 'play',
    duration: 2,
    morph: 0.5,
    baseFace: true,
    baseBody: true,
    blinkIn: true,
    pose: (t) => {
      const fade = clamp(t / 0.35) * clamp((2.2 - t) / 0.5)
      return base({
        sil: circle(1),
        gaze: { yaw: 12, pitch: -8, roll: -6 },
        split: 15,
        eyes: pair(0.22, 0.34),
        arcs: SWOOSH.map((s, i) => ({
          id: `sw${i}`,
          seed: { ...s, cx: 0.45 - t * 0.42 },
          t,
          opacity: fade
        }))
      })
    }
  },

  {
    id: 'orbit',
    duration: 3.4,
    minDuration: 2.5,
    morph: 0.6,
    baseFace: true,
    baseBody: true,
    blinkIn: false,
    pose: (t) => {
      const back = easings.easeInOutCubic(clamp((t - 1.6) / 0.9))
      const fade = clamp(t / 0.8) * clamp((3.6 - t) / 0.9)
      return base({
        sil: circle(1),
        gaze: {
          yaw: REST_GAZE.yaw + Math.sin(t * 6.5) * 65 * (1 - back),
          pitch: -4 + back * 32,
          roll: -13
        },
        eyes: pair(0.22, 0.34 + back * 0.07),
        arcs: RINGS.map((s, i) => ({
          id: `rg${i}`,
          seed: s,
          t,
          opacity: fade * clamp((t - i * 0.13) / 0.3)
        }))
      })
    }
  },

  {
    /**
     * Entree dans la vue des reglages.
     *
     * SEUL etat qui n'est pas releve sur la video : il est CHOISI, comme la
     * couleur `--ink`. Il emprunte le vocabulaire d'`orbit` — les memes anneaux,
     * avec leurs parametres mesures — mais coupe court : 1 s au lieu de 3,4, la
     * moitie des anneaux, et aucun triangle.
     *
     * Les deux drapeaux a `true` sont tout l'interet de cet etat :
     *
     * - `baseBody` laisse la forme choisie remplacer le corps, donc la vue peut
     *   imposer le cercle et le galet ou la goutte y MORPHENT au lieu de sauter ;
     * - `baseFace` fait porter le visage de repos, donc le suivi du curseur
     *   s'applique des cette entree. Un etat qui aurait sa propre pose de regard
     *   (comme `orbit`) rendrait la main a l'etat suivant en pleine course, et
     *   les yeux sauteraient d'un coup a la reprise.
     *
     * Il n'est volontairement PAS dans `SEQUENCE` : ce n'est pas une animation du
     * catalogue, c'est une transition d'interface.
     */
    id: 'swirl',
    // un peu plus que le tour du regard (`TURN_TIME`, 1,1 s) : les yeux doivent
    // etre poses a gauche avant que les anneaux ne s'effacent
    duration: 1.3,
    minDuration: 1.3,
    morph: 0.3,
    baseFace: true,
    baseBody: true,
    // le morph de forme est masque par un clignement, comme partout ailleurs
    blinkIn: true,
    pose: (t) =>
      base({
        // trois anneaux sur les six d'`orbit` : la moitie du bouquet suffit a le
        // reconnaitre, et c'est autant d'arcs en moins a rasteriser par image
        arcs: RINGS.slice(0, 3).map((s, i) => ({
          id: `sw${i}`,
          seed: s,
          t,
          // ils entrent l'un apres l'autre puis s'effacent avant la fin du bloc,
          // pour que la reprise au repos se fasse sur une image deja propre
          opacity: clamp((t - i * 0.06) / 0.14) * clamp((1.22 - t) / 0.34)
        }))
      })
  },

  {
    id: 'burst',
    duration: 2.6,
    minDuration: 2.4,
    morph: 0.4,
    baseFace: true,
    baseBody: true,
    blinkIn: false,
    pose: (t) =>
      base({
        sil: circle(1),
        eyeAlpha: 1,
        dots: particles(t, 1),
        dotsBehind: true
      })
  },

  {
    id: 'comet',
    duration: 2.4,
    minDuration: 2.4,
    morph: 0.45,
    baseFace: true,
    baseBody: true,
    blinkIn: false,
    pose: (t) => {
      const fade = clamp((t - 0.15) / 0.25) * clamp((1.95 - t) / 0.3)
      return base({
        sil: circle(1, {
          cy: Math.sin(clamp(t / 1.7) * Math.PI) * 0.035
        }),
        eyeAlpha: 1,
        arcs: COMET_RIBBONS.map((s, i) => ({ id: `cm${i}`, seed: s, t, opacity: fade }))
      })
    }
  }
]

export const STATE_BY_ID = new Map(STATES.map((s) => [s.id, s]))

/** Ordre de lecture de la sequence complete, calque sur la video de reference. */
/**
 * Date, en temps local, ou chaque etat est le plus lisible : c'est la pose que
 * montrent les vignettes et la planche. Rendu deterministe, donc comparable
 * d'une execution a l'autre. Le type force a couvrir tout nouvel etat.
 */
export const POSES: Record<StateId, number> = {
  idle: 1,
  thinking: 1.1,
  wink: 0.8,
  wide: 0.8,
  alert: 0.75,
  notify: 0.9,
  exclaim: 0.8,
  sleep: 0.45,
  egg: 0.8,
  hexagon: 0.8,
  play: 0.9,
  orbit: 1.2,
  swirl: 0.5,
  burst: 0.45,
  comet: 1.15
}

export const SEQUENCE: StateId[] = [
  'idle',
  'thinking',
  'wink',
  'wide',
  'alert',
  'notify',
  'exclaim',
  'sleep',
  'egg',
  'hexagon',
  'play',
  'orbit',
  'burst',
  'comet'
]
