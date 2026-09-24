import { useEffect } from 'react'
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react'

export function Count({ value }: { value: number }) {
  const spring = useSpring(value, { visualDuration: 0.45, bounce: 0.2 })
  const text = useTransform(spring, (v) => Math.round(v).toString())
  // MotionConfig does not reach useSpring; with reduced motion the number changes in place.
  const reduce = useReducedMotion()
  useEffect(() => (reduce ? spring.jump(value) : spring.set(value)), [spring, value, reduce])
  return (
    <>
      {/* The visible digits animate every frame, so a screen reader must never read them directly. */}
      <motion.span className="num" aria-hidden>{text}</motion.span>
      {/* A separate, visually hidden span holds only the settled value: the live region announces
          the final count once, not each in-flight spring frame. */}
      <span className="sr-only" aria-live="polite">{value}</span>
    </>
  )
}
