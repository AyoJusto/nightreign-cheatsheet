import { useCallback, type ComponentProps, type SyntheticEvent } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { useMotion } from './motion'

export function FadeImg({ onLoad, style, ...props }: ComponentProps<typeof motion.img>) {
  const m = useMotion()
  const opacity = useMotionValue(1)
  const hideUntilLoaded = useCallback((el: HTMLImageElement | null) => {
    if (el && !el.complete) opacity.set(0)
  }, [opacity])
  const show = (e: SyntheticEvent<HTMLImageElement>) => {
    animate(opacity, 1, m.fade)
    onLoad?.(e)
  }
  return <motion.img ref={hideUntilLoaded} {...props} style={{ ...style, opacity }} onLoad={show} />
}
