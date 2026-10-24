import { useEffect } from 'react'
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react'

export function Count({ value, phrase }: { value: number; phrase: string }) {
  const spring = useSpring(value, { visualDuration: 0.45, bounce: 0.2 })
  const text = useTransform(spring, (v) => Math.round(v).toString())
  // MotionConfig does not reach useSpring.
  const reduce = useReducedMotion()
  useEffect(() => (reduce ? spring.jump(value) : spring.set(value)), [spring, value, reduce])
  return (
    <>
      <motion.span className="num" aria-hidden>{text}</motion.span>
      <span className="sr-only" aria-live="polite">{phrase}</span>
    </>
  )
}
