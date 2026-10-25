import { useReducedMotion, type Transition } from 'motion/react'

const STANDARD_EASE = [0.4, 0, 0.2, 1] as const
const STAGGER_STEP = 0.025
const STAGGER_CAP = 12

export const sheetSpring = { type: 'spring', visualDuration: 0.5, bounce: 0 } as const
export const sheetFade = { duration: 0.2, ease: 'easeOut' } as const
export const crossfadeOut = { duration: 0.08, ease: 'easeIn' } as const
export const crossfadeIn = { duration: 0.12, ease: 'easeOut' } as const
export const mapInertia = { type: 'inertia', power: 0.3, bounceStiffness: 300, bounceDamping: 30 } as const
export const countSpring = { stiffness: 300, damping: 28 } as const

export const SCRIM_OPACITY = 0.55
export const DIMMED_PIN_OPACITY = 0.4
export const SELECTED_PIN_SCALE = 1.2
export const CHEVRON_TURN = 90
export const TOAST_MS = 1500
export const LAST_PIN_TO_RESULT_MS = 350
export const HERO_IMAGE_WAIT_MS = 300

export interface MotionPresets {
  layout: Transition
  small: Transition
  fade: Transition
  mapSnap: Transition
  pinAppear: Transition
  pinSelect: Transition
  rise: number
  cardSlide: number
  stagger: (index: number) => number
}

const full: MotionPresets = {
  layout: { type: 'spring', stiffness: 400, damping: 40 },
  small: { type: 'spring', stiffness: 1500, damping: 54 },
  fade: { duration: 0.18, ease: STANDARD_EASE },
  mapSnap: { type: 'spring', stiffness: 250, damping: 32 },
  pinAppear: { type: 'spring', stiffness: 300, damping: 28 },
  pinSelect: { type: 'spring', stiffness: 400, damping: 30 },
  rise: 8,
  cardSlide: 12,
  stagger: (index) => Math.min(index, STAGGER_CAP) * STAGGER_STEP,
}

const instant: Transition = { duration: 0 }
const reducedFade: Transition = { duration: 0.12 }

const reduced: MotionPresets = {
  layout: instant,
  small: instant,
  fade: reducedFade,
  mapSnap: reducedFade,
  pinAppear: reducedFade,
  pinSelect: instant,
  rise: 0,
  cardSlide: 0,
  stagger: () => 0,
}

export function useMotion(): MotionPresets {
  return useReducedMotion() ? reduced : full
}

export const screenArrival = { returning: false }

export function staggered(m: MotionPresets, index: number) {
  const delay = m.stagger(index)
  return {
    initial: screenArrival.returning ? false : { opacity: 0, y: m.rise },
    animate: { opacity: 1, y: 0 },
    transition: { ...m.layout, delay, opacity: { ...m.fade, delay } },
  }
}
