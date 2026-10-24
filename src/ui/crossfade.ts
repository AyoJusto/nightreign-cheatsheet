import { animate, type MotionValue } from 'motion/react'

export function crossfade(opacity: MotionValue<number>, jump: () => void) {
  animate(opacity, 0, { duration: 0.08, ease: 'easeIn' }).then(() => {
    jump()
    animate(opacity, 1, { duration: 0.12, ease: 'easeOut' })
  })
}
