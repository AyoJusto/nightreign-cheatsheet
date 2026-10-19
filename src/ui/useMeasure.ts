import { useCallback } from 'react'
import type { MotionValue } from 'motion/react'

/** Callback ref that keeps `target` at `measure(el)` whenever the element resizes. */
export function useMeasure(target: MotionValue<number>, measure: (el: HTMLElement) => number) {
  // measure is read once per element; callers pass pure functions of the element.
  return useCallback((el: HTMLElement | null) => {
    if (!el) return
    const update = () => target.set(measure(el))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])
}

export const pillBottom = (el: HTMLElement) => el.getBoundingClientRect().bottom
