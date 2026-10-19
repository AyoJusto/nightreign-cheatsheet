import { animate, type MotionValue } from 'motion/react'

/** Reduced motion's stand-in for a move. A crossfade cut short by another never runs its `jump`. */
export function crossfade(opacity: MotionValue<number>, jump: () => void) {
  animate(opacity, 0, { duration: 0.08, ease: 'easeIn' }).then(() => {
    jump()
    animate(opacity, 1, { duration: 0.12, ease: 'easeOut' })
  })
}
