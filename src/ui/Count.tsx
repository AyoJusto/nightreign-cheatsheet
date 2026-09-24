import { useEffect } from 'react'
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react'

/** `phrase` is what the live region says for the settled value; the words shown around the digits should be aria-hidden. */
export function Count({ value, phrase }: { value: number; phrase: string }) {
  const spring = useSpring(value, { visualDuration: 0.45, bounce: 0.2 })
  const text = useTransform(spring, (v) => Math.round(v).toString())
  // MotionConfig does not reach useSpring; with reduced motion the number changes in place.
  const reduce = useReducedMotion()
  useEffect(() => (reduce ? spring.jump(value) : spring.set(value)), [spring, value, reduce])
  return (
    <>
      {/* The visible digits animate every frame, so a screen reader must never read them directly. */}
      <motion.span className="num" aria-hidden>{text}</motion.span>
      {/* A separate, visually hidden span holds the settled value in its full phrase ("3 possible", not "3"):
          the live region announces the final count once, not each in-flight spring frame. */}
      <span className="sr-only" aria-live="polite">{phrase}</span>
    </>
  )
}
