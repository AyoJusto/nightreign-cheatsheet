import { animate, type MotionValue } from 'motion/react'

/**
 * Reduced motion's stand-in for a move: fade out, `jump`, fade back in, about 200ms in all and opacity only.
 * MotionConfig's reducedMotion reaches declarative animations only, so imperative moves call this themselves.
 * A crossfade cut short by another one never runs its `jump`; the later one's does.
 */
export function crossfade(opacity: MotionValue<number>, jump: () => void) {
  animate(opacity, 0, { duration: 0.08, ease: 'easeIn' }).then(() => {
    jump()
    animate(opacity, 1, { duration: 0.12, ease: 'easeOut' })
  })
}
