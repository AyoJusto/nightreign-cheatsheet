import { useCallback } from 'react'
import type { MotionValue } from 'motion/react'

export function useMeasure(target: MotionValue<number>, pureMeasure: (el: HTMLElement) => number) {
  return useCallback((el: HTMLElement | null) => {
    if (!el) return
    const update = () => target.set(pureMeasure(el))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])
}

export const pillBottom = (el: HTMLElement) => el.getBoundingClientRect().bottom
