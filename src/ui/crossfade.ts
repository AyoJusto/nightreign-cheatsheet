import { animate, type MotionValue } from 'motion/react'
import { crossfadeIn, crossfadeOut } from './motion'

export function crossfade(opacity: MotionValue<number>, jump: () => void) {
  animate(opacity, 0, crossfadeOut).then(() => {
    jump()
    animate(opacity, 1, crossfadeIn)
  })
}
